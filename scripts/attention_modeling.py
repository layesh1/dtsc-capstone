import os
from supabase import create_client, Client
import pandas as pd
from dotenv import load_dotenv
import statsmodels.formula.api as smf
import numpy as np
from statsmodels.genmod.families import Binomial

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