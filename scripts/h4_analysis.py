import os
from supabase import create_client
import pandas as pd
from dotenv import load_dotenv
import statsmodels.formula.api as smf
import numpy as np
from statsmodels.genmod.families import Binomial
from scipy.stats import chi2
from statsmodels.stats.multitest import multipletests
import matplotlib.pyplot as plt

load_dotenv()

# supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# creating client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_all_rows(supabase, table_name):
    all_data = []
    batch_size = 1000
    offset = 0

    while True:
        response = supabase.table(table_name)\
            .select("HHID, SCREENTIME, K2Q31A, K2Q31B, K2Q32A, K2Q32B, K2Q33A, K2Q33B, "\
                    "PHYSACTIV, SC_SEX, FWC, STRATUM, FIPSST, AGE_GROUP, SC_AGE_YEARS, "\
                    "FPL, SC_RACE_R, HIGRADE_TVIS")\
            .range(offset, offset + batch_size - 1)\
            .execute()

        batch = response.data
        if not batch:
            break

        all_data.extend(batch)
        offset += batch_size
        print(f"Fetched {len(all_data)} rows...")

        if len(batch) < batch_size:
            break

    return pd.DataFrame(all_data)

df = fetch_all_rows(supabase, "nsch_data")
print(f"\nTotal rows fetched: {len(df):,}")

df['STRATUM'] = df['STRATUM'].replace('2a', '2')
df['STRATA_CROSSED'] = df['FIPSST'].astype(str) + '_' + df['STRATUM'].astype(str)

df = df.rename(columns={
    'SC_AGE_YEARS': 'AGE',
    'SC_SEX': 'SEX',
})

# convert numeric columns
for col in ['SCREENTIME', 'AGE', 'FWC', 'PHYSACTIV', 'SC_RACE_R', 'HIGRADE_TVIS', 'FPL']:
    df[col] = pd.to_numeric(df[col], errors='coerce')

# binary outcome definitions — ever diagnosed AND currently has
df['ADHD'] = (
    (df['K2Q31A'] == 1) & (df['K2Q31B'] == 1)
).astype(int)

df['ANXIETY'] = (
    (df['K2Q33A'] == 1) & (df['K2Q33B'] == 1)
).astype(int)

df['DEPRESSION'] = (
    (df['K2Q32A'] == 1) & (df['K2Q32B'] == 1)
).astype(int)

# physical activity — dichotomized
df['LOW_PHYSACTIV'] = (df['PHYSACTIV'] <= 2).astype(int)

# FPL binning — use include_lowest=True so values at exactly 0 are included
# this fixes the 0-99% group being dropped
df['FPL_GROUP'] = pd.cut(
    df['FPL'],
    bins=[0, 99, 199, 399, float('inf')],
    labels=['0–99%', '100–199%', '200–399%', '400%+'],
    right=True,
    include_lowest=True  # includes 0 in the first bin
)

# normalize FWC
df['FWC_norm'] = df['FWC'] / df['FWC'].mean()

# confirm FPL binning worked
print(f"\nFPL_GROUP value counts:")
print(df['FPL_GROUP'].value_counts(dropna=False).sort_index())

# report outcome prevalence
print(f"\nOutcome prevalence:")
print(f"  ADHD:          {df['ADHD'].mean():.1%}")
print(f"  Anxiety:       {df['ANXIETY'].mean():.1%}")
print(f"  Depression:    {df['DEPRESSION'].mean():.1%}")
print(f"  Low PhysActiv: {df['LOW_PHYSACTIV'].mean():.1%}")

# helper function to print odds ratios
def print_odds_ratios(model, label):
    print(f"\n{'='*60}")
    print(f"{label} — Odds Ratios")
    print('='*60)
    print(pd.DataFrame({
        'OR'     : np.exp(model.params),
        'CI_low' : np.exp(model.conf_int()[0]),
        'CI_high': np.exp(model.conf_int()[1]),
        'p_value': model.pvalues
    }).round(3))

moderators = ['FPL_GROUP', 'SC_RACE_R', 'HIGRADE_TVIS']

moderator_labels = {
    'FPL_GROUP':    'Family Income',
    'SC_RACE_R':    'Race/Ethnicity',
    'HIGRADE_TVIS': 'Parental Education'
}

outcome_labels = {
    'ADHD':          'ADHD',
    'ANXIETY':       'Anxiety',
    'DEPRESSION':    'Depression',
    'LOW_PHYSACTIV': 'Physical Activity'
}

outcome_age_map = {
    'ADHD':          ['0-5', '6-11', '12-17'],
    'ANXIETY':       ['0-5', '6-11', '12-17'],
    'DEPRESSION':    ['0-5', '6-11', '12-17'],
    'LOW_PHYSACTIV': ['6-11', '12-17']
}

all_results = []
saved_models = {}

print("\nRunning H4 moderation models...")
print("="*70)

