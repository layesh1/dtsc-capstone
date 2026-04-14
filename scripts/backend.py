"""
attention_receipt_backend.py

Combined multi-output Random Forest model for the Attention Receipt.
Predicts ADHD, anxiety, and depression risk simultaneously from
screen time + behavioral/demographic features.

Replaces three separate logistic regressions with one unified model.
Uses SHAP for interpretability.

Usage:
    # Train and save (run once):
    python attention_receipt_backend.py

    # In your app:
    from attention_receipt_backend import AttentionReceipt
    receipt = AttentionReceipt.load("models/")
    result  = receipt.predict(screentime=4, age=14, physactiv=2, ...)
"""

import os
import json
import pickle
import warnings
import numpy as np
import pandas as pd
import shap
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestClassifier
from sklearn.multioutput import MultiOutputClassifier
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.metrics import roc_auc_score, RocCurveDisplay
warnings.filterwarnings('ignore')
from sklearn.calibration import CalibratedClassifierCV



OUTCOMES = ['ADHD_CLINICAL', 'ANXIETY', 'DEPRESSION']
OUTCOME_LABELS = {
    'ADHD_CLINICAL': 'ADHD',
    'ANXIETY':       'Anxiety',
    'DEPRESSION':    'Depression',
}

FEATURES = [
    'SCREENTIME',   
    'AGE',          
    'PHYSACTIV',    
    'BEDTIME',     
    'FPL_GROUP',   
    'SEX',          
]

FEATURE_LABELS = {
    'SCREENTIME': 'Screen Time',
    'AGE':        'Age',
    'PHYSACTIV':  'Physical Activity',
    'BEDTIME':    'Bedtime',
    'FPL_GROUP':  'Family Income',
    'SEX':        'Sex',
}

SCREENTIME_LABELS = {1: '<1 hr', 2: '1 hr', 3: '2 hrs', 4: '3 hrs', 5: '4+ hrs'}
FPL_MAP = {'0–99%': 1, '100–199%': 2, '200–399%': 3, '400% +': 4}


def get_age_band(age):
    if age <= 8:  return 'Young Child (3–8)'
    if age <= 12: return 'Preteen (9–12)'
    return 'Teen (13–17)'

def get_age_group(age):
    if age <= 5:  return '0-5'
    if age <= 11: return '6-11'
    return '12-17'

def get_profile(screentime: int, physactiv: float) -> dict:
    """
    Assign a child to a named profile based on screen time
    and physical activity using explicit NSCH-scale rules.
    No algorithm — fully transparent and reproducible.
    """
    high_screen = screentime >= 4   
    low_screen  = screentime <= 2   
    active      = physactiv  >= 4  
    sedentary   = physactiv  <= 2   

    if low_screen and active:
        return {
            'label':       'Low Screen, Active',
            'description': 'Low daily screen time and high physical activity — '
                           'lowest risk profile across all age groups.',
            'screentime':  screentime,
            'physactiv':   physactiv,
        }
    elif low_screen and sedentary:
        return {
            'label':       'Low Screen, Sedentary',
            'description': 'Low screen time but limited physical activity. '
                           'Screen time is not a concern; activity level may be.',
            'screentime':  screentime,
            'physactiv':   physactiv,
        }
    elif low_screen:
        return {
            'label':       'Low Screen, Moderate Activity',
            'description': 'Low screen time with average physical activity. '
                           'Generally a low-risk profile.',
            'screentime':  screentime,
            'physactiv':   physactiv,
        }
    elif high_screen and active:
        return {
            'label':       'High Screen, Active',
            'description': 'High screen time but offset by strong physical activity. '
                           'Physical activity may buffer some screen time effects.',
            'screentime':  screentime,
            'physactiv':   physactiv,
        }
    elif high_screen and sedentary:
        return {
            'label':       'High Screen, Sedentary',
            'description': 'High daily screen time combined with low physical activity — '
                           'highest risk profile. Associated with elevated anxiety, '
                           'depression, and attention difficulties.',
            'screentime':  screentime,
            'physactiv':   physactiv,
        }
    elif high_screen:
        return {
            'label':       'High Screen, Moderate Activity',
            'description': 'High screen time with average physical activity. '
                           'Screen time warrants monitoring.',
            'screentime':  screentime,
            'physactiv':   physactiv,
        }
    elif sedentary:
        return {
            'label':       'Moderate Screen, Sedentary',
            'description': 'Average screen time but low physical activity. '
                           'Sedentary behavior independent of screens may contribute to risk.',
            'screentime':  screentime,
            'physactiv':   physactiv,
        }
    elif active:
        return {
            'label':       'Moderate Screen, Active',
            'description': 'Average screen time with high physical activity. '
                           'A balanced profile with moderate risk.',
            'screentime':  screentime,
            'physactiv':   physactiv,
        }
    else:
        return {
            'label':       'Moderate Screen, Moderate Activity',
            'description': 'Average screen time and average physical activity. '
                           'A typical profile for this age group.',
            'screentime':  screentime,
            'physactiv':   physactiv,
        }


