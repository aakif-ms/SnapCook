from fastapi import FastAPI

app = FastAPI(title="SnapCook")

@app.get("/health")
def check():
    return {"status": "ok"}