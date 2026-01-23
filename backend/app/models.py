from pydantic import BaseModel
from typing import List, Optional

class RecipeCard(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    minutes: int
    match_score: float
    
class AnalysisResponse(BaseModel):
    detected_ingredients: List[str]
    recipes: List[RecipeCard]