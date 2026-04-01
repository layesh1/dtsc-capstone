import os
from supabase import create_client
import pandas as pd
from dotenv import load_dotenv
import statsmodels.formula.api as smf
import numpy as np
from scipy import stats
from statsmodels.stats.multitest import multipletests
import matplotlib.pyplot as plt
import matplotlib.lines as mlines
import seaborn as sns

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_all_rows(supabase, table_name):
    all_data = []
    batch_size = 1000
    offset = 0
    while True:
        response = supabase.table(table_name)\
            .select("SCREENTIME, PHYSACTIV, FWC, AGE_GROUP, FPL_GROUP, SC_RACE_R, HIGRADE_TVIS, ADHD, ANXIETY, DEPRESSION")\
            .range(offset, offset + batch_size - 1)\
            .execute()
        batch = response.data
        if not batch:
            break
        all_data.extend(batch)
        offset += batch_size
        print(f"Fetched {len(all_data)} rows...", end="\r")
    return pd.DataFrame(all_data)

df = fetch_all_rows(supabase, "nsch_data")
print(f"\nLoaded {len(df):,} rows")

# ── RECODE ───────────────────────────────────────────────────────────────────
df["SCREENTIME"]  = pd.to_numeric(df["SCREENTIME"],  errors="coerce")
df["PHYSACTIV"]   = pd.to_numeric(df["PHYSACTIV"],   errors="coerce")
df["FWC"]         = pd.to_numeric(df["FWC"],         errors="coerce")
df["SC_RACE_R"]   = pd.to_numeric(df["SC_RACE_R"],   errors="coerce")
df["HIGRADE_TVIS"]= pd.to_numeric(df["HIGRADE_TVIS"],errors="coerce")
df["ADHD"]        = pd.to_numeric(df["ADHD"],        errors="coerce")
df["ANXIETY"]     = pd.to_numeric(df["ANXIETY"],     errors="coerce")
df["DEPRESSION"]  = pd.to_numeric(df["DEPRESSION"],  errors="coerce")

# plain English labels
income_map = {
    "0–99%":    1,
    "100–199%": 2,
    "200–399%": 3,
}
income_labels = {
    1: "Below Poverty (0–99%)",
    2: "Near Poverty (100–199%)",
    3: "Middle Income (200–399%)",
}
df["INCOME_NUM"] = df["FPL_GROUP"].map(income_map)

race_labels = {
    1: "White (Non-Hispanic)",
    2: "Black (Non-Hispanic)",
    3: "Hispanic",
    4: "Asian (Non-Hispanic)",
    5: "Other/Multiracial",
}
df["race_label"] = df["SC_RACE_R"].map(race_labels)

educ_labels = {
    1: "Less than High School",
    2: "High School Diploma",
    3: "Some College",
    4: "Bachelor's or Higher",
}
df["educ_label"] = df["HIGRADE_TVIS"].map(educ_labels)
educ_order = list(educ_labels.values())

income_order_labels = list(income_labels.values())
race_order = list(race_labels.values())

screen_map   = {1: "<1 hr", 2: "1 hr", 3: "2 hrs", 4: "3 hrs", 5: "4+ hrs"}
screen_order = ["<1 hr", "1 hr", "2 hrs", "3 hrs", "4+ hrs"]
df["screen_label"] = df["SCREENTIME"].map(screen_map)

# exclude 0-5
df = df[df["AGE_GROUP"].isin(["6-11", "12-17"])]
df["FWC_norm"] = df["FWC"] / df["FWC"].mean()

age_labels_map = {
    "6-11":  "Ages 6–11 (Middle Childhood)",
    "12-17": "Ages 12–17 (Adolescence)"
}

# ── PLOT 1: Line plots — PA by screen time, one panel per factor ─────────────
# Shows whether each sociodemographic factor moderates the screen time effect

fig, axes = plt.subplots(3, 2, figsize=(14, 16))
fig.suptitle("H4: Does Screen Time's Effect on Physical Activity Vary by\nIncome, Race, and Education?",
             fontsize=14, fontweight="bold", y=1.01)

# color palettes per factor
income_colors = ["#e74c3c", "#f39c12", "#27ae60"]
race_colors   = ["#3498db", "#e74c3c", "#f39c12", "#9b59b6", "#1abc9c"]
educ_colors   = ["#e74c3c", "#f39c12", "#3498db", "#27ae60"]

