import os
from supabase import create_client, Client
import pandas as pd
from dotenv import load_dotenv
import statsmodels.formula.api as smf
import numpy as np
from statsmodels.genmod.families import Binomial
from matplotlib import pyplot as plt

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
            .select("HHID, SCREENTIME, K2Q32A, K2Q33A, FWC, STRATUM, FIPSST, AGE_GROUP, SC_AGE_YEARS")\
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
    'K2Q32A': 'DEPRESSION',
    'K2Q33A': 'ANXIETY',
    'SC_AGE_YEARS': 'AGE',
    'SC_SEX': 'SEX',
})

# convert to binary 0/1
df['DEPRESSION'] = (df['DEPRESSION'] == 1).astype(int)
df['ANXIETY'] = (df['ANXIETY'] == 1).astype(int)

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

# H1a — clinical Depression across all ages 
model_cols = ['DEPRESSION', 'SCREENTIME', 'AGE', 'FWC']
df_clean = df[model_cols].dropna().reset_index(drop=True).copy()
df_clean['FWC_norm'] = df_clean['FWC'] / df_clean['FWC'].mean()

h2a_depression = smf.glm(
    'DEPRESSION ~ SCREENTIME + AGE',
    data=df_clean,
    family=Binomial(),
    var_weights=df_clean['FWC_norm']
).fit()

print(h2a_depression.summary())
print_odds_ratios(h2a_depression, "H2a — Clinical Depression (all ages)")    

# H2a — clinical Anxiety across all ages 
model_cols = ['ANXIETY', 'SCREENTIME', 'AGE', 'FWC']
df_clean = df[model_cols].dropna().reset_index(drop=True).copy()
df_clean['FWC_norm'] = df_clean['FWC'] / df_clean['FWC'].mean()

h2a_anxiety = smf.glm(
    'ANXIETY ~ SCREENTIME + AGE',
    data=df_clean,
    family=Binomial(),
    var_weights=df_clean['FWC_norm']
).fit()

print(h2a_anxiety.summary())
print_odds_ratios(h2a_anxiety, "H2a — Clinical Anxiety (all ages)")    


# H2b — depression association strongest in 12-17 age group
# This association will be strongest in the 12-17 age group, as early childhood
# is the most critical window for attentional development

model_cols_h2b = ['DEPRESSION', 'SCREENTIME', 'AGE_GROUP', 'FWC']
df_clean_h2b = df[model_cols_h2b].dropna().reset_index(drop=True).copy()
df_clean_h2b['FWC_norm'] = df_clean_h2b['FWC'] / df_clean_h2b['FWC'].mean()

h2b_depression = smf.glm(
    '''DEPRESSION ~ SCREENTIME * C(AGE_GROUP, Treatment(reference="12-17"))''',
    data=df_clean_h2b,
    family=Binomial(),
    var_weights=df_clean_h2b['FWC_norm']
).fit()

print(h2b_depression.summary())
print_odds_ratios(h2b_depression, "H2b — Clinical Depression x Age Group")


# H2b — anxiety association strongest in 12-17 age group
# This association will be strongest in the 12-17 age group, as early childhood
# is the most critical window for attentional development

model_cols_h2b = ['ANXIETY', 'SCREENTIME', 'AGE_GROUP', 'FWC']
df_clean_h2b = df[model_cols_h2b].dropna().reset_index(drop=True).copy()
df_clean_h2b['FWC_norm'] = df_clean_h2b['FWC'] / df_clean_h2b['FWC'].mean()

h2b_anxiety = smf.glm(
    '''ANXIETY ~ SCREENTIME * C(AGE_GROUP, Treatment(reference="12-17"))''',
    data=df_clean_h2b,
    family=Binomial(),
    var_weights=df_clean_h2b['FWC_norm']
).fit()

print(h2b_anxiety.summary())
print_odds_ratios(h2b_anxiety, "H2b — Clinical Anxiety x Age Group")

screentime_range = np.linspace(1, 5, 100)
colors = ['#e74c3c', '#3498db', '#2ecc71']
 
tick_locations = [0, 50, 100, 150, 200, 250, 300, 350, 400]

# H2a Depression: predicted probabilities by screen time (held at mean age)
mean_age_dep = df[['DEPRESSION', 'SCREENTIME', 'AGE', 'FWC']].dropna()['AGE'].mean()
 
fig, ax = plt.subplots(figsize=(8, 5))
log_odds_dep = (h2a_depression.params['Intercept'] +
                h2a_depression.params['SCREENTIME'] * screentime_range +
                h2a_depression.params['AGE'] * mean_age_dep)
prob_dep = 1 / (1 + np.exp(-log_odds_dep))
 
