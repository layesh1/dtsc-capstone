# ── 0. IMPORTS ──────────────────────────────────────────────────────────────
import os
import warnings
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import seaborn as sns
from scipy import stats
from statsmodels.formula.api import ols, logit
import statsmodels.api as sm
from statsmodels.stats.multitest import multipletests
import pingouin as pg          # for effect sizes (Cohen's d, η²)

warnings.filterwarnings("ignore")

# ── 1. CONNECT TO SUPABASE & PULL DATA ──────────────────────────────────────
# Store credentials in environment variables – never hard-code secrets!
# In VS Code terminal:  export SUPABASE_URL="https://xxxx.supabase.co"
#                       export SUPABASE_KEY="your-anon-key"

from supabase import create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

TABLE_NAME = "nsch_data"         

print("Fetching data from Supabase …")
all_data = []
offset = 0
batch_size = 1000

while True:
    response = supabase.table(TABLE_NAME).select("*").range(offset, offset + batch_size - 1).execute()
    if not response.data:
        break
    all_data.extend(response.data)
    offset += batch_size
    print(f"  Fetched {offset:,} rows...", end="\r")

df_raw = pd.DataFrame(all_data)
print(f"\n  Loaded {df_raw.shape[0]:,} total rows")

# ── 2. COLUMN MAP ────────────────────────────────────────────────────────────
# NSCH variable names vary by survey year.  Map them to friendly names here.
# Check your actual column names with: print(df_raw.columns.tolist())

COL = {
    "screen_time":   "SCREENTIME",
    "phys_activity": "PHYSACTIV",
    "age":           "SC_AGE_YEARS",
    "race_eth":      "SC_RACE_R",
    "income_pct":    "FPL_GROUP",
    "parent_educ":   "HIGRADE_TVIS",
    "attention":     "ADHD",
    "anxiety":       "ANXIETY",
    "depression":    "DEPRESSION",
    "weight":        "FWC",
}


# ── 3. CLEAN & RECODE ────────────────────────────────────────────────────────
df = df_raw.rename(columns={v: k for k, v in COL.items()})

# Keep only columns we need (drop missing in key vars)
keep = list(COL.keys())
df = df[[c for c in keep if c in df.columns]].copy()

for col in df.columns:
    if col != "income_pct":
        df[col] = pd.to_numeric(df[col], errors="coerce")

# Drop rows missing screen_time or phys_activity
df = df.dropna(subset=["screen_time", "phys_activity", "age"])
print(f"  After cleaning: {df.shape[0]:,} rows")

# Developmental stage groups (matches H1 / H2 groupings for consistency)
def age_group(a):
    if   a <= 5:  return "0–5 (Early Childhood)"
    elif a <= 11: return "6–11 (Middle Childhood)"
    else:         return "12–17 (Adolescence)"

df["age_group"] = df["age"].apply(age_group)
AG_ORDER = ["0–5 (Early Childhood)", "6–11 (Middle Childhood)", "12–17 (Adolescence)"]

# Binary high-screen-time flag (≥3 hours/day = codes 4 or 5 in S7Q01)
df["high_screen"] = (df["screen_time"] >= 4).astype(int)

# Income label
income_labels = {"0–99%": "0–99% FPL", "100–199%": "100–199% FPL", "200–399%": "200–399% FPL"}

race_labels = {1: "White NH", 2: "Black NH", 3: "Hispanic", 4: "Asian NH", 5: "Other/Multi"}
df["race_label"] = df["race_eth"].map(race_labels)

educ_labels = {1: "< HS", 2: "HS Diploma", 3: "Some College", 4: "BA+"}
df["educ_label"] = df["parent_educ"].map(educ_labels)

print("\nSample n by age group:")
print(df["age_group"].value_counts().reindex(AG_ORDER))


# ════════════════════════════════════════════════════════════════════════════
# H3 – PHYSICAL INACTIVITY
# H3a: Higher screen time → lower physical activity across all age groups
# H3b: Effect most pronounced in 6–11 (Middle Childhood)
# ════════════════════════════════════════════════════════════════════════════

print("\n" + "═"*60)
print("H3 ANALYSIS: Screen Time & Physical Inactivity")
print("═"*60)

# ── 3.1 Descriptive: Mean physical activity by screen time & age group ──────
desc = (df.groupby(["age_group", "screen_time"])["phys_activity"]
          .agg(["mean", "sem", "count"])
          .reset_index())
desc.columns = ["age_group", "screen_time", "mean_pa", "sem_pa", "n"]
print("\nMean physical activity days by screen time & age group:")
print(desc.to_string(index=False))