factor_configs = [
    ("INCOME_NUM",  income_labels,  income_colors,  income_order_labels, "Family Income Level"),
    ("SC_RACE_R",   race_labels,    race_colors,    race_order,          "Race/Ethnicity"),
    ("HIGRADE_TVIS",educ_labels,    educ_colors,    educ_order,          "Parental Education"),
]

for row_idx, (col, label_map, colors, order, factor_title) in enumerate(factor_configs):
    for col_idx, age_group in enumerate(["6-11", "12-17"]):
        ax = axes[row_idx][col_idx]
        sub = df[df["AGE_GROUP"] == age_group].dropna(subset=["SCREENTIME", "PHYSACTIV", col])

        for code, label in label_map.items():
            grp = sub[sub[col] == code]
            if len(grp) < 50:
                continue
            means = (grp.groupby("screen_label")["PHYSACTIV"]
                       .agg(["mean", "sem"])
                       .reindex(screen_order)
                       .dropna()
                       .reset_index())
            if len(means) < 3:
                continue

            color = colors[list(label_map.keys()).index(code) % len(colors)]
            ax.plot(means["screen_label"], means["mean"],
                    color=color, linewidth=2.5, marker="o", markersize=6,
                    label=label)
            ax.fill_between(means["screen_label"],
                            means["mean"] - means["sem"],
                            means["mean"] + means["sem"],
                            color=color, alpha=0.12)

        ax.set_title(f"{factor_title}\n{age_labels_map[age_group]}",
                     fontsize=10, fontweight="bold")
        ax.set_xlabel("Daily Screen Time", fontsize=9)
        ax.set_ylabel("Mean Active Days / Week", fontsize=9)
        ax.tick_params(axis="x", rotation=30, labelsize=8)
        ax.grid(True, alpha=0.3)
        ax.set_ylim(1.8, 3.8)
        ax.legend(fontsize=7.5, title_fontsize=8,
                  title=factor_title, loc="upper right")

plt.tight_layout()
plt.savefig("visualizations/h4_all_factors_lineplot.png", dpi=150, bbox_inches="tight")
plt.show()
print("  → Saved h4_all_factors_lineplot.png")

# ── PLOT 2: Coefficient forest plot — which factors predict PA most? ──────────
# Multivariate WLS regression: PA ~ screentime + income + race + education
# Shows the independent effect of each factor after controlling for others

outcomes = {
    "PHYSACTIV":  "Physical Activity",
    "ADHD":       "Attention (ADHD)",
    "ANXIETY":    "Anxiety",
    "DEPRESSION": "Depression",
}

fig, axes = plt.subplots(1, 2, figsize=(15, 7), sharey=True)
fig.suptitle("H4: Independent Effect of Screen Time on Each Outcome\nControlling for Income, Race & Education",
             fontsize=13, fontweight="bold")

