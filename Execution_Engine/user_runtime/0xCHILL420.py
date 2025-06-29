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

# Initialize Redis connection
REDIS_HOST = "localhost"
REDIS_PORT = 6379
CHANNEL_NAME = "dex_live_data"

def extract_numeric_fields(data):
    '''
    Extracts and formats numeric fields from DexScreener API response.
    Expected input structure:
    {
        'priceNative': float,    # Price in native token units
        'priceUsd': float,       # Price in USD
        'volume': {              # Trading volume in USD
            'h24': float,        # 24-hour volume
            'h6': float,         # 6-hour volume
            'h1': float,         # 1-hour volume
            'm5': float          # 5-minute volume
        },
        'priceChange': {         # Percentage price changes
            'm5': float,         # 5-minute change
            'h1': float,         # 1-hour change
            'h6': float,         # 6-hour change
            'h24': float         # 24-hour change
        },
        'liquidity': {          # Pool liquidity details
            'usd': float,       # Total liquidity in USD
            'base': float,       # Base token amount
            'quote': float       # Quote token amount
        },
        'fdv': float,           # Fully Diluted Valuation
        'marketCap': float       # Market Capitalization
    }
    '''
    if not data:
        return {}
    
    return {
        "priceNative": float(data.get("priceNative", 0)),
        "priceUsd": float(data.get("priceUsd", 0)),
        "volume": data.get("volume", {}),
        "priceChange": data.get("priceChange", {}),
        "liquidity": data.get("liquidity", {}),
        "fdv": float(data.get("fdv", 0)),
        "marketCap": float(data.get("marketCap", 0))
   }

# RSI Calculation Function
def calculate_rsi(prices):
    """Calculate Relative Strength Index (RSI) for given price data"""
    delta = np.diff(prices)
    gain, loss = np.copy(delta), np.copy(delta)
    gain[gain < 0] = 0
    loss[loss > 0] = 0
    avg_gain = np.mean(gain[-14:])
    avg_loss = abs(np.mean(loss[-14:]))
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

# Initialize Redis connection
r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
pubsub = r.pubsub()
pubsub.subscribe(CHANNEL_NAME)

# Wait for subscription confirmation
while True:
    msg = pubsub.get_message()
    if msg and msg['type'] == 'subscribe':
        print(f"✅ Successfully subscribed to {CHANNEL_NAME}")
        break
    time.sleep(0.1)

# Initialize RSI tracking
rsi_prices = []

# Main listening loop
for message in pubsub.listen():
    if message['type'] == 'message':
        try:
            parsed_data = json.loads(message['data'])
            numeric = extract_numeric_fields(parsed_data)
            print("🔄 [Live Feed]:", numeric)

            # Store price for RSI calculation
            if numeric.get("priceUsd"):
                rsi_prices.append(float(numeric["priceUsd"]))
                if len(rsi_prices) > 14:
                    rsi_prices = rsi_prices[-14:]
            
            if len(rsi_prices) >= 14:
                current_rsi = calculate_rsi(rsi_prices)
                
                # Medium-risk strategy logic
                if current_rsi < 30 and numeric["volume"]["h24"] > 100000:
                    decision = "buy"
                elif current_rsi > 70 and numeric["volume"]["h24"] > 100000:
                    decision = "sell"
                else:
                    decision = random.choice(["buy", "sell"]) if random.random() < 0.2 else None
            else:
                decision = None

            if decision:
                print("📊 Decision:", decision)

                # POST decision to server
                response = requests.post("http://localhost:8000/decide", json={
                    "wallet_address": "0xCHILL420",
                    "decision": decision
                })

                if response.status_code == 200:
                    print("✅ Decision posted successfully.")
                else:
                    print("⚠️ Failed to post decision:", response.status_code)

                # Add random delay for confirmation
                time.sleep(random.randint(60, 300))

        except Exception as e:
            print("❌ Error processing message:", e)