# ── 3.2 Spearman correlation (ordinal screen time → continuous PA) ────────
print("\nSpearman correlations (screen_time vs phys_activity):")
for group in AG_ORDER:
    sub = df[df["age_group"] == group]
    r, p = stats.spearmanr(sub["screen_time"], sub["phys_activity"], nan_policy="omit")
    sig  = "***" if p < .001 else "**" if p < .01 else "*" if p < .05 else "ns"
    print(f"  {group:<35} r={r:+.3f}  p={p:.4f}  {sig}")

# ── 3.3 OLS regression: PA ~ screen_time + controls (per age group) ─────────
import statsmodels.formula.api as smf

# Normalize weights
df["weight_norm"] = df["weight"] / df["weight"].mean()

# Weighted OLS per age group
print("\nWeighted OLS: phys_activity ~ screen_time (survey weighted)")
for group in AG_ORDER:
    sub = df[df["age_group"] == group].dropna(subset=["screen_time","phys_activity","weight"])
    sub["weight_norm"] = sub["weight"] / sub["weight"].mean()
    if len(sub) < 30:
        print(f"  {group}: insufficient data")
        continue
    try:
        model = smf.wls("phys_activity ~ screen_time + age",
                        data=sub, weights=sub["weight_norm"]).fit()
        b  = model.params["screen_time"]
        p  = model.pvalues["screen_time"]
        ci = model.conf_int().loc["screen_time"]
        sig = "***" if p<.001 else "**" if p<.01 else "*" if p<.05 else "ns"
        print(f"  {group:<35} β={b:+.3f} [{ci[0]:+.3f},{ci[1]:+.3f}]  p={p:.4f}  {sig}")
    except Exception as e:
        print(f"  {group}: model error – {e}")

# ── 3.4 Interaction model: test if age group moderates the association ───────
print("\nInteraction OLS: PA ~ screen_time * age_group (H3b test)")
df["age_group_cat"] = pd.Categorical(df["age_group"], categories=AG_ORDER)
formula_int = "phys_activity ~ screen_time * C(age_group_cat, Treatment('6–11 (Middle Childhood)'))"
try:
    model_int = ols(formula_int, data=df.dropna(subset=["race_eth"])).fit()
    print(model_int.summary().tables[1])
    print(f"\nF-test for interaction terms: F={model_int.fvalue:.2f}  p={model_int.f_pvalue:.4f}")
except Exception as e:
    print(f"  Interaction model error – {e}")

# ── 3.5 Effect size: Cohen's d (high vs low screen time on PA) ────────────
print("\nCohen's d: high screen (≥3h) vs low screen (<1h) on physical activity:")
for group in AG_ORDER:
    sub  = df[df["age_group"] == group]
    high = sub[sub["screen_time"] >= 4]["phys_activity"].dropna()
    low  = sub[sub["screen_time"] <= 1]["phys_activity"].dropna()
    if len(high) > 10 and len(low) > 10:
        d = pg.compute_effsize(high, low, eftype="cohen")
        t, p = stats.ttest_ind(high, low)
        print(f"  {group:<35} d={d:+.3f}  t={t:.2f}  p={p:.4f}")

# ── 3.6 VISUALIZATIONS ───────────────────────────────────────────────────────
screen_labels = {0:"None", 1:"<1 h", 2:"1 h", 3:"2 h", 4:"3 h", 5:"4+ h"}

fig, axes = plt.subplots(1, 3, figsize=(16, 5), sharey=True)
palette = ["#2196F3", "#FF5722", "#4CAF50"]

for ax, (group, color) in zip(axes, zip(AG_ORDER, palette)):
    sub = df[df["age_group"] == group]
    grp = sub.groupby("screen_time")["phys_activity"].agg(["mean", "sem"]).reset_index()
    grp["label"] = grp["screen_time"].map(screen_labels)

    ax.bar(grp["label"], grp["mean"], color=color, alpha=0.8,
           yerr=grp["sem"], capsize=4, error_kw={"elinewidth": 1.2})
    ax.set_title(group, fontsize=11, fontweight="bold")
    ax.set_xlabel("Daily Screen Time")
    ax.set_ylabel("Mean Active Days / Week" if ax == axes[0] else "")
    ax.yaxis.set_major_formatter(mticker.FormatStrFormatter("%.1f"))

    # Annotate Spearman r
    sub_valid = sub.dropna(subset=["screen_time", "phys_activity"])
    r, p = stats.spearmanr(sub_valid["screen_time"], sub_valid["phys_activity"])
    sig = "***" if p < .001 else "**" if p < .01 else "*" if p < .05 else "ns"
    ax.text(0.97, 0.97, f"r = {r:.2f}{sig}", transform=ax.transAxes,
            ha="right", va="top", fontsize=9, color="black",
            bbox=dict(boxstyle="round,pad=0.3", fc="white", alpha=0.7))

fig.suptitle("H3: Mean Physical Activity by Screen Time & Developmental Stage",
             fontsize=13, fontweight="bold", y=1.02)
