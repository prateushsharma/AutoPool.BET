import time
import json
import redis
import requests
import random

# Core Libraries
import numpy as np
import pandas as pd

# Technical Analysis
import ta

# Market Data
import yfinance as yf
import ccxt

# Utilities
from dotenv import load_dotenv
import pytz
from dateutil import parser

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

# Initialize variables for trading logic
price_history = []
last_price = 0
last_decision = None

# Main listening loop
for message in pubsub.listen():
    if message['type'] == 'message':
        try:
            parsed_data = json.loads(message['data'])
            numeric = extract_numeric_fields(parsed_data)
            print("🔄 [Live Feed]:", numeric)

            # Extract current price
            current_price = numeric.get("priceUsd", 0)
            
            if current_price <= 0:
                decision = "sell"
                print("📊 Decision:", decision)
                continue

            # Update price history
            price_history.append(current_price)
            if len(price_history) > 100:
                price_history.pop(0)
            
            # Calculate average price for the last 100 periods
            if len(price_history) == 100:
                avg_price = sum(price_history) / len(price_history)
                
                # Check if current price is above average by at least 1%
                if current_price > avg_price * 1.01:
                    decision = "buy"
                else:
                    # Check if price has dropped 0.5% from last price
                    price_change = ((current_price - last_price) / last_price) * 100
                    if price_change <= -0.5:
                        decision = "sell"
                    else:
                        decision = "sell"  # Default to sell if conditions not met

                # Update last price and decision
                last_price = current_price
                last_decision = decision

            else:
                decision = "sell"  # Default decision while gathering data

            print("📊 Decision:", decision)

            # POST decision to server
            response = requests.post("http://localhost:8000/decide", json={
                "wallet_address": "0xOLDGOLD",
                "decision": decision
            })

            if response.status_code == 200:
                print("✅ Decision posted successfully.")
            else:
                print("⚠️ Failed to post decision:", response.status_code)

        except Exception as e:
            print("❌ Error processing message:", e)