ax.plot(screentime_range, prob_dep * 100, color='#e74c3c', linewidth=2.5)
ax.set_xticks([1, 2, 3, 4, 5])
ax.set_xticklabels(['<1 hr', '1 hr', '2 hrs', '3 hrs', '4+ hrs'])
ax.set_xlabel('Daily Screen Time')
ax.set_ylabel('Predicted Probability of Depression (%)')
ax.set_title('H2a — Predicted Depression Probability by Screen Time\n(all ages, held at mean age)')
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig('visualizations/h2a_depression_predicted_probability.png', dpi=150, bbox_inches='tight')
plt.show()
 
# H2a Anxiety: predicted probabilities by screen time (held at mean age)
mean_age_anx = df[['ANXIETY', 'SCREENTIME', 'AGE', 'FWC']].dropna()['AGE'].mean()
 
fig, ax = plt.subplots(figsize=(8, 5))
log_odds_anx = (h2a_anxiety.params['Intercept'] +
                h2a_anxiety.params['SCREENTIME'] * screentime_range +
                h2a_anxiety.params['AGE'] * mean_age_anx)
prob_anx = 1 / (1 + np.exp(-log_odds_anx))
 
ax.plot(screentime_range, prob_anx * 100, color='#3498db', linewidth=2.5)
ax.set_xticks([1, 2, 3, 4, 5])
ax.set_xticklabels(['<1 hr', '1 hr', '2 hrs', '3 hrs', '4+ hrs'])
ax.set_xlabel('Daily Screen Time')
ax.set_ylabel('Predicted Probability of Anxiety (%)')
ax.set_title('H2a — Predicted Anxiety Probability by Screen Time\n(all ages, held at mean age)')
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig('visualizations/h2a_anxiety_predicted_probability.png', dpi=150, bbox_inches='tight')
plt.show()
 
# H2b Depression: predicted probabilities by age group
# reference group is 12-17, so 12-17 uses only Intercept + SCREENTIME
fig, ax = plt.subplots(figsize=(8, 5))
params_dep = h2b_depression.params
 
for color, group in zip(colors, ['0-5', '6-11', '12-17']):
    if group == '12-17':
        log_odds = (params_dep['Intercept'] +
                    params_dep['SCREENTIME'] * screentime_range)
    elif group == '0-5':
        log_odds = (params_dep['Intercept'] +
                    params_dep['C(AGE_GROUP, Treatment(reference="12-17"))[T.0-5]'] +
                    params_dep['SCREENTIME'] * screentime_range +
                    params_dep['SCREENTIME:C(AGE_GROUP, Treatment(reference="12-17"))[T.0-5]'] * screentime_range)
    elif group == '6-11':
        log_odds = (params_dep['Intercept'] +
                    params_dep['C(AGE_GROUP, Treatment(reference="12-17"))[T.6-11]'] +
                    params_dep['SCREENTIME'] * screentime_range +
                    params_dep['SCREENTIME:C(AGE_GROUP, Treatment(reference="12-17"))[T.6-11]'] * screentime_range)
 
    prob = 1 / (1 + np.exp(-log_odds))
    ax.plot(screentime_range, prob * 100, color=color, linewidth=2.5, label=f'Age {group}')
 
ax.set_xticks([1, 2, 3, 4, 5])
ax.set_xticklabels(['<1 hr', '1 hr', '2 hrs', '3 hrs', '4+ hrs'])
ax.set_xlabel('Daily Screen Time')
ax.set_ylabel('Predicted Probability of Depression (%)')
ax.set_title('H2b — Predicted Depression Probability by Screen Time\n(by age group)')
ax.legend(title='Age Group')
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig('visualizations/h2b_depression_predicted_probability.png', dpi=150, bbox_inches='tight')
plt.show()
 
# H2b Anxiety: predicted probabilities by age group
fig, ax = plt.subplots(figsize=(8, 5))
params_anx = h2b_anxiety.params
 
for color, group in zip(colors, ['0-5', '6-11', '12-17']):
    if group == '12-17':
        log_odds = (params_anx['Intercept'] +
                    params_anx['SCREENTIME'] * screentime_range)
    elif group == '0-5':
        log_odds = (params_anx['Intercept'] +
                    params_anx['C(AGE_GROUP, Treatment(reference="12-17"))[T.0-5]'] +
                    params_anx['SCREENTIME'] * screentime_range +
                    params_anx['SCREENTIME:C(AGE_GROUP, Treatment(reference="12-17"))[T.0-5]'] * screentime_range)
    elif group == '6-11':
        log_odds = (params_anx['Intercept'] +
                    params_anx['C(AGE_GROUP, Treatment(reference="12-17"))[T.6-11]'] +
                    params_anx['SCREENTIME'] * screentime_range +
                    params_anx['SCREENTIME:C(AGE_GROUP, Treatment(reference="12-17"))[T.6-11]'] * screentime_range)
 
    prob = 1 / (1 + np.exp(-log_odds))
    ax.plot(screentime_range, prob * 100, color=color, linewidth=2.5, label=f'Age {group}')
 