for outcome, age_groups in outcome_age_map.items():
    for age_group in age_groups:
        sub = df[df['AGE_GROUP'] == age_group].copy()
        sub['FWC_norm'] = sub['FWC'] / sub['FWC'].mean()

        for moderator in moderators:
            df_model = sub.dropna(
                subset=[outcome, 'SCREENTIME', moderator, 'SEX', 'FWC_norm']
            ).copy()

            try:
                full = smf.glm(
                    f'{outcome} ~ SCREENTIME * C({moderator}) + C(SEX)',
                    data=df_model,
                    family=Binomial(),
                    var_weights=df_model['FWC_norm']
                ).fit()

                reduced = smf.glm(
                    f'{outcome} ~ SCREENTIME + C({moderator}) + C(SEX)',
                    data=df_model,
                    family=Binomial(),
                    var_weights=df_model['FWC_norm']
                ).fit()

                lr_stat = 2 * (full.llf - reduced.llf)
                lr_df   = full.df_model - reduced.df_model
                lr_p    = chi2.sf(lr_stat, lr_df)

                model_key = f"{age_group}_{outcome}_{moderator}"
                saved_models[model_key] = {
                    'full':      full,
                    'reduced':   reduced,
                    'data':      df_model,
                    'moderator': moderator,
                    'outcome':   outcome,
                    'age_group': age_group
                }

                all_results.append({
                    'age_group':   age_group,
                    'outcome':     outcome_labels[outcome],
                    'moderator':   moderator_labels[moderator],
                    'model_key':   model_key,
                    'p_value':     round(lr_p, 4),
                    'aic_full':    round(full.aic, 2),
                    'aic_reduced': round(reduced.aic, 2),
                    'n':           len(df_model),
                })

                print(f"✓ {age_group} | {outcome_labels[outcome]:<20} "
                      f"| {moderator_labels[moderator]:<22} "
                      f"p={lr_p:.4f}  n={len(df_model):,}")

            except Exception as e:
                print(f"✗ {age_group} | {outcome_labels[outcome]} "
                      f"| {moderator_labels[moderator]} — {e}")

results_df = pd.DataFrame(all_results)

rejected, p_corrected, _, _ = multipletests(
    results_df['p_value'], method='fdr_bh'
)

results_df['p_corrected'] = p_corrected.round(4)
results_df['significant']  = rejected

print("\n" + "="*70)
print("H4 MODERATION RESULTS — FDR CORRECTED")
print("="*70)
print(results_df[['age_group', 'outcome', 'moderator',
                   'p_value', 'p_corrected', 'significant', 'n']]
      .sort_values('p_value')
      .to_string(index=False))

os.makedirs('visualizations', exist_ok=True)
results_df.drop(columns=['model_key']).to_csv(
    'visualizations/h4_moderation_results.csv', index=False
)
print("\nSaved → visualizations/h4_moderation_results.csv")

sig_results = results_df[results_df['significant'] == True]
print(f"\n{len(sig_results)} of {len(results_df)} models significant after FDR correction")

for _, row in sig_results.iterrows():
    model_key = row['model_key']
    model_data = saved_models[model_key]
    print_odds_ratios(
        model_data['full'],
        f"{row['age_group']} | {row['outcome']} x {row['moderator']}"
    )

screentime_range = np.linspace(1, 5, 100)
screentime_labels = ['<1 hr', '1 hr', '2 hrs', '3 hrs', '4+ hrs']

income_labels_plot = {
    '0–99%':    '0–99%',
    '100–199%': '100–199%',
    '200–399%': '200–399%',
    '400%+':    '400%+',
}
income_colors = ['#e74c3c', '#f39c12', '#27ae60', '#3498db']

race_labels_plot = {1: 'White', 2: 'Black', 3: 'Hispanic', 4: 'Asian', 5: 'Other'}
race_colors = ['#3498db', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c']

educ_labels_plot = {1: '<High School', 2: 'High School', 3: 'Some College', 4: "Bachelor's+"}
educ_colors = ['#e74c3c', '#f39c12', '#3498db', '#27ae60']

moderator_plot_config = {
    'FPL_GROUP':    (income_labels_plot, income_colors),
    'SC_RACE_R':    (race_labels_plot,   race_colors),
    'HIGRADE_TVIS': (educ_labels_plot,   educ_colors),
}

for _, row in sig_results.iterrows():
    model_key  = row['model_key']
    model_data = saved_models[model_key]
    full_model = model_data['full']
    moderator  = model_data['moderator']
    outcome    = model_data['outcome']
    age_group  = model_data['age_group']

    label_map, colors = moderator_plot_config[moderator]
    params    = full_model.params
    mod_label = moderator_labels[moderator]
    out_label = outcome_labels[outcome]

    fig, ax = plt.subplots(figsize=(8, 5))

    for (code, label), color in zip(label_map.items(), colors):
        try:
            group_key    = f'C({moderator})[T.{code}]'
            int_key      = f'SCREENTIME:C({moderator})[T.{code}]'
            is_reference = group_key not in params.index

            if is_reference:
                log_odds = (params['Intercept'] +
                            params['SCREENTIME'] * screentime_range)
            else:
                log_odds = (params['Intercept'] +
                            params.get(group_key, 0) +
                            params['SCREENTIME'] * screentime_range +
                            params.get(int_key, 0) * screentime_range)

            prob = 1 / (1 + np.exp(-log_odds))
            ax.plot(screentime_range, prob * 100, color=color,
                    linewidth=2.5, label=label)

        except Exception as e:
            print(f"  Plot error for {label}: {e}")
            continue

    ax.set_xticks([1, 2, 3, 4, 5])
    ax.set_xticklabels(screentime_labels)
    ax.set_xlabel('Daily Screen Time')
    ax.set_ylabel(f'Predicted Probability of {out_label} (%)')
    ax.set_title(f'H4 — {out_label} by Screen Time and {mod_label}\n'
                 f'(Age group: {age_group}, FDR p = {row["p_corrected"]})')
    ax.legend(title=mod_label, fontsize=9)
    ax.grid(True, alpha=0.3)
    plt.tight_layout()

    save_name = (f'visualizations/h4_{outcome.lower()}_'
                 f'{moderator.lower()}_{age_group.replace("-", "_")}.png')
    plt.savefig(save_name, dpi=150, bbox_inches='tight')
    plt.show()
    print(f"  Saved → {save_name}")

print(f"   {len(sig_results)} significant moderations found after FDR correction.")
print(f"   Full results saved to visualizations/h4_moderation_results.csv")