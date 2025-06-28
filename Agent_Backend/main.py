from fastapi import FastAPI
from pydantic import BaseModel
import os
import aiosqlite
import json
import time
from data_fetch.get_boosted_tokens import get_tokens
from betting_pool.query_classifier import classify_token_query
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

# Allow all origins (not recommended in production without restrictions)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

class QueryRequest(BaseModel):
    query: str

@app.post("/find_boosted_tokens")
async def find_boosted_tokens(request: QueryRequest):
    query = request.query

    pool_data = await classify_token_query(query)
    token_type = pool_data.get("token_type")
    investment_amount = pool_data.get("investment_amount")
    profit_percentage = pool_data.get("profit_percentage")

    print(token_type, investment_amount, profit_percentage)

    if investment_amount is None and profit_percentage is None:
        return {
            "token_address": None,
            "investment_amount": None,
            "profit_percentage": None,
            "message": "Both investment_amount and profit_percentage are missing from the query."
        }
    elif investment_amount is None:
        return {
            "token_address": None,
            "investment_amount": None,
            "profit_percentage": profit_percentage,
            "message": "investment_amount is missing from the query."
        }
    elif profit_percentage is None:
        return {
            "token_address": None,
            "investment_amount": investment_amount,
            "profit_percentage": None,
            "message": "profit_percentage is missing from the query."
        }

    # If all required fields are present
    trending_token = await get_tokens(token_type)

    result = {
        "token_address": trending_token,
        "investment_amount": investment_amount,
        "profit_percentage": profit_percentage,
        "message": "Betting Pool Successfully Created! Click START to Launch!"
    }

    # Save to file
    with open("betting_pool_data.json", "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=4)

    return result

@app.get("/start")
async def initialize_pool_database():
    # Ensure the "database" directory exists
    os.makedirs("database", exist_ok=True)

    # Define DB path
    db_path = os.path.join("database", "pool.db")

    # Step 1: Initialize the betting_pool table
    async with aiosqlite.connect(db_path) as db:
        await db.execute("DROP TABLE IF EXISTS betting_pool")
        await db.execute("""
            CREATE TABLE betting_pool (
                wallet_address TEXT NOT NULL CHECK(length(wallet_address) <= 255),
                current_amount REAL,
                original_amount REAL,
                score REAL,
                currency TEXT CHECK(currency IN ('liq', 'tkn'))
            )
        """)
        await db.commit()

    # Step 2: Store the pool start time
    start_time_path = os.path.join("database", "pool_start_time.txt")
    with open(start_time_path, "w") as f:
        f.write(str(time.time()))  # Store current UNIX timestamp

    return {
        "message": "Async database and table initialized successfully.",
        "start_time_path": start_time_path
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
