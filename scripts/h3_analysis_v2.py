import os
from supabase import create_client
import pandas as pd
from dotenv import load_dotenv
import statsmodels.formula.api as smf
import numpy as np
from statsmodels.genmod.families import Gaussian
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
            .select("HHID, SCREENTIME, PHYSACTIV, FWC, STRATUM, FIPSST, AGE_GROUP, SC_AGE_YEARS")\
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
    'PHYSACTIV': 'PHYS_ACTIVITY',
})

# convert to numeric
df['PHYS_ACTIVITY'] = pd.to_numeric(df['PHYS_ACTIVITY'], errors='coerce')
df['SCREENTIME'] = pd.to_numeric(df['SCREENTIME'], errors='coerce')
df['AGE'] = pd.to_numeric(df['AGE'], errors='coerce')
df['FWC'] = pd.to_numeric(df['FWC'], errors='coerce')

# exclude 0-5 age group — no physical activity data collected
df = df[df['AGE_GROUP'].isin(['6-11', '12-17'])]

# helper function to print coefficients and confidence intervals
def print_coefficients(model, label):
    print(f"\n{'='*60}")
    print(f"{label} — Coefficients")
    print('='*60)
    print(pd.DataFrame({
        'coef'   : model.params,
        'CI_low' : model.conf_int()[0],
        'CI_high': model.conf_int()[1],
        'p_value': model.pvalues
    }).round(4))

# ── H3a — physical activity across all ages (6-17) ──────────────────────────
# Higher daily screen time will be associated with lower levels of
# physical activity across all age groups

model_cols = ['PHYS_ACTIVITY', 'SCREENTIME', 'AGE', 'FWC']
df_clean = df[model_cols].dropna().reset_index(drop=True).copy()
df_clean['FWC_norm'] = df_clean['FWC'] / df_clean['FWC'].mean()

h3a_model = smf.wls(
    'PHYS_ACTIVITY ~ SCREENTIME + AGE',
    data=df_clean,
    weights=df_clean['FWC_norm']
).fit()

print(h3a_model.summary())
print_coefficients(h3a_model, "H3a — Physical Activity (ages 6-17)")

# model fit stats for h3a
print(f"\nH3a Model Fit:")
print(f"  R²: {h3a_model.rsquared:.4f}")
print(f"  AIC: {h3a_model.aic:.2f}")
print(f"  BIC: {h3a_model.bic:.2f}")
print(f"  n = {len(df_clean)}")

# ── H3b — displacement effect strongest in middle childhood (6-11) ──────────
# The displacement effect will be consistent across age groups,
# but most pronounced in middle childhood (6–11)

model_cols_h3b = ['PHYS_ACTIVITY', 'SCREENTIME', 'AGE_GROUP', 'FWC']
df_clean_h3b = df[model_cols_h3b].dropna().reset_index(drop=True).copy()
df_clean_h3b['FWC_norm'] = df_clean_h3b['FWC'] / df_clean_h3b['FWC'].mean()

h3b_model = smf.wls(
    '''PHYS_ACTIVITY ~ SCREENTIME * C(AGE_GROUP, Treatment(reference="6-11"))''',
    data=df_clean_h3b,
    weights=df_clean_h3b['FWC_norm']
).fit()

print(h3b_model.summary())
print_coefficients(h3b_model, "H3b — Physical Activity x Age Group")

# model fit stats for h3b
print(f"\nH3b Model Fit:")
print(f"  R²: {h3b_model.rsquared:.4f}")
print(f"  AIC: {h3b_model.aic:.2f}")
print(f"  BIC: {h3b_model.bic:.2f}")
print(f"  n = {len(df_clean_h3b)}")

# F-test — does the interaction improve the model?
h3b_reduced = smf.wls(
    'PHYS_ACTIVITY ~ SCREENTIME + C(AGE_GROUP, Treatment(reference="6-11"))',
    data=df_clean_h3b,
    weights=df_clean_h3b['FWC_norm']
).fit()

print(f"\nF-test (interaction vs no interaction):")
print(f"  Full model AIC:    {h3b_model.aic:.2f}")
print(f"  Reduced model AIC: {h3b_reduced.aic:.2f}")
if h3b_model.aic < h3b_reduced.aic:
    print("  -> lower AIC = interaction model is better")
else:
    print("  -> lower AIC = simpler model is better")

