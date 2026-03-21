import os
import pandas as pd
import numpy as np
from supabase import create_client

# --- Supabase credentials ---
SUPABASE_URL = 
SUPABASE_KEY = 
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- Folder with CSVs ---
csv_folder = 

def clean_dataframe(df):

    # Clean column names
    df.columns = (
        df.columns
        .str.lower()
        .str.replace(" ", "_")
        .str.replace("(", "", regex=False)
        .str.replace(")", "", regex=False)
    )

    # Convert to numeric safely
    df = df.apply(pd.to_numeric, errors="coerce")

    # Replace inf and NaN
    df = df.replace([float("inf"), float("-inf")], -1)
    df = df.fillna(-1)

    # 🔥 ONLY convert columns that are actually whole numbers
    for col in df.columns:
        # if all values are whole numbers, convert to int
        if (df[col] % 1 == 0).all():
            df[col] = df[col].astype(int)

    return df





# -----------------------------
# Upload CSV to Supabase
# -----------------------------
def upload_csv_to_supabase(csv_path, table_name, chunk_size=500):
    print(f"\n📤 Uploading {os.path.basename(csv_path)} → {table_name}")

    df = pd.read_csv(csv_path, low_memory=False)
    df = clean_dataframe(df)

    records = df.to_dict(orient="records")

    for i in range(0, len(records), chunk_size):
        chunk = records[i:i + chunk_size]
        try:
            supabase.table(table_name).insert(chunk).execute()
            print(f"✅ Inserted rows {i}–{i + len(chunk) - 1}")
        except Exception as e:
            print(f"❌ Failed on rows {i}–{i + len(chunk) - 1}")
            print(e)
            raise

    print(f"🎉 Finished uploading {table_name}")


# -----------------------------
# Files + tables (update for each csv and table)
# -----------------------------
files_to_upload = {
    "screen_anxiety_raw.csv": "child_behavior_survey",
}

# -----------------------------
# Run uploads
# -----------------------------
for file, table in files_to_upload.items():
    csv_path = os.path.join(csv_folder, file)
    upload_csv_to_supabase(csv_path, table)
