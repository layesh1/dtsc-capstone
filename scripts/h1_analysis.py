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
            .select("HHID, SCREENTIME, K2Q31A, K2Q31C, SC_AGE_YEARS, SC_SEX, BEDTIME, FWC, STRATUM, FIPSST, AGE_GROUP")\
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

# values are 1 and 2a, replace 2a with 2 for modeling
df['STRATUM'] = df['STRATUM'].replace('2a', '2')

# combine state and stratum for clustering
df['STRATA_CROSSED'] = df['FIPSST'].astype(str) + '_' + df['STRATUM'].astype(str)

# rename columns for readability
df = df.rename(columns={
    'K2Q31A': 'ADHD_EVER',
    'K2Q31C': 'ADHD_CURRENT',
    'SC_AGE_YEARS': 'AGE',
    'SC_SEX': 'SEX',
})

# build clinical ADHD outcome — ever told AND currently has ADHD
df['ADHD_CLINICAL'] = (
    (df['ADHD_EVER'] == 1) & (df['ADHD_CURRENT'] == 1)
).astype(int)

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

# H1a — clinical ADHD across all ages 
# Higher daily screen time will be associated with greater parent-reported
# attention difficulties across all age groups

model_cols = ['ADHD_CLINICAL', 'SCREENTIME', 'AGE', 'FWC']
df_clean = df[model_cols].dropna().reset_index(drop=True).copy()
df_clean['FWC_norm'] = df_clean['FWC'] / df_clean['FWC'].mean()

h1a_clinical = smf.glm(
    'ADHD_CLINICAL ~ SCREENTIME + AGE',
    data=df_clean,
    family=Binomial(),
    var_weights=df_clean['FWC_norm']
).fit()

print(h1a_clinical.summary())
print_odds_ratios(h1a_clinical, "H1a — Clinical ADHD (all ages)")

# model fit stats for h1a
pseudo_r2_h1a = 1 - (h1a_clinical.llf / h1a_clinical.llnull)
print(f"\nH1a Model Fit:")
print(f"  Pseudo R² (McFadden): {pseudo_r2_h1a:.4f}")
print(f"  AIC: {h1a_clinical.aic:.2f}")
print(f"  BIC: {h1a_clinical.bic:.2f}")
print(f"  n = {len(df_clean)}")

# H1b — association strongest in 0-5 age group
# This association will be strongest in the 0–5 age group, as early childhood
# is the most critical window for attentional development

model_cols_h1b = ['ADHD_CLINICAL', 'SCREENTIME', 'AGE_GROUP', 'BEDTIME', 'FWC']
df_clean_h1b = df[model_cols_h1b].dropna().reset_index(drop=True).copy()
df_clean_h1b['FWC_norm'] = df_clean_h1b['FWC'] / df_clean_h1b['FWC'].mean()

h1b_clinical = smf.glm(
    '''ADHD_CLINICAL ~ SCREENTIME * C(AGE_GROUP, Treatment(reference="0-5"))
                     + BEDTIME''',
    data=df_clean_h1b,
    family=Binomial(),
    var_weights=df_clean_h1b['FWC_norm']
).fit()

print(h1b_clinical.summary())
print_odds_ratios(h1b_clinical, "H1b — Clinical ADHD x Age Group")

model_cols_h1b = ['ADHD_CLINICAL', 'SCREENTIME', 'AGE_GROUP', 'FWC']
df_clean_h1b = df[model_cols_h1b].dropna().reset_index(drop=True).copy()
df_clean_h1b['FWC_norm'] = df_clean_h1b['FWC'] / df_clean_h1b['FWC'].mean()

h1b_clinical = smf.glm(
    '''ADHD_CLINICAL ~ SCREENTIME * C(AGE_GROUP, Treatment(reference="0-5"))''',
    data=df_clean_h1b,
    family=Binomial(),
    var_weights=df_clean_h1b['FWC_norm']
).fit()

print(h1b_clinical.summary())
print_odds_ratios(h1b_clinical, "H1b — Clinical ADHD x Age Group")

# model fit stats for h1b
pseudo_r2_h1b = 1 - (h1b_clinical.llf / h1b_clinical.llnull)
print(f"\nH1b Model Fit:")
print(f"  Pseudo R² (McFadden): {pseudo_r2_h1b:.4f}")
print(f"  AIC: {h1b_clinical.aic:.2f}")
print(f"  BIC: {h1b_clinical.bic:.2f}")
print(f"  n = {len(df_clean_h1b)}")

# likelihood ratio test — does the interaction improve the model?
# compare h1b (with interaction) vs reduced model (no interaction)

h1b_reduced = smf.glm(
    'ADHD_CLINICAL ~ SCREENTIME + C(AGE_GROUP, Treatment(reference="0-5"))',
    data=df_clean_h1b,
    family=Binomial(),
    var_weights=df_clean_h1b['FWC_norm']
).fit()

lr_stat = 2 * (h1b_clinical.llf - h1b_reduced.llf)
lr_df = h1b_clinical.df_model - h1b_reduced.df_model
lr_pvalue = chi2.sf(lr_stat, lr_df)

print(f"\nLikelihood Ratio Test (interaction vs no interaction):")
print(f"  LR statistic: {lr_stat:.3f}")
print(f"  df: {lr_df}")
print(f"  p-value: {lr_pvalue:.4f}")
if lr_pvalue < 0.05:
    print("  -> interaction term significantly improves model fit")
else:
    print("  -> interaction term does not significantly improve fit")

