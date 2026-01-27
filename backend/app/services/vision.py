import base64
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def encode_image(image_files):
    return base64.b64encode(image_files.read()).decode('utf-8')

def analyze_image_for_ingredients(image_file):
    base64_image = encode_image(image_file)
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a cooking assistant. Identify the main food ingredients in the image. Return ONLY a comma-separated list of ingredients (e.g. 'chicken, peppers, onion'). ignore any other thing other than food like kitchen utensils or any other background item that is not food."
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "What ingredients are in this image?"},
                    {
                        "type": "image_url",
                        "image_url" : {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
        ],
        max_tokens=300
    )
    
    content = response.choices[0].message.content
    
    ingredients = [i.strip() for i in content.split(",")]
    return ingredients