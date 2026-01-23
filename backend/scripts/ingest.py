import sys
import os
import pandas as pd
import time

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.services.vector_store import add_recipes_batch

CSV_PATH = os.path.join(os.path.dirname(__file__), "../data/cleaned_recipes.csv")

def ingest_data():
    if not os.path.exists(CSV_PATH):
        print(f"Error: File not found at {CSV_PATH}")
        return 

    print(f"Reading CSV at {CSV_PATH}....")
    df = pd.read_csv(CSV_PATH)
    
    df = df.head(2000)

    total_recipes = len(df)
    batch_size = 100
    print(f"Starting ingestion of {total_recipes} recipes....")

    for i in range(0, total_recipes, batch_size):
        batch = df.iloc[i: i + batch_size]

        ids = [str(row["id"]) for _, row in batch.iterrows()]
        documents = [str(row["ingredients"]) for _, row in batch.iterrows()]
        
        metadatas = []
        for _, row in batch.iterrows():
            metadatas.append({
                "title": str(row["title"]),
                "minutes": int(row["minutes"]),
                "instructions": str(row["instructions"]),
                "description": str(row["description"])[:500]
            })
        
        try:
            add_recipes_batch(ids, documents, metadatas)
            print(f"Batch {i // batch_size + 1}: Added {len(ids)} recipes")
        except Exception as e:
            print(f"Error in batch {i}: {e}")
            time.sleep(1)
        
    print("Ingestion Successfully completed")

if __name__ == "__main__":
    ingest_data()