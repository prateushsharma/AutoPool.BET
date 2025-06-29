from groq import AsyncGroq
import asyncio
import json

async def create_code(strategy: str, wallet_address: str):
    client = AsyncGroq()  # Assumes your API key is set via environment or config

    code_prompt = f"""import time
import json
import redis
import requests
import random

REDIS_HOST = "localhost"
REDIS_PORT = 6379
CHANNEL_NAME = "dex_live_data"

def extract_numeric_fields(data):
    '''
    Extracts and formats numeric fields from DexScreener API response.
    Expected input structure:
    {{
        'priceNative': float,    # Price in native token units
        'priceUsd': float,       # Price in USD
        'volume': {{              # Trading volume in USD
            'h24': float,        # 24-hour volume
            'h6': float,         # 6-hour volume
            'h1': float,         # 1-hour volume
            'm5': float          # 5-minute volume
        }},
        'priceChange': {{         # Percentage price changes
            'm5': float,         # 5-minute change
            'h1': float,         # 1-hour change
            'h6': float,         # 6-hour change
            'h24': float         # 24-hour change
        }},
        'liquidity': {{          # Pool liquidity details
            'usd': float,       # Total liquidity in USD
            'base': float,       # Base token amount
            'quote': float       # Quote token amount
        }},
        'fdv': float,           # Fully Diluted Valuation
        'marketCap': float       # Market Capitalization
    }}
    '''
    if not data:
        return {{}}
    
    return {{
        "priceNative": float(data.get("priceNative", 0)),
        "priceUsd": float(data.get("priceUsd", 0)),
        "volume": data.get("volume", {{}}),
        "priceChange": data.get("priceChange", {{}}),
        "liquidity": data.get("liquidity", {{}}),
        "fdv": float(data.get("fdv", 0)),
        "marketCap": float(data.get("marketCap", 0))
    }}

# Initialize Redis connection
r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
pubsub = r.pubsub()
pubsub.subscribe(CHANNEL_NAME)

# Wait for subscription confirmation
while True:
    msg = pubsub.get_message()
    if msg and msg['type'] == 'subscribe':
        print(f"✅ Successfully subscribed to {{CHANNEL_NAME}}")
        break
    time.sleep(0.1)

# Main listening loop
for message in pubsub.listen():
    if message['type'] == 'message':
        try:
            parsed_data = json.loads(message['data'])
            numeric = extract_numeric_fields(parsed_data)
            print("🔄 [Live Feed]:", numeric)

            # Placeholder logic for decision
            ## Here YOU WILL ADD YOUR CODE AND THE FINAL DECISION WILL BE SET ON THE VARIABLE decision
            print("📊 Decision:", decision)

            # POST decision to server
            response = requests.post("http://localhost:8000/decide", json={{
                "wallet_address": "{wallet_address}",
                "decision": decision
            }})

            if response.status_code == 200:
                print("✅ Decision posted successfully.")
            else:
                print("⚠️ Failed to post decision:", response.status_code)

        except Exception as e:
            print("❌ Error processing message:", e)
"""

    user_prompt = f"""You are a Code Expert Agent specializing in algorithmic trading systems. You work exclusively with Python 3.13 and have the following imports available:

# Core Libraries
import requests
import redis
import json
import time
import random

# Data Handling
import numpy as np
import pandas as pd

# Technical Analysis
import ta

# Market Data (if needed)
import yfinance as yf
import ccxt

# Utilities
from dotenv import load_dotenv
import pytz
from dateutil import parser

RESTRICTIONS:
1. You CANNOT install or import any additional packages
2. You MUST use only the listed imports
3. Trading-related decisions must use only these approved packages
4. ALL code output MUST be enclosed within ```python and ``` tags
5. The code between tags MUST be directly executable in a .py file
6. Your decision will always be either buy or sell, you can use whatever technique you want, but you will not mess up anything that I have told you.
6. No pre-assumption that a function is already defined or not, you will always write the entire code
7. If I see a single code block used without definition (such as functions, classes, etc.) I will severely punish you!!

TASK REQUIREMENTS:
1. You will receive {strategy} containing trading logic specifications
2. You MUST maintain the core architecture from this code -> {code_prompt}:
   - Redis Pub/Sub data pipeline (localhost:6379, channel: dex_live_data)
   - FastAPI decision endpoint (http://localhost:8000/decide)
   - Wallet address parameter passing
3. You MAY ONLY modify the decision logic portion
4. Decisions must be strictly "buy" or "sell" strings
5. You have access to OHLCV data through extract_numeric_fields()

OUTPUT REQUIREMENTS:
1. Return COMPLETE executable Python code enclosed in ```python and ``` tags
2. The code between tags must:
   - Be directly copy-pasteable into a .py file
   - Contain no "thinking" or commentary
   - Include ALL required imports
   - Be fully functional
3. Preserve the original:
   - Data collection pipeline
   - API communication structure
   - Error handling framework
4. Clearly document your strategy logic IN CODE COMMENTS ONLY

STRATEGY IMPLEMENTATION RULES:
1. All logic must be contained within the code block
2. No external explanations inside the code tags
3. No logic and data flow change, only change the decision metric based on user's strategy
4. You have no restrictions on defining functions or anything, as they do not harm the data flow in any way."""

    response = await client.chat.completions.create(
        model="deepseek-r1-distill-llama-70b",
        messages=[
            {"role": "user", "content": user_prompt}
        ],
        reasoning_format="hidden"
    )

    final_response = response.choices[0].message.content
    print(final_response)
    return final_response