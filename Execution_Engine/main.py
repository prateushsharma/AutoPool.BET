import os
import time
import json
import threading
import subprocess
import requests
import redis
import re
from dotenv import load_dotenv
import signal
import psutil
import shutil
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from redis_docker_engine.setup_redis import setup_docker_redis_engine
from user_setup.codegen import create_code
from pydantic import BaseModel

REDIS_HOST = "localhost"
REDIS_PORT = 6379
CHANNEL_NAME = "dex_live_data"

load_dotenv()

# ---------- FastAPI App ----------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Globals ----------
redis_client = redis.Redis(host="localhost", port=6379, decode_responses=True)
stop_signal = threading.Event()
REDIS_KEY = "dex_live_data"
client_processes = {}  # {wallet_address: subprocess.Popen}

# ---------- Startup Hook ----------
@app.on_event("startup")
async def startup_event():
    print("[BOOT] 🔧 Setting up Docker Redis engine...")
    await setup_docker_redis_engine()
    print("[BOOT] 🚀 Initialising Pool")

    runtime_dir = "user_runtime"
    if os.path.exists(runtime_dir):
        shutil.rmtree(runtime_dir)
    os.makedirs(runtime_dir, exist_ok=True)

    os.makedirs("database", exist_ok=True)
    with open("database/client_list_data.txt", "w") as f:
        f.write("")
        f.close()

# ---------- Utilities ----------
def extract_numeric_fields(data):
    if not data:
        return {}
    entry = data[0]
    return {
        "priceNative": float(entry.get("priceNative", 0)),
        "priceUsd": float(entry.get("priceUsd", 0)),
        "volume": entry.get("volume", {}),
        "priceChange": entry.get("priceChange", {}),
        "liquidity": entry.get("liquidity", {}),
        "fdv": entry.get("fdv", 0),
        "marketCap": entry.get("marketCap", 0)
    }

async def start_publisher(chain_id: str, token_address: str, stop_event: threading.Event):
    def publisher():
        print("[Publisher] 🔄 Started")
        r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT)
        
        while not stop_event.is_set():
            try:
                url = f"https://api.dexscreener.com/token-pairs/v1/{chain_id}/{token_address}"
                response = requests.get(url, headers={"Accept": "*/*"})
                data = response.json()
                numeric = extract_numeric_fields(data)
                
                # Publish the data to the channel
                r.publish(CHANNEL_NAME, json.dumps(numeric))
                
            except Exception as e:
                print("[Publisher] ❌ Error:", e)
            time.sleep(1)
        
        print("[Publisher] 🔴 Stopped")
        r.close()

    threading.Thread(target=publisher, daemon=True).start()

# ---------- Request Schemas ----------
class StartRequest(BaseModel):
    chain_id: str
    token_address: str

class AddClientRequest(BaseModel):
    wallet_address: str
    strategy: str

import requests
import os
from typing import List, Dict, Union

async def send_client_list(chain_id, token_address) -> bool:
    """
    Reads client list from file and syncs with API endpoint in one operation.
    
    Returns:
        {
            'success': bool,       # Whether API sync succeeded
            'clients': List[str],  # List of wallet addresses found
            'message': str         # Status message
        }
    """
    # 1. Read client list
    file_path = os.path.join("database", "client_list_data.txt")
    clients = []
    
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            clients = [line.strip() for line in f if line.strip()]
    
    # 2. Prepare API request
    api_url = "http://localhost:8000/all_users"
    payload = {"clients": clients, "chain_id": chain_id, "token_address": token_address}
    print(payload)
    result = {
        'success': False,
        'clients': clients,
        'message': ''
    }
    
    # 3. Send to API
    try:
        response = requests.post(api_url, json=payload, timeout=5)
        response.raise_for_status()
        return True
    except requests.exceptions.RequestException as e:
        return False
    except Exception as e:
        return False

