# The Attention Economy — DTSC Capstone

**Authors:** Lena Ayesh, Precious Gilbert, Katie Leedom, Anisha Nannapaneni, Peyton Sharpe, Hannah Wilson  
**Institution:** UNC Charlotte  - School of Data Science
**Advisors:** Dr. Ted Carmichael, Dr. Mirsad Hadžikadić
**Data:** National Survey of Children's Health (NSCH), 2018–2024 (n = 309,000+)

## Repository Structure
- `scripts/` — Survey-weighted logistic regression analyses (H1–H4)
- `models/` — Multi-output Random Forest classifier + SHAP explainer
- `analysis_output/` — Cross-validation results and descriptive statistics
- `visualizations/` — Figures for paper
- `figma-design/` — Source for the Attention Receipt web app

## Web App
Live deployment: https://dtsc-capstone.vercel.app  
The web app uses a Random Forest model for individual-level prediction.  
Statistical inference in the paper uses survey-weighted logistic regression.  
These are methodologically distinct — see paper Section 3.5.

## Key Findings
- Screen time → ADHD strongest in ages 0–5 (OR = 1.32)
- Screen time → anxiety strongest in ages 12–17
- 3+ hrs social media = 2.1× higher anxiety odds in adolescents
- Consistent SES reversal: lower-income risk in early childhood, higher-income risk in adolescence