plt.tight_layout()
plt.savefig("h3_bar_phys_by_screen.png", dpi=150, bbox_inches="tight")
plt.show()
print("  → Saved h3_bar_phys_by_screen.png")

# Scatter + regression line per group
fig2, axes2 = plt.subplots(1, 3, figsize=(16, 5))
for ax, (group, color) in zip(axes2, zip(AG_ORDER, palette)):
    sub = df[df["age_group"] == group].dropna(subset=["screen_time","phys_activity"])
    if len(sub) < 10:
        ax.set_title(group + "\n(no data)", fontsize=11)
        continue
    jitter_x = sub["screen_time"] + np.random.uniform(-0.15, 0.15, len(sub))
    jitter_y = sub["phys_activity"] + np.random.uniform(-0.15, 0.15, len(sub))
    ax.scatter(jitter_x, jitter_y, alpha=0.08, s=8, color=color)
    x = sub["screen_time"].values
    y = sub["phys_activity"].values
    m, b = np.polyfit(x, y, 1)
    xr = np.linspace(x.min(), x.max(), 100)
    ax.plot(xr, m*xr + b, color="black", lw=2)
    ax.set_xticks(range(6)); ax.set_xticklabels(screen_labels.values(), rotation=30)
    ax.set_xlabel("Screen Time"); ax.set_ylabel("Active Days / Week")
    ax.set_title(group, fontsize=11, fontweight="bold")

fig2.suptitle("H3: Screen Time vs Physical Activity (jittered)", fontsize=13, fontweight="bold")
plt.tight_layout()
plt.savefig("h3_scatter_regression.png", dpi=150, bbox_inches="tight")
plt.show()
print("  → Saved h3_scatter_regression.png")


# ════════════════════════════════════════════════════════════════════════════
# H4 – SOCIODEMOGRAPHIC MODERATION
# Associations between screen time and all 3 outcomes vary by
# race/ethnicity, family income, and parental education,
# with stronger associations in lower-income households.
# ════════════════════════════════════════════════════════════════════════════

print("\n" + "═"*60)
print("H4 ANALYSIS: Sociodemographic Moderation")
print("═"*60)

OUTCOMES = {
    "phys_activity": "Physical Activity (days/wk)",
    "attention":     "Attention Difficulty (0/1)",
    "anxiety":       "Anxiety Symptom (0/1)",
}

MODERATORS = {
    "income_pct":   ("income_label", "Income Level"),
    "race_eth":     ("race_label",   "Race/Ethnicity"),
    "parent_educ":  ("educ_label",   "Parental Education"),
}

# ── 4.1 Correlation of screen_time with each outcome by income group ─────────
print("\nSpearman r (screen_time vs outcomes) by INCOME group:")
income_order = list(income_labels.values())
for out_col, out_label in OUTCOMES.items():
    if out_col not in df.columns: continue
    print(f"\n  Outcome: {out_label}")
    for inc_code, inc_label in income_labels.items():
        sub = df[df["income_pct"] == inc_code].dropna(subset=["screen_time", out_col])
        if len(sub) < 30: continue
        r, p = stats.spearmanr(sub["screen_time"], sub[out_col])
        sig  = "***" if p < .001 else "**" if p < .01 else "*" if p < .05 else "ns"
        print(f"    {inc_label:<20} r={r:+.3f}  p={p:.4f}  n={len(sub):,}  {sig}")

# ── 4.2 Interaction models: outcome ~ screen_time * income (main H4 test) ───
print("\nInteraction OLS/Logit: screen_time * income → outcomes")
for out_col, out_label in OUTCOMES.items():
    if out_col not in df.columns: continue
    sub = df.dropna(subset=["screen_time", out_col, "income_pct", "age", "race_eth", "parent_educ"])
    is_binary = sub[out_col].nunique() <= 2

    formula = (f"{out_col} ~ screen_time * C(income_pct) "
           "+ age + C(race_eth) + C(parent_educ)")
    try:
        if is_binary:
            model = logit(formula, data=sub).fit(disp=0)
        else:
            model = ols(formula, data=sub).fit()

        # Extract interaction terms
        inter_terms = [c for c in model.params.index if "screen_time: C(FPL_GROUP)" in c]
        print(f"\n  {out_label} ({'logit' if is_binary else 'OLS'}):")
        for term in inter_terms:
            b  = model.params[term]
            p  = model.pvalues[term]
            sig = "***" if p < .001 else "**" if p < .01 else "*" if p < .05 else "ns"
            print(f"    {term:<55} β={b:+.3f}  p={p:.4f}  {sig}")
    except Exception as e:
        print(f"  {out_label}: model error – {e}")

