import pandas as pd
import ast

INPUT_FILE = "./data/RAW_recipes.csv"
OUTPUT_FILE = "./data/cleaned_recipes.csv"

def clean_text(text):
    try:
        items = ast.literal_eval(text)
        return "\n".join([f"{i+1}. {step.capitalize()}" for i, step in enumerate(items)])
    except:
        return text
    
def clean_ingredients_list(text):
    try:
        items = ast.literal_eval(text)
        return ", ".join(items)
    except:
        return text

def main():
    print("Loading RAW_recipes.csv... (This might take 10-20 seconds)")
    df = pd.read_csv(INPUT_FILE)

    keep_columns = ['id', 'name', 'description', 'ingredients', 'steps', 'minutes']
    df = df[keep_columns]

    df = df.rename(columns={'name': 'title'})

    print(f"Original Row Count: {len(df)}")
    
    df['n_ingredients'] = df['ingredients'].apply(lambda x: len(ast.literal_eval(x)))
    df['n_steps'] = df['steps'].apply(lambda x: len(ast.literal_eval(x)))
    
    df = df[ (df['n_ingredients'] >= 4) & (df['n_steps'] >= 3) ]
    print(f"Filtered Row Count: {len(df)}")

    print("Formatting text for the AI Agent...")
    df['formatted_steps'] = df['steps'].apply(clean_text)
    df['formatted_ingredients'] = df['ingredients'].apply(clean_ingredients_list)

    final_df = df[['id', 'title', 'description', 'formatted_ingredients', 'formatted_steps', 'minutes']]
    final_df.columns = ['id', 'title', 'description', 'ingredients', 'instructions', 'minutes']
    
    final_df.to_csv(OUTPUT_FILE, index=False)
    print(f"Success! Saved cleaned data to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()