class AttentionReceipt:
    """
    Multi-output Random Forest predicting ADHD, anxiety, and
    depression risk simultaneously from screen time + covariates.
    """

    def __init__(self, n_estimators=300, max_depth=8, random_state=42):
        self.n_estimators     = n_estimators
        self.max_depth        = max_depth
        self.random_state     = random_state
        self.model            = None
        self.explainer        = None
        self.X_background     = None
        self.feature_names    = FEATURES
        self.eval_results     = {}
        self.is_fitted        = False

    def _prepare(self, df: pd.DataFrame):
        df = df.copy()

        df['ADHD_CLINICAL'] = (
            (df['K2Q31A'] == 1) & (df['K2Q31C'] == 1)
        ).astype(int)
        df['ANXIETY']    = df['K2Q33A'].map({1: 1, 2: 0})
        df['DEPRESSION'] = df['K2Q32A'].map({1: 1, 2: 0})

        df = df.rename(columns={'SC_AGE_YEARS': 'AGE', 'SC_SEX': 'SEX'})
        df['SEX']       = df['SEX'].map({1: 0, 2: 1})
        df['FPL_GROUP'] = df['FPL_GROUP'].map(FPL_MAP)

        keep = FEATURES + OUTCOMES + ['FWC']
        df   = df[[c for c in keep if c in df.columns]].dropna().reset_index(drop=True)

        X = df[FEATURES].astype(float)
        Y = df[OUTCOMES].astype(int)
        W = df['FWC'] if 'FWC' in df.columns else None
        return X, Y, W

    def fit(self, df: pd.DataFrame, eval: bool = True):
        print("Preparing data...")
        X, Y, W = self._prepare(df)
        print(f"  n={len(X):,}  |  "
              f"ADHD={Y['ADHD_CLINICAL'].mean():.1%}  "
              f"Anxiety={Y['ANXIETY'].mean():.1%}  "
              f"Depression={Y['DEPRESSION'].mean():.1%}")

        sample_weight = (W / W.mean()).values if W is not None else None

        if eval:
            print("\n5-fold cross-validation:")
            self.eval_results = self._cross_validate(X, Y, sample_weight)

        print("\nFitting final model...")
        base_rf = RandomForestClassifier(
            n_estimators     = self.n_estimators,
            max_depth        = self.max_depth,
            class_weight     = 'balanced',
            random_state     = self.random_state,
            n_jobs           = -1,
            min_samples_leaf = 20,
        )
        self.model = MultiOutputClassifier(base_rf)
        self.model.fit(X, Y, sample_weight=sample_weight)

        print("Calibrating probabilities...")
        self.calibrated_estimators_ = []
        for i, outcome in enumerate(OUTCOMES):
            cal = CalibratedClassifierCV(
                self.model.estimators_[i], method='isotonic', cv='prefit'
            )
            cal.fit(X, Y[outcome], sample_weight=sample_weight)
            self.calibrated_estimators_.append(cal)
            pred_mean = cal.predict_proba(X)[:, 1].mean()
            obs_mean  = Y[outcome].mean()
            print(f"  {OUTCOME_LABELS[outcome]:<12} "
                  f"observed={obs_mean:.1%}  calibrated={pred_mean:.1%}")

        print("Building SHAP explainer...")
        idx = np.random.default_rng(42).choice(len(X), size=2000, replace=False)
        self.X_background = X.iloc[idx].reset_index(drop=True)
        self.explainer = {
            outcome: shap.TreeExplainer(self.model.estimators_[i])
            for i, outcome in enumerate(OUTCOMES)
        }

        self.is_fitted = True
        print("Done.\n")
        self._print_cv_summary()
        return self

    def _cross_validate(self, X, Y, sample_weight):
        results = {}
        strat   = (Y.sum(axis=1) > 0).astype(int)
        cv      = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

        for i, outcome in enumerate(OUTCOMES):
            y    = Y[outcome].values
            aucs = []
            for train_idx, val_idx in cv.split(X, strat):
                rf = RandomForestClassifier(
                    n_estimators=100, max_depth=self.max_depth,
                    class_weight='balanced', random_state=42,
                    n_jobs=-1, min_samples_leaf=20,
                )
                w = sample_weight[train_idx] if sample_weight is not None else None
                rf.fit(X.iloc[train_idx], y[train_idx], sample_weight=w)
                prob = rf.predict_proba(X.iloc[val_idx])[:, 1]
                aucs.append(roc_auc_score(y[val_idx], prob))

            results[outcome] = {
                'auc_mean': float(np.mean(aucs)),
                'auc_std':  float(np.std(aucs)),
                'fold_aucs': [float(a) for a in aucs],
            }
            print(f"  {OUTCOME_LABELS[outcome]:<12} "
                  f"AUC = {np.mean(aucs):.3f} ± {np.std(aucs):.3f}")
        return results

    def _print_cv_summary(self):
        if not self.eval_results:
            return
        print("="*50)
        print("CV SUMMARY")
        print("="*50)
        for outcome, res in self.eval_results.items():
            print(f"  {OUTCOME_LABELS[outcome]:<12} "
                  f"AUC = {res['auc_mean']:.3f} ± {res['auc_std']:.3f}")

    def predict(
        self,
        screentime : int,
        age        : int,
        physactiv  : float = 3.0,
        bedtime    : int   = 2,
        fpl_group  : str   = '200–399%',
        sex        : int   = 1,
    ) -> dict:
        if not self.is_fitted:
            raise RuntimeError("Call .fit(df) or .load() before .predict()")

        fpl_num = FPL_MAP.get(fpl_group, 3)
        sex_num = 0 if sex == 1 else 1

        X_input = pd.DataFrame([{
            'SCREENTIME': screentime,
            'AGE':        age,
            'PHYSACTIV':  physactiv,
            'BEDTIME':    bedtime,
            'FPL_GROUP':  fpl_num,
            'SEX':        sex_num,
        }])

        risks = {}
        estimators = (self.calibrated_estimators_
                      if hasattr(self, 'calibrated_estimators_')
                      else self.model.estimators_)
        for i, outcome in enumerate(OUTCOMES):
            prob = estimators[i].predict_proba(X_input)[0, 1]
            risks[OUTCOME_LABELS[outcome]] = round(float(prob) * 100, 1)

        sv_raw = self.explainer['ADHD_CLINICAL'].shap_values(X_input)
        if isinstance(sv_raw, list):
            sv = np.array(sv_raw[1]).flatten()   # class 1 (risk=1)
        else:
            sv = np.array(sv_raw).flatten()
        sv = sv[:len(FEATURES)]
        shap_dict   = {FEATURE_LABELS[f]: round(float(sv[i]), 4)
                       for i, f in enumerate(FEATURES)}
        top_driver  = max(shap_dict, key=lambda k: abs(shap_dict[k]))

        age_band = get_age_band(age)
        cluster  = self._assign_cluster(screentime, physactiv, age_band)

        flags = []
        if risks['ADHD']       > 5:  flags.append('Elevated ADHD risk')
        if risks['Anxiety']    > 15: flags.append('Elevated anxiety risk')
        if risks['Depression'] > 8:  flags.append('Elevated depression risk')
        if screentime >= 4:          flags.append('High screen time (3+ hrs/day)')
        if physactiv  <= 2:          flags.append('Low physical activity')

        return {
            'risks':            risks,
            'cluster':          cluster,
            'age_band':         age_band,
            'age_group':        get_age_group(age),
            'screentime_label': SCREENTIME_LABELS.get(screentime, str(screentime)),
            'flags':            flags,
            'shap':             shap_dict,
            'top_driver':       top_driver,
            'summary':          self._build_summary(
                                    risks, cluster, screentime, flags, top_driver),
            'inputs': {
                'screentime': screentime, 'age': age,
                'physactiv': physactiv,   'bedtime': bedtime,
                'fpl_group': fpl_group,   'sex': sex,
            }
        }

    def _assign_cluster(self, screentime, physactiv, age_band):
        return get_profile(screentime, physactiv)

    def _build_summary(self, risks, cluster, screentime, flags, top_driver):
        st_label = SCREENTIME_LABELS.get(screentime, str(screentime))
        lines = [
            f"Screen time:  {st_label}/day",
            f"Profile:      {cluster['label']}",
            f"              {cluster['description']}",
            "",
            "Predicted risk:",
            f"  ADHD:       {risks['ADHD']:.1f}%",
            f"  Anxiety:    {risks['Anxiety']:.1f}%",
            f"  Depression: {risks['Depression']:.1f}%",
            "",
            f"Top risk driver: {top_driver}",
        ]
        if flags:
            lines += ["", "Flags:"] + [f"  ⚠ {f}" for f in flags]
        return "\n".join(lines)

    def plot_feature_importance(self, save_path='visualizations/rf_feature_importance.png'):
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        fig, axes = plt.subplots(1, 3, figsize=(15, 5))
        fig.suptitle('Random Forest Feature Importance by Outcome',
                     fontsize=13, fontweight='bold')

        colors_map = {f: ('#e74c3c' if f == 'SCREENTIME' else '#3498db')
                      for f in FEATURES}

        for ax, (outcome, label) in zip(axes, OUTCOME_LABELS.items()):
            est  = self.model.estimators_[OUTCOMES.index(outcome)]
            imp  = est.feature_importances_
            idx  = np.argsort(imp)
            labs = [FEATURE_LABELS[FEATURES[i]] for i in idx]
            vals = imp[idx]
            cols = [colors_map[FEATURES[i]] for i in idx]
            ax.barh(labs, vals, color=cols, alpha=0.85)
            ax.set_title(label, fontsize=11, fontweight='bold')
            ax.set_xlabel('Importance (Gini)')

        from matplotlib.patches import Patch
        fig.legend(handles=[
            Patch(color='#e74c3c', label='Screen Time'),
            Patch(color='#3498db', label='Other features'),
        ], loc='lower center', ncol=2, fontsize=9, bbox_to_anchor=(0.5, -0.02))

        plt.tight_layout()
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        plt.show()
        print(f"Saved → {save_path}")

    def plot_shap_summary(self, outcome='ADHD_CLINICAL',
                          save_path='visualizations/rf_shap_summary.png'):
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        sv_raw = self.explainer[outcome].shap_values(self.X_background)
        if isinstance(sv_raw, list):
            sv = np.array(sv_raw[1])
        elif sv_raw.ndim == 3:
            sv = sv_raw[:, :, -1]
        else:
            sv = np.array(sv_raw)
        if sv.ndim == 1:
            sv = sv.reshape(1, -1)

        plt.figure(figsize=(9, 5))
        shap.summary_plot(
            sv, self.X_background,
            feature_names=[FEATURE_LABELS[f] for f in FEATURES],
            plot_type='dot',   
            show=False,
        )
        plt.title(f'SHAP Values — {OUTCOME_LABELS[outcome]} Risk\n'
                  f'(positive SHAP = increases risk)',
                  fontsize=12, fontweight='bold')
        plt.tight_layout()
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        plt.show()
        print(f"Saved → {save_path}")

    def plot_risk_by_screentime(
        self, age=14, physactiv=3, bedtime=2,
        fpl_group='200–399%', sex=1,
        save_path='visualizations/rf_risk_by_screentime.png'
    ):
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        st_vals = [1, 2, 3, 4, 5]
        results = {o: [] for o in OUTCOME_LABELS.values()}

        for st in st_vals:
            r = self.predict(st, age, physactiv, bedtime, fpl_group, sex)
            for o in OUTCOME_LABELS.values():
                results[o].append(r['risks'][o])

        fig, ax = plt.subplots(figsize=(9, 5))
        colors  = {'ADHD': '#e74c3c', 'Anxiety': '#3498db', 'Depression': '#2ecc71'}
        for outcome, color in colors.items():
            ax.plot([SCREENTIME_LABELS[s] for s in st_vals],
                    results[outcome], 'o-', color=color,
                    linewidth=2.5, markersize=6, label=outcome)

        ax.set_xlabel('Daily Screen Time', fontsize=11)
        ax.set_ylabel('Predicted Risk (%)', fontsize=11)
        ax.set_title(f'Predicted Risk by Screen Time  '
                     f'(age={age}, physactiv={physactiv} days/wk)',
                     fontsize=12, fontweight='bold')
        ax.legend(fontsize=10)
        ax.grid(True, alpha=0.3)
        plt.tight_layout()
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        plt.show()
        print(f"Saved → {save_path}")

    def plot_roc_curves(self, df: pd.DataFrame,
                        save_path='visualizations/rf_roc_curves.png'):
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        X, Y, _ = self._prepare(df)
        _, X_te, _, Y_te = train_test_split(X, Y, test_size=0.2, random_state=42)

        fig, axes = plt.subplots(1, 3, figsize=(15, 5))
        fig.suptitle('ROC Curves — Random Forest (20% holdout)',
                     fontsize=13, fontweight='bold')
        colors = ['#e74c3c', '#3498db', '#2ecc71']

        for ax, outcome, color in zip(axes, OUTCOMES, colors):
            prob = self.model.estimators_[OUTCOMES.index(outcome)]\
                       .predict_proba(X_te)[:, 1]
            auc  = roc_auc_score(Y_te[outcome], prob)
            RocCurveDisplay.from_predictions(
                Y_te[outcome], prob, ax=ax,
                name=f'AUC = {auc:.3f}', color=color
            )
            ax.plot([0, 1], [0, 1], 'k--', alpha=0.4)
            ax.set_title(OUTCOME_LABELS[outcome], fontsize=11, fontweight='bold')

        plt.tight_layout()
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        plt.show()
        print(f"Saved → {save_path}")

    def save(self, directory: str = 'models'):
        os.makedirs(directory, exist_ok=True)
        with open(os.path.join(directory, 'rf_model.pkl'), 'wb') as f:
            pickle.dump(self.model, f)
        with open(os.path.join(directory, 'calibrated_estimators.pkl'), 'wb') as f:
            pickle.dump(self.calibrated_estimators_, f)
        with open(os.path.join(directory, 'shap_explainers.pkl'), 'wb') as f:
            pickle.dump(self.explainer, f)
        # profiles are now rule-based — no file needed
        if self.eval_results:
            with open(os.path.join(directory, 'eval_results.json'), 'w') as f:
                json.dump(self.eval_results, f, indent=2)
        self.X_background.to_csv(
            os.path.join(directory, 'shap_background.csv'), index=False
        )
        print(f"Saved to {directory}/")

    @classmethod
    def load(cls, directory: str = 'models') -> 'AttentionReceipt':
        instance = cls()
        with open(os.path.join(directory, 'rf_model.pkl'), 'rb') as f:
            instance.model = pickle.load(f)
        cal_path = os.path.join(directory, 'calibrated_estimators.pkl')
        if os.path.exists(cal_path):
            with open(cal_path, 'rb') as f:
                instance.calibrated_estimators_ = pickle.load(f)
        with open(os.path.join(directory, 'shap_explainers.pkl'), 'rb') as f:
            instance.explainer = pickle.load(f)
        # profiles are rule-based — nothing to load
        instance.X_background = pd.read_csv(
            os.path.join(directory, 'shap_background.csv')
        )
        instance.is_fitted = True
        print(f"Loaded from {directory}/")
        return instance