# ── VISUALIZATIONS ───────────────────────────────────────────────────────────
screentime_range = np.linspace(1, 5, 100)
colors = ['#3498db', '#2ecc71']   # blue = 6-11, green = 12-17
tick_locations = [0, 50, 100, 150, 200, 250, 300, 350, 400]

# H3a — predicted physical activity days by screen time (held at mean age)
mean_age = df_clean['AGE'].mean()

fig, ax = plt.subplots(figsize=(8, 5))

predicted_pa = (h3a_model.params['Intercept'] +
                h3a_model.params['SCREENTIME'] * screentime_range +
                h3a_model.params['AGE'] * mean_age)

ax.plot(screentime_range, predicted_pa, color='#e74c3c', linewidth=2.5)
ax.set_xticks([1, 2, 3, 4, 5])
ax.set_xticklabels(['<1 hr', '1 hr', '2 hrs', '3 hrs', '4+ hrs'])
ax.set_xlabel('Daily Screen Time')
ax.set_ylabel('Predicted Physical Activity (days/week)')
ax.set_title('H3a — Predicted Physical Activity by Screen Time\n(ages 6–17, held at mean age)')
ax.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('visualizations/h3a_predicted_physactivity.png', dpi=150, bbox_inches='tight')
plt.show()

# H3b — predicted physical activity by screen time and age group
fig, ax = plt.subplots(figsize=(8, 5))
params = h3b_model.params

for color, group in zip(colors, ['6-11', '12-17']):
    if group == '6-11':
        predicted = (params['Intercept'] +
                     params['SCREENTIME'] * screentime_range)
    elif group == '12-17':
        predicted = (params['Intercept'] +
                     params['C(AGE_GROUP, Treatment(reference="6-11"))[T.12-17]'] +
                     params['SCREENTIME'] * screentime_range +
                     params['SCREENTIME:C(AGE_GROUP, Treatment(reference="6-11"))[T.12-17]'] * screentime_range)

    ax.plot(screentime_range, predicted, color=color,
            linewidth=2.5, label=f'Age {group}')

ax.set_xticks([1, 2, 3, 4, 5])
ax.set_xticklabels(['<1 hr', '1 hr', '2 hrs', '3 hrs', '4+ hrs'])
ax.set_xlabel('Daily Screen Time')
ax.set_ylabel('Predicted Physical Activity (days/week)')
ax.set_title('H3b — Predicted Physical Activity by Screen Time\n(by age group)')
ax.legend(title='Age Group')
ax.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('visualizations/h3b_predicted_physactivity.png', dpi=150, bbox_inches='tight')
plt.show()

# H3b — relative % decrease from <1 hr baseline (scaled to match team format)
fig, ax = plt.subplots(figsize=(8, 5))

for color, group in zip(colors, ['6-11', '12-17']):
    if group == '6-11':
        predicted = (params['Intercept'] +
                     params['SCREENTIME'] * screentime_range)
    elif group == '12-17':
        predicted = (params['Intercept'] +
                     params['C(AGE_GROUP, Treatment(reference="6-11"))[T.12-17]'] +
                     params['SCREENTIME'] * screentime_range +
                     params['SCREENTIME:C(AGE_GROUP, Treatment(reference="6-11"))[T.12-17]'] * screentime_range)

    # percentage change relative to baseline (<1 hr)
    pct_change = ((predicted - predicted[0]) / predicted[0]) * 100

    ax.plot(screentime_range, pct_change, color=color,
            linewidth=2.5, label=f'Age {group}')

ax.set_xticks([1, 2, 3, 4, 5])
ax.set_xticklabels(['<1 hr', '1 hr', '2 hrs', '3 hrs', '4+ hrs'])
ax.set_xlabel('Daily Screen Time')
ax.set_ylabel('% Change in Physical Activity\n(relative to <1 hr)')
ax.set_title('H3b — Relative % Change in Physical Activity by Screen Time\n(relative to <1 hr baseline)')
ax.legend(title='Age Group')
ax.grid(True, alpha=0.3)
ax.set_ylim(-40, 0)  # negative because activity decreases
plt.tight_layout()
plt.savefig('visualizations/h3b_relative_decrease.png', dpi=150, bbox_inches='tight')
plt.show()

print("\n✅ H3 analysis complete. Check visualizations/ folder for PNG files.")
