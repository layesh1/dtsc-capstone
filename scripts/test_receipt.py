"""
test_receipt.py
Run this from your project root to test the attention receipt
without retraining the model.
"""

from backend import AttentionReceipt, SCREENTIME_LABELS

# Load pre-trained models from disk
receipt = AttentionReceipt.load("/Users/hannahw/dtsc-capstone/models/")

# ── Single prediction ─────────────────────────────────────────
result = receipt.predict(
    screentime = 4,          # 3 hrs/day
    age        = 14,
    physactiv  = 2,          # 2 days/week active
    fpl_group  = '200–399%',
    sex        = 2,          # female
    bedtime    = 2,
)

print(result['summary'])
print()
print("Full output:")
print(f"  Profile:     {result['cluster']['label']}")
print(f"  Age band:    {result['age_band']}")
print(f"  Risks:       {result['risks']}")
print(f"  Top driver:  {result['top_driver']}")
print(f"  SHAP values: {result['shap']}")
print(f"  Flags:       {result['flags']}")

print("\n" + "="*65)
print("Risk across screen time levels  (age=14, physactiv=2, female)")
print("="*65)
print(f"  {'Screen Time':<12} {'ADHD':>8} {'Anxiety':>10} {'Depression':>12}  Profile")
print("  " + "-"*65)
for st in [1, 2, 3, 4, 5]:
    r = receipt.predict(screentime=st, age=14, physactiv=2,
                        fpl_group='200–399%', sex=2)
    print(f"  {SCREENTIME_LABELS[st]:<12} "
          f"{r['risks']['ADHD']:>7.1f}% "
          f"{r['risks']['Anxiety']:>9.1f}% "
          f"{r['risks']['Depression']:>11.1f}%  "
          f"{r['cluster']['label']}")

receipt.plot_shap_summary(outcome='ADHD_CLINICAL')
receipt.plot_shap_summary(outcome='ANXIETY',
                          save_path='visualizations/rf_shap_anxiety.png')
receipt.plot_shap_summary(outcome='DEPRESSION',
                          save_path='visualizations/rf_shap_depression.png')
