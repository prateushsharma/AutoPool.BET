from groq import AsyncGroq
import asyncio
import json

async def classify_token_query(query: str):
    client = AsyncGroq()  # Assumes your API key is set via environment or config

    user_prompt = f"""
You are a smart classification agent.

The user has made the following query:

```

{query}

````

Your job is to extract structured information from this query. You must return a JSON object in the following format:

```json
{{
    "token_type": "ethereum" | "arbitrum" | "avalanche" | "base" | null,
    "investment_amount": float | null,
    "profit_percentage": float | null
}}
````

Where:

* `"token_type"` is the blockchain network mentioned in the query (return `null` if ambiguous or not mentioned).
* `"investment_amount"` is the investment value mentioned in the query, in any currency (just extract the float, e.g., 100.0) or `null` if not mentioned.
* `"profit_percentage"` is the target profit percentage mentioned in the query (e.g., 20 means 20% profit) or `null` if not mentioned.

Do NOT return anything other than valid JSON in the given format.
"""

    response = await client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "user", "content": user_prompt}
        ],
        response_format={"type": "json_object"}
    )

    return json.loads(response.choices[0].message.content)