# aic comparison
print(f"\nAIC Comparison:")
print(f"  H1b with interaction: {h1b_clinical.aic:.2f}")
print(f"  H1b without interaction: {h1b_reduced.aic:.2f}")
if h1b_clinical.aic < h1b_reduced.aic:
    print("  -> lower AIC = interaction model is better")
else:
    print("  -> lower AIC = simpler model is better")

# h1a — predicted probabilities by screen time (held at mean age)
fig, ax = plt.subplots(figsize=(8, 5))

mean_age = df_clean['AGE'].mean()
screentime_range = np.linspace(1, 5, 100)

log_odds_h1a = (h1a_clinical.params['Intercept'] +
                h1a_clinical.params['SCREENTIME'] * screentime_range +
                h1a_clinical.params['AGE'] * mean_age)
prob_h1a = 1 / (1 + np.exp(-log_odds_h1a))

ax.plot(screentime_range, prob_h1a * 100, color='#e74c3c', linewidth=2.5)
ax.set_xticks([1, 2, 3, 4, 5])
ax.set_xticklabels(['<1 hr', '1 hr', '2 hrs', '3 hrs', '4+ hrs'])
ax.set_xlabel('Daily Screen Time')
ax.set_ylabel('Predicted Probability of ADHD (%)') 
ax.set_title('H1a — Predicted ADHD Probability by Screen Time\n(all ages, held at mean age)')
ax.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('visualizations/h1a_predicted_probability.png', dpi=150, bbox_inches='tight')
plt.show()

tick_locations = [0, 50, 100, 150, 200, 250, 300, 350, 400]
# predicted probabilities by screen time and age group
fig, ax = plt.subplots(figsize=(8, 5))

colors = ['#e74c3c', '#3498db', '#2ecc71']
params = h1b_clinical.params

for color, group in zip(colors, ['0-5', '6-11', '12-17']):
    if group == '0-5':
        log_odds = (params['Intercept'] +
                    params['SCREENTIME'] * screentime_range)
    elif group == '6-11':
        log_odds = (params['Intercept'] +
                    params['C(AGE_GROUP, Treatment(reference="0-5"))[T.6-11]'] +
                    params['SCREENTIME'] * screentime_range +
                    params['SCREENTIME:C(AGE_GROUP, Treatment(reference="0-5"))[T.6-11]'] * screentime_range)
    elif group == '12-17':
        log_odds = (params['Intercept'] +
                    params['C(AGE_GROUP, Treatment(reference="0-5"))[T.12-17]'] +
                    params['SCREENTIME'] * screentime_range +
                    params['SCREENTIME:C(AGE_GROUP, Treatment(reference="0-5"))[T.12-17]'] * screentime_range)

    prob = 1 / (1 + np.exp(-log_odds))
    ax.plot(screentime_range, prob * 100, color=color,
            linewidth=2.5, label=f'Age {group}')

ax.set_xticks([1, 2, 3, 4, 5])
ax.set_xticklabels(['<1 hr', '1 hr', '2 hrs', '3 hrs', '4+ hrs'])
ax.set_xlabel('Daily Screen Time')
ax.set_ylabel('Predicted Probability of ADHD (%)')
ax.set_title('H1b — Predicted ADHD Probability by Screen Time\n(by age group)')
ax.legend(title='Age Group')
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig('visualizations/h1b_predicted_probability.png', dpi=150, bbox_inches='tight')
plt.show()



# H1b — percentage increase relative to baseline
fig, ax = plt.subplots(figsize=(8, 5))

colors = ['#e74c3c', '#3498db', '#2ecc71']
params = h1b_clinical.params

for color, group in zip(colors, ['0-5', '6-11', '12-17']):
    if group == '0-5':
        log_odds = (params['Intercept'] +
                    params['SCREENTIME'] * screentime_range)
    elif group == '6-11':
        log_odds = (params['Intercept'] +
                    params['C(AGE_GROUP, Treatment(reference="0-5"))[T.6-11]'] +
                    params['SCREENTIME'] * screentime_range +
                    params['SCREENTIME:C(AGE_GROUP, Treatment(reference="0-5"))[T.6-11]'] * screentime_range)
    elif group == '12-17':
        log_odds = (params['Intercept'] +
                    params['C(AGE_GROUP, Treatment(reference="0-5"))[T.12-17]'] +
                    params['SCREENTIME'] * screentime_range +
                    params['SCREENTIME:C(AGE_GROUP, Treatment(reference="0-5"))[T.12-17]'] * screentime_range)

    prob = 1 / (1 + np.exp(-log_odds))

    # percentage increase relative to baseline — e.g. 0.2% -> 1.0% = 400% increase
    prob_pct_change = ((prob - prob[0]) / prob[0]) * 100

    ax.plot(screentime_range, prob_pct_change, color=color,
            linewidth=2.5, label=f'Age {group}')

ax.set_xticks([1, 2, 3, 4, 5])
ax.set_xticklabels(['<1 hr', '1 hr', '2 hrs', '3 hrs', '4+ hrs'])
ax.set_xlabel('Daily Screen Time')
ax.set_ylabel('% Increase in ADHD Probability\n(relative to <1 hr)')
ax.set_title('H1b — Relative % Increase in ADHD Probability by Screen Time\n(relative to <1 hr baseline)')
ax.legend(title='Age Group')
ax.grid(True, alpha=0.3)
ax.set_ylim(0, 400)
ax.set_yticks(tick_locations)
plt.tight_layout()
plt.savefig('visualizations/h1b_relative_increase.png', dpi=150, bbox_inches='tight')
plt.show()