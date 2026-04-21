import os
from supabase import create_client, Client
import pandas as pd
from dotenv import load_dotenv
import statsmodels.formula.api as smf
import numpy as np
from statsmodels.genmod.families import Binomial
from matplotlib import pyplot as plt
from scipy.stats import chi2

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
            .select("HHID, SCREENTIME, PHYSACTIV, SC_AGE_YEARS, SC_SEX, FWC, STRATUM, FIPSST, AGE_GROUP")\
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

# data prep
df['STRATUM'] = df['STRATUM'].replace('2a', '2')
df['STRATA_CROSSED'] = df['FIPSST'].astype(str) + '_' + df['STRATUM'].astype(str)

df = df.rename(columns={
    'SC_AGE_YEARS': 'AGE',
    'SC_SEX': 'SEX',
})

# convert to numeric
df['PHYSACTIV'] = pd.to_numeric(df['PHYSACTIV'], errors='coerce')
df['SCREENTIME'] = pd.to_numeric(df['SCREENTIME'], errors='coerce')
df['AGE'] = pd.to_numeric(df['AGE'], errors='coerce')

# 1-2 = low activity, 3-4 = sufficient activity
df['LOW_PHYSACTIV'] = (df['PHYSACTIV'] <= 2).astype(int)

# exclude 0-5 age group — no physical activity data collected
df = df[df['AGE_GROUP'].isin(['6-11', '12-17'])]

print(f"\nLow physical activity prevalence: {df['LOW_PHYSACTIV'].mean():.1%}")
print(f"n total (ages 6-17): {len(df):,}")

# helper function to print odds ratios and confidence intervals
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

# H3a — low physical activity across ages 6-17
model_cols = ['LOW_PHYSACTIV', 'SCREENTIME', 'AGE', 'SEX', 'FWC']
df_clean = df[model_cols].dropna().reset_index(drop=True).copy()
df_clean['FWC_norm'] = df_clean['FWC'] / df_clean['FWC'].mean()

print(f"\nH3a analytic sample: n={len(df_clean):,}")

h3a_model = smf.glm(
    'LOW_PHYSACTIV ~ SCREENTIME + AGE + C(SEX)',
    data=df_clean,
    family=Binomial(),
    var_weights=df_clean['FWC_norm']
).fit()

print(h3a_model.summary())
print_odds_ratios(h3a_model, "H3a — Low Physical Activity (ages 6-17)")

# H3b — displacement effect by age group
# reference = 6-11 per H3b hypothesis that effect strongest in middle childhood
model_cols_h3b = ['LOW_PHYSACTIV', 'SCREENTIME', 'AGE_GROUP', 'SEX', 'FWC']
df_clean_h3b = df[model_cols_h3b].dropna().reset_index(drop=True).copy()
df_clean_h3b['FWC_norm'] = df_clean_h3b['FWC'] / df_clean_h3b['FWC'].mean()

print(f"\nH3b analytic sample: n={len(df_clean_h3b):,}")

h3b_model = smf.glm(
    '''LOW_PHYSACTIV ~ SCREENTIME * C(AGE_GROUP, Treatment(reference="6-11")) + C(SEX)''',
    data=df_clean_h3b,
    family=Binomial(),
    var_weights=df_clean_h3b['FWC_norm']
).fit()

print(h3b_model.summary())
print_odds_ratios(h3b_model, "H3b — Low Physical Activity x Age Group")

# likelihood ratio test — does interaction improve fit?
h3b_reduced = smf.glm(
    'LOW_PHYSACTIV ~ SCREENTIME + C(AGE_GROUP, Treatment(reference="6-11")) + C(SEX)',
    data=df_clean_h3b,
    family=Binomial(),
    var_weights=df_clean_h3b['FWC_norm']
).fit()

lr_stat = 2 * (h3b_model.llf - h3b_reduced.llf)
lr_df = h3b_model.df_model - h3b_reduced.df_model
lr_pvalue = chi2.sf(lr_stat, lr_df)

print(f"\nLikelihood Ratio Test (interaction vs no interaction):")
print(f"  LR statistic: {lr_stat:.3f}")
print(f"  df: {lr_df}")
print(f"  p-value: {lr_pvalue:.4f}")
if lr_pvalue < 0.05:
    print("  -> interaction term significantly improves model fit")
else:
    print("  -> interaction term does not significantly improve fit")

print(f"\nAIC Comparison:")
print(f"  H3b with interaction:    {h3b_model.aic:.2f}")
print(f"  H3b without interaction: {h3b_reduced.aic:.2f}")

