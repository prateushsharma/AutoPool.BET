import requests
from dotenv import load_dotenv
import os
import asyncio
import random

load_dotenv()
COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY")

async def get_dexes_for_chain(chain: str, top_k: int = 3) -> dict:
    expected = ["eth", "avax", "arbitrum"]
    if chain not in expected:
        return {"error": f"Invalid chain: {chain}. Must be one of {expected}"}

    """
    Fetches a random sample of DEXes on a given chain using CoinGecko's Onchain API.

    Parameters:
        chain (str): Chain name (e.g., 'eth', 'avax', 'arbitrum')
        top_k (int): Number of DEXes to randomly sample

    Returns:
        dict: Dictionary with a 'dexes' key containing a list of DEXes or an error
    """
    url = f"https://api.coingecko.com/api/v3/onchain/networks/{chain}/dexes"
    headers = {
        "accept": "application/json",
        "x-cg-demo-api-key": COINGECKO_API_KEY
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()

        # Make sure "data" is present and is a list
        if "data" not in data or not isinstance(data["data"], list):
            return {"error": "Unexpected response format"}

        dex_list = data["data"]
        sampled_dexes = random.sample(dex_list, min(top_k, len(dex_list)))

        return {"dexes": sampled_dexes}

    except requests.exceptions.RequestException as e:
        return {"error": str(e)}