ax.set_xticks([1, 2, 3, 4, 5])
ax.set_xticklabels(['<1 hr', '1 hr', '2 hrs', '3 hrs', '4+ hrs'])
ax.set_xlabel('Daily Screen Time')
ax.set_ylabel('Predicted Probability of Anxiety (%)')
ax.set_title('H2b — Predicted Anxiety Probability by Screen Time\n(by age group)')
ax.legend(title='Age Group')
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig('visualizations/h2b_anxiety_predicted_probability.png', dpi=150, bbox_inches='tight')
plt.show()
 
# H2b Depression: relative % increase from <1 hr baseline
fig, ax = plt.subplots(figsize=(8, 5))
 
for color, group in zip(colors, ['0-5', '6-11', '12-17']):
    if group == '12-17':
        log_odds = (params_dep['Intercept'] +
                    params_dep['SCREENTIME'] * screentime_range)
    elif group == '0-5':
        log_odds = (params_dep['Intercept'] +
                    params_dep['C(AGE_GROUP, Treatment(reference="12-17"))[T.0-5]'] +
                    params_dep['SCREENTIME'] * screentime_range +
                    params_dep['SCREENTIME:C(AGE_GROUP, Treatment(reference="12-17"))[T.0-5]'] * screentime_range)
    elif group == '6-11':
        log_odds = (params_dep['Intercept'] +
                    params_dep['C(AGE_GROUP, Treatment(reference="12-17"))[T.6-11]'] +
                    params_dep['SCREENTIME'] * screentime_range +
                    params_dep['SCREENTIME:C(AGE_GROUP, Treatment(reference="12-17"))[T.6-11]'] * screentime_range)
 
    prob = 1 / (1 + np.exp(-log_odds))
    prob_pct_change = ((prob - prob[0]) / prob[0]) * 100
    ax.plot(screentime_range, prob_pct_change, color=color, linewidth=2.5, label=f'Age {group}')
 
ax.set_xticks([1, 2, 3, 4, 5])
ax.set_xticklabels(['<1 hr', '1 hr', '2 hrs', '3 hrs', '4+ hrs'])
ax.set_xlabel('Daily Screen Time')
ax.set_ylabel('% Increase in Depression Probability\n(relative to <1 hr)')
ax.set_title('H2b — Relative % Increase in Depression Probability by Screen Time\n(relative to <1 hr baseline)')
ax.legend(title='Age Group')
ax.grid(True, alpha=0.3)
ax.set_ylim(0, 400)
ax.set_yticks(tick_locations)
plt.tight_layout()
plt.savefig('visualizations/h2b_depression_relative_increase.png', dpi=150, bbox_inches='tight')
plt.show()
 
# H2b Anxiety: relative % increase from <1 hr baseline
fig, ax = plt.subplots(figsize=(8, 5))
 
for color, group in zip(colors, ['0-5', '6-11', '12-17']):
    if group == '12-17':
        log_odds = (params_anx['Intercept'] +
                    params_anx['SCREENTIME'] * screentime_range)
    elif group == '0-5':
        log_odds = (params_anx['Intercept'] +
                    params_anx['C(AGE_GROUP, Treatment(reference="12-17"))[T.0-5]'] +
                    params_anx['SCREENTIME'] * screentime_range +
                    params_anx['SCREENTIME:C(AGE_GROUP, Treatment(reference="12-17"))[T.0-5]'] * screentime_range)
    elif group == '6-11':
        log_odds = (params_anx['Intercept'] +
                    params_anx['C(AGE_GROUP, Treatment(reference="12-17"))[T.6-11]'] +
                    params_anx['SCREENTIME'] * screentime_range +
                    params_anx['SCREENTIME:C(AGE_GROUP, Treatment(reference="12-17"))[T.6-11]'] * screentime_range)
 
    prob = 1 / (1 + np.exp(-log_odds))
    prob_pct_change = ((prob - prob[0]) / prob[0]) * 100
    ax.plot(screentime_range, prob_pct_change, color=color, linewidth=2.5, label=f'Age {group}')
 
ax.set_xticks([1, 2, 3, 4, 5])
ax.set_xticklabels(['<1 hr', '1 hr', '2 hrs', '3 hrs', '4+ hrs'])
ax.set_xlabel('Daily Screen Time')
ax.set_ylabel('% Increase in Anxiety Probability\n(relative to <1 hr)')
ax.set_title('H2b — Relative % Increase in Anxiety Probability by Screen Time\n(relative to <1 hr baseline)')
ax.legend(title='Age Group')
ax.grid(True, alpha=0.3)
ax.set_ylim(0, 400)
ax.set_yticks(tick_locations)
plt.tight_layout()
plt.savefig('visualizations/h2b_anxiety_relative_increase.png', dpi=150, bbox_inches='tight')
plt.show()
