from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from fetch_data import get_dexes_for_chain

app = FastAPI()

# Apply CORS to allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request model
class DexRequest(BaseModel):
    chain: str = "eth"
    top_k: int = 3

@app.post("/get-dexes")
async def get_dexes(request: DexRequest):
    dex_data = await get_dexes_for_chain(request.chain)
    return dex_data

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)