for ax, age_group in zip(axes, ["6-11", "12-17"]):
    sub = df[df["AGE_GROUP"] == age_group].dropna(
        subset=["SCREENTIME", "PHYSACTIV", "INCOME_NUM", "SC_RACE_R",
                "HIGRADE_TVIS", "FWC_norm", "ADHD", "ANXIETY", "DEPRESSION"]
    ).copy()

    results = []
    for out_col, out_label in outcomes.items():
        try:
            model = smf.wls(
                f"{out_col} ~ SCREENTIME + INCOME_NUM + C(SC_RACE_R) + HIGRADE_TVIS",
                data=sub,
                weights=sub["FWC_norm"]
            ).fit()

            b  = model.params["SCREENTIME"]
            ci = model.conf_int().loc["SCREENTIME"]
            p  = model.pvalues["SCREENTIME"]
            sig = "***" if p < .001 else "**" if p < .01 else "*" if p < .05 else "ns"
            results.append({
                "outcome": out_label,
                "coef": b,
                "ci_low": ci[0],
                "ci_high": ci[1],
                "p": p,
                "sig": sig,
            })
            print(f"  {age_group} | {out_label:<25} β={b:+.4f}  p={p:.4f}  {sig}")
        except Exception as e:
            print(f"  {age_group} | {out_label}: error – {e}")

    res_df = pd.DataFrame(results)
    colors_forest = ["#e74c3c" if c < 0 else "#3498db" for c in res_df["coef"]]

    y_pos = range(len(res_df))
    ax.barh(y_pos, res_df["coef"], color=colors_forest, alpha=0.8, height=0.5)
    ax.errorbar(res_df["coef"], y_pos,
                xerr=[res_df["coef"] - res_df["ci_low"],
                      res_df["ci_high"] - res_df["coef"]],
                fmt="none", color="black", capsize=5, linewidth=1.5)

    # significance stars
    for i, row in res_df.iterrows():
        x_pos = row["ci_high"] + 0.001
        ax.text(x_pos, i, row["sig"], va="center", fontsize=10, color="black")

    ax.axvline(0, color="black", linewidth=1, linestyle="--", alpha=0.5)
    ax.set_yticks(y_pos)
    ax.set_yticklabels(res_df["outcome"], fontsize=11)
    ax.set_xlabel("Regression Coefficient (β)\nControlling for income, race & education", fontsize=10)
    ax.set_title(age_labels_map[age_group], fontsize=11, fontweight="bold")
    ax.grid(True, alpha=0.3, axis="x")

    # color legend
    neg_patch = mlines.Line2D([], [], color="#e74c3c", linewidth=8, label="Negative effect (↓)")
    pos_patch = mlines.Line2D([], [], color="#3498db", linewidth=8, label="Positive effect (↑)")
    ax.legend(handles=[neg_patch, pos_patch], fontsize=9, loc="lower right")

plt.tight_layout()
plt.savefig("visualizations/h4_coefficient_plot.png", dpi=150, bbox_inches="tight")
plt.show()
print("  → Saved h4_coefficient_plot.png")

# ── PLOT 3: Heatmap — Spearman r by all 3 factors × outcomes × age ──────────
fig, axes = plt.subplots(3, 2, figsize=(13, 14))
fig.suptitle("H4: Spearman r (Screen Time vs Outcomes) by Sociodemographic Factor & Age",
             fontsize=13, fontweight="bold")

factor_configs_heat = [
    ("INCOME_NUM",   income_labels,  "Family Income"),
    ("SC_RACE_R",    race_labels,    "Race/Ethnicity"),
    ("HIGRADE_TVIS", educ_labels,    "Parental Education"),
]

out_cols   = ["PHYSACTIV", "ADHD", "ANXIETY", "DEPRESSION"]
out_labels = ["Phys Activity", "Attention", "Anxiety", "Depression"]

for row_idx, (col, label_map, factor_title) in enumerate(factor_configs_heat):
    for col_idx, age_group in enumerate(["6-11", "12-17"]):
        ax = axes[row_idx][col_idx]
        sub = df[df["AGE_GROUP"] == age_group]
        heat_data = []

        for code, label in label_map.items():
            row_data = {}
            grp = sub[sub[col] == code]
            for out_col, out_lbl in zip(out_cols, out_labels):
                g = grp.dropna(subset=["SCREENTIME", out_col])
                if len(g) > 30:
                    r, _ = stats.spearmanr(g["SCREENTIME"], g[out_col])
                    row_data[out_lbl] = round(r, 3)
                else:
                    row_data[out_lbl] = np.nan
            heat_data.append(row_data)

        heat_df = pd.DataFrame(heat_data, index=list(label_map.values()))
        # shorten long labels for heatmap
        heat_df.index = [l[:22] for l in heat_df.index]

        sns.heatmap(heat_df, annot=True, fmt=".2f", cmap="RdBu_r",
                    center=0, vmin=-0.4, vmax=0.4,
                    linewidths=0.5, ax=ax,
                    cbar=(col_idx == 1))

        ax.set_title(f"{factor_title} — {age_labels_map[age_group]}",
                     fontsize=9, fontweight="bold")
        ax.tick_params(axis="y", rotation=0, labelsize=8)
        ax.tick_params(axis="x", labelsize=9)

plt.tight_layout()
plt.savefig("visualizations/h4_heatmap_all_factors.png", dpi=150, bbox_inches="tight")
plt.show()
print("  → Saved h4_heatmap_all_factors.png")

print("\n✅  H4 analysis complete.")