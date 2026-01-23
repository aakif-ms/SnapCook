import os 
import chromadb
from chromadb.utils import embedding_functions
from dotenv import load_dotenv

load_dotenv()

DB_DIR = os.path.join(os.path.dirname(__file__), "../../chroma_db")
client = chromadb.PersistentClient(path=DB_DIR)

openai_ef = embedding_functions.OpenAIEmbeddingFunction(
    model_name="text-embedding-3-small"
)

collection = client.get_or_create_collection(
    name="recipes",
    embedding_function=openai_ef,
    metadata={"hnsw:space": "cosine"}
)

def add_recipes_batch(ids, documents, metadatas):
    collection.add(
        ids=ids,
        documents=documents,
        metadatas=metadatas
    )
    
def search_recipes(query_text, n_results=5):
    results = collection.query(
        query_texts=[query_text],
        n_results=n_results
    )
    
    cleaned_results = []
    for i in range(len(results['ids'][0])):
        item = {
            "id": results["ids"][0][i],
            "score": results["distances"][0][i],
            "ingredients": results["documents"][0][i],
            "title": results["metadatas"][0][i]["title"],
            "minutes": results["metadatas"][0][i]["minutes"]
        }
        cleaned_results.append(item)
    
    return cleaned_results

def get_recipe_by_id(recipe_id):
    result = collection.get(ids=[recipe_id])
    if result["metadatas"]:
        return result["metadatas"][0]
    return None