if __name__ == '__main__':
    from supabase import create_client
    from dotenv import load_dotenv

    load_dotenv()
    supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))

    def fetch_all_rows(supabase, table_name):
        all_data, offset, batch_size = [], 0, 1000
        while True:
            response = supabase.table(table_name)\
                .select("SCREENTIME, SC_AGE_YEARS, SC_SEX, FPL_GROUP, "
                        "PHYSACTIV, BEDTIME, FWC, "
                        "K2Q31A, K2Q31C, K2Q33A, K2Q32A")\
                .range(offset, offset + batch_size - 1)\
                .execute()
            batch = response.data
            if not batch:
                break
            all_data.extend(batch)
            offset += batch_size
            print(f"  Fetched {len(all_data):,} rows...", end='\r')
            if len(batch) < batch_size:
                break
        print()
        return pd.DataFrame(all_data)

    print("Fetching data...")
    df = fetch_all_rows(supabase, 'nsch_data')

    receipt = AttentionReceipt(n_estimators=300, max_depth=8)
    receipt.fit(df, eval=True)
    receipt.save('models')

    os.makedirs('visualizations', exist_ok=True)
    receipt.plot_feature_importance()
    receipt.plot_shap_summary(outcome='ADHD_CLINICAL')
    receipt.plot_shap_summary(outcome='ANXIETY',
                              save_path='visualizations/rf_shap_anxiety.png')
    receipt.plot_shap_summary(outcome='DEPRESSION',
                              save_path='visualizations/rf_shap_depression.png')
    receipt.plot_risk_by_screentime(age=14, physactiv=2)
    receipt.plot_roc_curves(df)

    print("\n" + "="*70)
    print("TEST PREDICTIONS  (age=14, physactiv=2 days/wk, female, mid income)")
    print("="*70)
    print(f"  {'Screen Time':<12} {'ADHD':>8} {'Anxiety':>10} "
          f"{'Depression':>12}  {'Cluster':<28}  Top Driver")
    print("  " + "-"*85)
    for st in [1, 2, 3, 4, 5]:
        r = receipt.predict(screentime=st, age=14, physactiv=2,
                            fpl_group='200–399%', sex=2)
        print(f"  {SCREENTIME_LABELS[st]:<12} "
              f"{r['risks']['ADHD']:>7.1f}% "
              f"{r['risks']['Anxiety']:>9.1f}% "
              f"{r['risks']['Depression']:>11.1f}%  "
              f"{r['cluster']['label']:<28}  {r['top_driver']}")

    print("\nSample receipt:")
    print("-"*50)
    r = receipt.predict(screentime=4, age=14, physactiv=2,
                        fpl_group='200–399%', sex=2)
    print(r['summary'])