# ---------- Endpoints ----------
@app.post("/start")
async def start_pool(request: StartRequest):
    chain_id = request.chain_id
    token_address = request.token_address

    print("Starting up agents!")
    # 1. Define the three agent strategies
    agent_definitions = [
        {
            "name": "wolf_of_dexstreet",
            "strategy": "YOLO MODE ACTIVATED! Buy every dip like it's the last chance to get rich! Ignore all warnings, max leverage always, diamond hands through crashes. If there's 1% green, we're all in! 🚀🚀🚀",
            "wallet": "0xWOLF999"
        },
        {
            "name": "chill_surfer", 
            "strategy": "Hey bruh, let's ride some medium waves - no crazy risks but no boring stuff either. Take profits sometimes, cut losses when it feels bad. Good vibes only 🌊",
            "wallet": "0xCHILL420"
        },
        {
            "name": "grandpa_whale",
            "strategy": "Slow and steady... Must check price 100 times before trading. Only buy when everything is perfect (it never is). Panic sell if drops 0.5%. 'In my day we waited 10 years for gains!' 👴",
            "wallet": "0xOLDGOLD"
        }
    ]

    # 2. Initialize client list file
    os.makedirs("database", exist_ok=True)

    # 3. Create and register all agents
    for agent in agent_definitions:
        # Generate the agent's trading code
        code_str = await create_code(agent["strategy"], agent["wallet"])
        executable_code = await extract_code_from_response(code_str)
        with open("database/client_list_data.txt", "a") as f:
            f.write(f"{agent['wallet']}\n")
        # Save the agent's code
        agent_file = os.path.join("user_runtime", f"{agent['wallet']}.py")
        with open(agent_file, "w", encoding="utf-8") as f:
            f.write(executable_code)
        
        # Register agent in the system
        venv_python = os.path.join("venv", "Scripts", "python.exe") if os.name == "nt" else os.path.join("venv", "bin", "python")
        proc = subprocess.Popen([venv_python, agent_file])
        client_processes[agent["wallet"]] = proc
        
        print(f"🤖 [Agent Deployed] {agent['name']} ({agent['wallet']})")

    print("✅ All trading agents initialized and running")

    client_list = await send_client_list(chain_id, token_address)

    stop_signal.clear()
    await start_publisher(chain_id, token_address, stop_signal)

    return {
        "message": "Publisher started.",
        "chain_id": chain_id,
        "token_address": token_address
    }

async def extract_code_from_response(code_str: str) -> str:
    """
    Extracts Python code from markdown-style code blocks.
    Handles both ```python and ``` blocks.
    
    Args:
        code_str: String potentially containing code blocks
        
    Returns:
        str: Clean Python code ready for execution
    """
    # Pattern to match both ```python and ``` code blocks
    pattern = r'```(?:python)?(.*?)```'
    
    # Find all matches (including multiline with DOTALL flag)
    matches = re.findall(pattern, code_str, re.DOTALL)
    
    if matches:
        # Take the first match and strip whitespace
        extracted = matches[0].strip()
        return extracted
    else:
        # Return original string if no code blocks found
        return code_str.strip()

@app.post("/add_client")
async def add_client(request: AddClientRequest):
    wallet = request.wallet_address
    strategy = request.strategy

    os.makedirs("database", exist_ok=True)
    
    # Check if client_list_data.txt exists or not
    if not os.path.exists("database/client_list_data.txt"):
        # Create the file if it doesn't exist
        with open("database/client_list_data.txt", "w") as f:
            f.write("")

    # Adding the client's wallet address in the txt file
    with open("database/client_list_data.txt", "a") as f:
        f.write(wallet + "\n")

    # 1. Generate code string
    code_str = await create_code(strategy, wallet)
    code_str = await extract_code_from_response(code_str)
    # 2. Write code to user_runtime dir
    os.makedirs("user_runtime", exist_ok=True)
    file_path = os.path.join("user_runtime", f"{wallet}.py")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(code_str)

    # 3. Use virtual environment's Python interpreter
    venv_python = os.path.join("venv", "Scripts", "python.exe") if os.name == "nt" else os.path.join("venv", "bin", "python")
    
    if not os.path.exists(venv_python):
        raise RuntimeError("Virtual environment not found. Expected path: " + venv_python)

    proc = subprocess.Popen([venv_python, file_path])
    client_processes[wallet] = proc
    print(f"[Client] 🚀 Subprocess launched for {wallet}")

    return {
        "message": f"Client {wallet} added with strategy and process started.",
        "wallet_address": wallet
    }

@app.post("/stop")
async def stop_pool():
    """Stop all processes and clean up"""
    # 1. Stop the publisher
    stop_signal.set()
    print("[Stop] 🔴 Publisher stopped")

    # 2. Kill all client subprocesses
    for wallet, proc in client_processes.items():
        if proc.poll() is None:  # If still running
            proc.kill()
            print(f"[Stop] 💀 Killed client process for {wallet}")
    client_processes.clear()

    # 3. Kill all Python processes on port 9000 (except ourselves)
    current_pid = os.getpid()
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            if (proc.info['name'] == 'python.exe' or 
                'python' in proc.info['name'].lower()):
                # Check if this process is using port 9000
                for conn in proc.connections():
                    if conn.laddr.port == 9000 and proc.info['pid'] != current_pid:
                        print(f"[Stop] 🔫 Killing process {proc.info['pid']}")
                        os.kill(proc.info['pid'], signal.SIGTERM)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    return {"message": "All processes stopped and cleaned up"}

# ---------- Entrypoint ----------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", port=9000, host="0.0.0.0", reload=False)