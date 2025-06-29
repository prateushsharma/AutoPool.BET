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
r = redis.Redis(host="localhost", port=6379, decode_responses=True)
pubsub = r.pubsub()
pubsub.subscribe("dex_live_data")

# Wait for subscription confirmation
while True:
    msg = pubsub.get_message()
    if msg and msg['type'] == 'subscribe':
        print(f"✅ Successfully subscribed to dex_live_data")
        break
    time.sleep(0.1)

def extract_numeric_fields(data):
    '''
    Extracts and formats numeric fields from DexScreener API response.
    Expected input structure:
    {
        'priceNative': float,    # Price in native token units
        'priceUsd': float,       # Price in USD
        'volume': {              # Trading volume in USD
            'h24': float,        # 24-hour volume
            'h6': float,        # 6-hour volume
            'h1': float,         # 1-hour volume
            'm5': float          # 5-minute volume
        },
        'priceChange': {         # Percentage price changes
            'm5': float,         # 5-minute change
            'h1': float,        # 1-hour change
            'h6': float,        # 6-hour change
            'h24': float         # 24-hour change
        },
        'liquidity': {          # Pool liquidity details
            'usd': float,       # Total liquidity in USD
            'base': float,      # Base token amount
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

def yolo_strategy(data):
    """
    YOLO strategy implementation:
    - Buy on any positive momentum signs
    - Sell on significant downward trends
    - Max leverage, diamond hands
    """
    # Get price changes for different timeframes
    m5_change = data.get('priceChange', {}).get('m5', 0)
    h1_change = data.get('priceChange', {}).get('h1', 0)
    h6_change = data.get('priceChange', {}).get('h6', 0)
    h24_change = data.get('priceChange', {}).get('h24', 0)
    
    # Aggressive buy conditions
    if m5_change > 0 or h1_change > 0:
        return "buy"
    
    # Sell conditions on longer term downtrends
    if h6_change < 0 and h24_change < 0:
        return "sell"
    
    # Default to buy if no clear trend
    return "buy"

# Main listening loop
for message in pubsub.listen():
    if message['type'] == 'message':
        try:
            parsed_data = json.loads(message['data'])
            numeric = extract_numeric_fields(parsed_data)
            print("🔄 [Live Feed]:", numeric)

            # YOLO strategy decision
            decision = yolo_strategy(numeric)
            print("📊 Decision:", decision)

            # POST decision to server
            response = requests.post("http://localhost:8000/decide", json={
                "wallet_address": "0xWOLF999",
                "decision": decision
            })

            if response.status_code == 200:
                print("✅ Decision posted successfully.")
            else:
                print("⚠️ Failed to post decision:", response.status_code)

        except Exception as e:
            print("❌ Error processing message:", e)