# ── 4.3 Race/Ethnicity moderation (same approach) ───────────────────────────
print("\nSpearman r (screen_time vs phys_activity) by RACE/ETHNICITY:")
if "phys_activity" in df.columns:
    for race_code, race_label in race_labels.items():
        sub = df[df["race_eth"] == race_code].dropna(subset=["screen_time","phys_activity"])
        if len(sub) < 30: continue
        r, p = stats.spearmanr(sub["screen_time"], sub["phys_activity"])
        sig  = "***" if p < .001 else "**" if p < .01 else "*" if p < .05 else "ns"
        print(f"  {race_label:<20} r={r:+.3f}  p={p:.4f}  n={len(sub):,}  {sig}")

# ── 4.4 Visualization: screen_time → PA correlation by income ───────────────
if "phys_activity" in df.columns:
    fig3, axes3 = plt.subplots(1, 3, figsize=(14, 5), sharey=True)
fpl_groups = list(df["income_pct"].dropna().unique())
fpl_groups = sorted([x for x in fpl_groups if isinstance(x, str)])
income_palette3 = ["#E53935", "#FB8C00", "#43A047"]

for ax, (fpl, color) in zip(axes3, zip(fpl_groups, income_palette3)):
    sub = df[df["income_pct"] == fpl].dropna(subset=["screen_time","phys_activity"])
    if len(sub) < 10:
        ax.set_title(fpl + "\n(no data)", fontsize=10)
        continue
    grp = sub.groupby("screen_time")["phys_activity"].agg(["mean","sem"]).reset_index()
    grp["label"] = grp["screen_time"].map(screen_labels)
    ax.bar(grp["label"], grp["mean"], color=color, alpha=0.8,
           yerr=grp["sem"], capsize=4)
    ax.set_title(fpl, fontsize=10, fontweight="bold")
    ax.set_xlabel("Screen Time")
    ax.tick_params(axis="x", rotation=30)
    if ax == axes3[0]: ax.set_ylabel("Mean Active Days / Week")
    r, p = stats.spearmanr(sub["screen_time"], sub["phys_activity"])
    sig = "***" if p < .001 else "**" if p < .01 else "*" if p < .05 else "ns"
    ax.text(0.97, 0.97, f"r = {r:.2f}{sig}", transform=ax.transAxes,
            ha="right", va="top", fontsize=9,
            bbox=dict(boxstyle="round,pad=0.3", fc="white", alpha=0.7))

fig3.suptitle("H4: Screen Time → Physical Activity by Family Income",
              fontsize=13, fontweight="bold")
plt.tight_layout()
plt.savefig("h4_income_moderation_pa.png", dpi=150, bbox_inches="tight")
plt.show()


# Heatmap: correlation magnitude by income x outcome
outcomes_avail = [c for c in ["phys_activity","attention","anxiety","depression"]
                  if c in df.columns]
heat_data = []
for inc_code, inc_label in income_labels.items():
    row = {"Income": inc_label}
    for out in outcomes_avail:
        sub = df[df["income_pct"] == inc_code].dropna(subset=["screen_time", out])
        r, _ = stats.spearmanr(sub["screen_time"], sub[out]) if len(sub) > 30 else (np.nan, np.nan)
        row[out.replace("_"," ").title()] = round(r, 3)
    heat_data.append(row)

heat_df = pd.DataFrame(heat_data).set_index("Income")
fig4, ax4 = plt.subplots(figsize=(8, 4))
sns.heatmap(heat_df, annot=True, fmt=".2f", cmap="RdBu_r", center=0,
            vmin=-0.4, vmax=0.4, linewidths=0.5, ax=ax4)
ax4.set_title("H4: Spearman r (Screen Time vs Outcomes) by Income Group",
              fontsize=12, fontweight="bold")
plt.tight_layout()
plt.savefig("h4_heatmap_income.png", dpi=150, bbox_inches="tight")
plt.show()
print("  → Saved h4_heatmap_income.png")

# ── 4.5 Multiple testing correction (Bonferroni) ─────────────────────────────
print("\nBonferroni correction for multiple comparisons (H4 correlations):")
pvals, labels = [], []
for inc_code, inc_label in income_labels.items():
    for out in outcomes_avail:
        sub = df[df["income_pct"] == inc_code].dropna(subset=["screen_time", out])
        if len(sub) > 30:
            _, p = stats.spearmanr(sub["screen_time"], sub[out])
            pvals.append(p)
            labels.append(f"{inc_label} × {out}")

reject, pvals_corr, _, _ = multipletests(pvals, method="bonferroni")
for lbl, orig, corr, rej in zip(labels, pvals, pvals_corr, reject):
    print(f"  {lbl:<45} p_raw={orig:.4f}  p_bonf={corr:.4f}  sig={'✓' if rej else '✗'}")

print("\n✅  Analysis complete. Check PNG files for all visualizations.")
