from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel  
from typing import List, Optional
import uuid
import shutil
import os


from app.models import AnalysisResponse, RecipeCard
from app.services.vision import analyze_image_for_ingredients
from app.services.vector_store import search_recipes, get_recipe_by_id
from app.graph import run_agent


app = FastAPI(title="SnapCook API")

origins = [
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Thread-ID"],  # This allows frontend to access custom headers
)

UPLOAD_DIR = "static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def read_root():
    return {"message": "SnapCook API is running"}

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_food(file: Optional[UploadFile] = File(None),
                       text_input: Optional[str] = Form(None)):
    
    detected_ingredients = []
    
    if file:
        print(f"Processing image: {file.filename}")

        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        with open(file_path, "rb") as image_data:
            vision_ingredients = analyze_image_for_ingredients(image_data)
            detected_ingredients.extend(vision_ingredients)
    
    if text_input:
        print(f"Processing Text: {text_input}")
        manual_ingredients = [i.strip() for i in text_input.split(',')]
        detected_ingredients.extend(manual_ingredients)

    if not detected_ingredients:
        raise HTTPException(status_code=400, detail="Please provide an image or text ingredients.")

    final_ingredients = list(set(detected_ingredients))
    search_query = ", ".join(final_ingredients)
    print(f"🔍 Searching ChromaDB for: {search_query}")
    
    results = search_recipes(search_query, n_results=5)
    
    recipe_cards = []
    for r in results:
        recipe_cards.append(RecipeCard(
            id=r['id'],
            title=r['title'],
            description=r['description'],
            minutes=r['minutes'],
            match_score=r['score']
        ))

    return AnalysisResponse(
        detected_ingredients=final_ingredients,
        recipes=recipe_cards
    )
    
class StartCookingRequest(BaseModel):
    recipe_id: str

class ChatRequest(BaseModel):
    message: str
    thread_id: str
    
@app.post("/api/start_cooking")
async def start_cooking(request: StartCookingRequest):
    recipe_data = get_recipe_by_id(request.recipe_id)
    if not recipe_data:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    context = f"Title: {recipe_data['title']}\nInstructions: {recipe_data['instructions']}"
    
    thread_id = str(uuid.uuid4())
    
    return StreamingResponse(
        run_agent(thread_id, "Please introduce this recipe and help me get started.", context),
        media_type="text/event-stream",
        headers={"X-Thread-ID": thread_id} 
    )
    
@app.post("/api/chat")
async def chat(request: ChatRequest):
    return StreamingResponse(
        run_agent(request.thread_id, request.message),
        media_type="text/event-stream"
    )