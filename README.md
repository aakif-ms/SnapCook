# 🍳 SnapCook

SnapCook is an AI-powered recipe discovery application that helps you find recipes based on the ingredients you have. Simply snap a photo of your ingredients or type them in, and let SnapCook find the perfect recipe for you!

## ✨ Features

- 📸 **Image Recognition**: Upload photos of ingredients and let AI identify them automatically
- 🔍 **Smart Recipe Search**: Find recipes using semantic similarity matching with vector embeddings  
- 🤖 **AI Cooking Assistant**: Get step-by-step cooking guidance from an intelligent chatbot
- ⚡ **Fast & Accurate**: Powered by OpenAI's GPT-4 Vision and embeddings for precise results
- 📱 **Modern UI**: Clean, responsive interface built with Next.js and TailwindCSS

## Demo Video
https://github.com/user-attachments/assets/69783d5e-ba1c-432f-8a4c-861b0d7aae41

## 🏗️ Architecture

SnapCook consists of three main components:

### Frontend (Next.js)
- Modern React application with TailwindCSS styling
- Image upload and ingredient input interface
- Recipe cards with cooking time and match scores
- Interactive cooking assistant chat

### Backend (FastAPI)
- RESTful API built with Python FastAPI
- OpenAI GPT-4 Vision for ingredient detection
- ChromaDB vector database for recipe similarity search
- LangChain-powered cooking assistant agent

### Data Layer
- ChromaDB vector database with OpenAI embeddings
- Recipe dataset with over 230k recipes
- Automated data ingestion and processing pipeline

## 🚀 Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/snapcook.git
   cd snapcook
   ```

2. **Set up the backend**
   ```bash
   cd backend
   pip install -e .
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file in backend directory
   echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
   ```

4. **Ingest recipe data** (first time only)
   ```bash
   cd backend
   python scripts/ingest.py
   ```

5. **Start the backend server**
   ```bash
   cd backend
   uvicorn app.main:app --reload --port 8000
   ```

6. **Set up the frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

7. **Open the application**
   Visit `http://localhost:3000` in your browser

## 📖 Usage

### Finding Recipes by Image
1. Click "Upload Image" and select a photo of your ingredients
2. SnapCook will automatically detect the ingredients using AI
3. Browse through the recommended recipes
4. Click "Start Cooking" for guided assistance

### Finding Recipes by Text
1. Type your available ingredients in the text input
2. Separate multiple ingredients with commas
3. Get instant recipe recommendations
4. Start cooking with AI guidance

### Cooking Assistant
- Once you start a recipe, the AI assistant will guide you through each step
- Ask questions about techniques, substitutions, or modifications
- Get real-time help tailored to your specific recipe

## 🛠️ API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analyze` | POST | Analyze image/text for ingredients and get recipe recommendations |
| `/api/start_cooking` | POST | Start cooking session with AI assistant |
| `/api/chat` | POST | Send message to cooking assistant |

## 📊 Data

The application uses a curated dataset of recipes with the following features:
- Recipe titles and descriptions
- Cooking instructions
- Preparation time
- Ingredient lists
- Nutritional information

Data is processed and stored in ChromaDB with OpenAI embeddings for semantic search.

## 🧪 Development

### Backend Development
```bash
cd backend
# Install in development mode
pip install -e .

# Run with auto-reload
uvicorn app.main:app --reload --port 8000
```

### Frontend Development
```bash
cd frontend
# Install dependencies
npm install

# Start development server
npm run dev
```

### Data Processing
```bash
cd backend
# Clean raw recipe data
python scripts/clean_data.py

# Ingest into vector database
python scripts/ingest.py
```

## 🔧 Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **ChromaDB**: Vector database for similarity search
- **OpenAI**: GPT-4 Vision and text embeddings
- **LangChain**: AI agent framework
- **Pydantic**: Data validation and serialization
- **Uvicorn**: ASGI server

### Frontend
- **Next.js**: React framework with file-based routing
- **TailwindCSS**: Utility-first CSS framework
- **Radix UI**: Accessible component library
- **Lucide React**: Beautiful icon library
- **Axios**: HTTP client for API calls

### Data
- **ChromaDB**: Vector storage and similarity search
- **OpenAI Embeddings**: text-embedding-3-small
- **Pandas**: Data processing and manipulation

## 📂 Project Structure

```
SnapCook/
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI app and routes
│   │   ├── models.py       # Pydantic models
│   │   ├── graph.py        # LangChain agent
│   │   └── services/
│   │       ├── vision.py   # Image analysis
│   │       └── vector_store.py  # ChromaDB operations
│   ├── data/               # Recipe datasets
│   ├── scripts/            # Data processing scripts
│   └── pyproject.toml      # Python dependencies
├── frontend/               # Next.js React frontend
│   ├── app/                # Next.js app router
│   ├── components/         # Reusable UI components
│   ├── lib/                # Utility functions
│   └── public/             # Static assets
└── README.md
```


## 🙏 Acknowledgments

- OpenAI for providing the vision and language models
- ChromaDB team for the excellent vector database
- Recipe dataset contributors
- Next.js and FastAPI communities