screentime_range = np.linspace(1, 5, 100)
tick_locations = [0, 50, 100, 150, 200, 250, 300, 350, 400]
colors = ['#3498db', '#2ecc71']  # blue = 6-11, green = 12-17

os.makedirs('visualizations', exist_ok=True)

# H3a — predicted probability of low physical activity by screen time
mean_age = df_clean['AGE'].mean()

fig, ax = plt.subplots(figsize=(8, 5))
log_odds_h3a = (h3a_model.params['Intercept'] +
                h3a_model.params['SCREENTIME'] * screentime_range +
                h3a_model.params['AGE'] * mean_age)
prob_h3a = 1 / (1 + np.exp(-log_odds_h3a))

ax.plot(screentime_range, prob_h3a * 100, color='#e74c3c', linewidth=2.5)
ax.set_xticks([1, 2, 3, 4, 5])
ax.set_xticklabels(['<1 hr', '1 hr', '2 hrs', '3 hrs', '4+ hrs'])
ax.set_xlabel('Daily Screen Time')
ax.set_ylabel('Predicted Probability of Low Physical Activity (%)')
ax.set_title('H3a — Predicted Low Physical Activity Probability by Screen Time\n(ages 6–17, held at mean age)')
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig('visualizations/h3a_predicted_physactivity.png', dpi=150, bbox_inches='tight')
plt.show()

# H3b — predicted probabilities by age group
fig, ax = plt.subplots(figsize=(8, 5))
params = h3b_model.params

for color, group in zip(colors, ['6-11', '12-17']):
    if group == '6-11':
        log_odds = (params['Intercept'] +
                    params['SCREENTIME'] * screentime_range)
    elif group == '12-17':
        log_odds = (params['Intercept'] +
                    params['C(AGE_GROUP, Treatment(reference="6-11"))[T.12-17]'] +
                    params['SCREENTIME'] * screentime_range +
                    params['SCREENTIME:C(AGE_GROUP, Treatment(reference="6-11"))[T.12-17]'] * screentime_range)

    prob = 1 / (1 + np.exp(-log_odds))
    ax.plot(screentime_range, prob * 100, color=color,
            linewidth=2.5, label=f'Age {group}')

ax.set_xticks([1, 2, 3, 4, 5])
ax.set_xticklabels(['<1 hr', '1 hr', '2 hrs', '3 hrs', '4+ hrs'])
ax.set_xlabel('Daily Screen Time')
ax.set_ylabel('Predicted Probability of Low Physical Activity (%)')
ax.set_title('H3b — Predicted Low Physical Activity Probability by Screen Time\n(by age group)')
ax.legend(title='Age Group')
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig('visualizations/h3b_predicted_physactivity.png', dpi=150, bbox_inches='tight')
plt.show()

# H3b — relative % increase from <1 hr baseline
fig, ax = plt.subplots(figsize=(8, 5))

for color, group in zip(colors, ['6-11', '12-17']):
    if group == '6-11':
        log_odds = (params['Intercept'] +
                    params['SCREENTIME'] * screentime_range)
    elif group == '12-17':
        log_odds = (params['Intercept'] +
                    params['C(AGE_GROUP, Treatment(reference="6-11"))[T.12-17]'] +
                    params['SCREENTIME'] * screentime_range +
                    params['SCREENTIME:C(AGE_GROUP, Treatment(reference="6-11"))[T.12-17]'] * screentime_range)

    prob = 1 / (1 + np.exp(-log_odds))
    prob_pct_change = ((prob - prob[0]) / prob[0]) * 100

    ax.plot(screentime_range, prob_pct_change, color=color,
            linewidth=2.5, label=f'Age {group}')

ax.set_xticks([1, 2, 3, 4, 5])
ax.set_xticklabels(['<1 hr', '1 hr', '2 hrs', '3 hrs', '4+ hrs'])
ax.set_xlabel('Daily Screen Time')
ax.set_ylabel('% Increase in Low Physical Activity Probability\n(relative to <1 hr)')
ax.set_title('H3b — Relative % Increase in Low Physical Activity by Screen Time\n(relative to <1 hr baseline)')
ax.legend(title='Age Group')
ax.grid(True, alpha=0.3)
ax.set_ylim(0, 400)
ax.set_yticks(tick_locations)
plt.tight_layout()
plt.savefig('visualizations/h3b_relative_increase_physactivity.png', dpi=150, bbox_inches='tight')
plt.show()
