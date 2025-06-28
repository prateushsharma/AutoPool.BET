import httpx
import asyncio
import json

async def get_tokens(requested_token: str | None):
    url = "https://api.dexscreener.com/token-boosts/top/v1"

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers={"Accept": "*/*"})
        data = response.json()

        # Correct way to save JSON
        with open("data.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=4)

        if not isinstance(data, list):
            return None  # Invalid structure
        
        # Case 1: if requested_token is None, return first Ethereum token
        if requested_token is None:
            for entry in data:
                if entry.get("chainId") == "ethereum" or entry.get("ChainId") == "avalanche":
                    return entry.get("tokenAddress")
            return None  # No Ethereum token found

        # Case 2: match requested_token with chainId
        for entry in data:
            if entry.get("chainId") == requested_token.lower():
                return entry.get("tokenAddress")

        return None  # No match found
