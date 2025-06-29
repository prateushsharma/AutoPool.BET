from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import aiosqlite
import json
import time
import random
import asyncio
import datetime
from data_fetch.get_boosted_tokens import get_tokens
from betting_pool.query_classifier import classify_token_query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()


timer_active = False

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class QueryRequest(BaseModel):
    query: str

class BulkUserRequest(BaseModel):
    names: list[str]
    wallet_addresses: list[str]

class DecisionRequest(BaseModel):
    wallet_address: str
    action: str  # "buy", "sell", or "stop"

# Global Variables
timer_task = None

# Utility Functions
def get_random_price():
    """Random token price between $0.01 and $100.00"""
    return round(random.uniform(0.01, 100.0), 4)

# Database Functions
async def initialize_trading_db():
    """Initialize trading database tables (only if they don't exist)"""
    os.makedirs("database", exist_ok=True)
    trading_db_path = os.path.join("database", "trading.db")
    
    async with aiosqlite.connect(trading_db_path) as db:
        # Trading positions table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS trading_positions (
                wallet_address TEXT PRIMARY KEY CHECK(length(wallet_address) <= 255),
                starting_investment REAL NOT NULL DEFAULT 0,
                current_investment REAL NOT NULL DEFAULT 0,
                current_tokens REAL NOT NULL DEFAULT 0,
                buy_sell_calls INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Pool settings table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS pool_settings (
                id INTEGER PRIMARY KEY CHECK(id = 1),
                is_over BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Liquidation results table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS liquidation_results (
                wallet_address TEXT PRIMARY KEY,
                starting_investment REAL NOT NULL,
                final_investment REAL NOT NULL,
                tokens_liquidated REAL NOT NULL,
                liquidation_value REAL NOT NULL,
                profit_loss REAL NOT NULL,
                profit_loss_percentage REAL NOT NULL,
                liquidation_price REAL NOT NULL,
                liquidated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Insert default pool settings
        await db.execute("""
            INSERT OR IGNORE INTO pool_settings (id, is_over) VALUES (1, FALSE)
        """)
        
        await db.commit()

async def initialize_leaderboard_db():
    """Initialize leaderboard database for current session results"""
    os.makedirs("database", exist_ok=True)
    leaderboard_db_path = os.path.join("database", "leaderboard.db")
    
    async with aiosqlite.connect(leaderboard_db_path) as db:
        # Create current leaderboard table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS current_leaderboard (
                wallet_address TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                starting_investment REAL NOT NULL,
                final_investment REAL NOT NULL,
                tokens_liquidated REAL NOT NULL,
                liquidation_value REAL NOT NULL,
                profit_loss REAL NOT NULL,
                profit_loss_percentage REAL NOT NULL,
                liquidation_price REAL NOT NULL,
                rank_position INTEGER,
                liquidated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                session_id TEXT NOT NULL
            )
        """)
        await db.commit()

async def reset_trading_db():
    """Complete reset of trading database"""
    os.makedirs("database", exist_ok=True)
    trading_db_path = os.path.join("database", "trading.db")
    
    async with aiosqlite.connect(trading_db_path) as db:
        await db.execute("DROP TABLE IF EXISTS trading_positions")
        await db.execute("DROP TABLE IF EXISTS pool_settings")
        await db.execute("DROP TABLE IF EXISTS liquidation_results")
        await db.commit()
    
    await initialize_trading_db()

async def get_pool_status():
    """Get global pool status"""
    try:
        trading_db_path = os.path.join("database", "trading.db")
        async with aiosqlite.connect(trading_db_path) as db:
            cursor = await db.execute("SELECT is_over FROM pool_settings WHERE id = 1")
            result = await cursor.fetchone()
            return result[0] if result else False
    except:
        return False

async def set_pool_status(is_over: bool):
    """Set global pool status"""
    try:
        trading_db_path = os.path.join("database", "trading.db")
        async with aiosqlite.connect(trading_db_path) as db:
            await db.execute("""
                UPDATE pool_settings 
                SET is_over = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = 1
            """, (is_over,))
            await db.commit()
    except:
        pass

async def update_leaderboard(liquidation_summary, session_id, current_price):
    """Update leaderboard with latest session results"""
    try:
        await initialize_leaderboard_db()
        leaderboard_db_path = os.path.join("database", "leaderboard.db")
        users_db_path = os.path.join("database", "users.db")
        
        async with aiosqlite.connect(leaderboard_db_path) as lb_db:
            # Clear previous leaderboard data
            await lb_db.execute("DELETE FROM current_leaderboard")
            
            # Get user names from users database
            user_names = {}
            if os.path.exists(users_db_path):
                async with aiosqlite.connect(users_db_path) as user_db:
                    cursor = await user_db.execute("SELECT wallet_address, name FROM users")
                    users_data = await cursor.fetchall()
                    user_names = {wallet: name for wallet, name in users_data}
            
            # Sort liquidation summary by profit_loss_percentage (descending)
            sorted_results = sorted(liquidation_summary, 
                                  key=lambda x: x["profit_loss_percentage"], 
                                  reverse=True)
            
            # Insert new leaderboard data with rankings
            for rank, result in enumerate(sorted_results, 1):
                wallet_address = result["wallet_address"]
                user_name = user_names.get(wallet_address, f"User_{wallet_address[:8]}")
                
                await lb_db.execute("""
                    INSERT INTO current_leaderboard 
                    (wallet_address, name, starting_investment, final_investment, 
                     tokens_liquidated, liquidation_value, profit_loss, 
                     profit_loss_percentage, liquidation_price, rank_position, session_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    wallet_address,
                    user_name,
                    1000.0,  # starting_investment (always 1000)
                    result["final_investment"],
                    result["tokens_liquidated"],
                    result["liquidation_value"],
                    result["profit_loss"],
                    result["profit_loss_percentage"],
                    current_price,
                    rank,
                    session_id
                ))
            
            await lb_db.commit()
            print(f"📊 Leaderboard updated with {len(sorted_results)} participants")
            
    except Exception as e:
        print(f"❌ Error updating leaderboard: {str(e)}")

# Timer Functions
async def auto_stop_pool():
    """Auto-stop pool after 10 minutes"""
    global timer_active
    timer_active = True 
    print("🕐 Timer started: Pool will auto-stop in 10 minutes...")
    await asyncio.sleep(600)  # 10 minutes
    
    try:
        trading_db_path = os.path.join("database", "trading.db")
        
        if os.path.exists(trading_db_path):
            async with aiosqlite.connect(trading_db_path) as db:
                cursor = await db.execute("SELECT wallet_address FROM trading_positions LIMIT 1")
                result = await cursor.fetchone()
                
                if result:
                    wallet_address = result[0]
                    print(f"⏰ 10 minutes elapsed! Auto-stopping pool using wallet: {wallet_address}")
                    await process_stop_decision(wallet_address)
                else:
                    print("⚠️ No trading positions found to trigger auto-stop")
        else:
            print("⚠️ Trading database not found for auto-stop")
            
    except Exception as e:
        print(f"❌ Error in auto-stop: {str(e)}")

    finally:
        timer_active = False  # Set to False when timer ends

async def process_stop_decision(wallet_address: str):
    """Process auto-stop decision - liquidates ALL users"""
    global timer_active
    try:
        await initialize_trading_db()
        trading_db_path = os.path.join("database", "trading.db")
        
        async with aiosqlite.connect(trading_db_path) as db:
            await db.execute("PRAGMA journal_mode=WAL")
            
            # Get ALL user positions
            cursor = await db.execute("SELECT * FROM trading_positions")
            all_positions = await cursor.fetchall()
            
            if not all_positions:
                print("⚠️ No trading positions found for auto-stop")
                return
            
            # Clear previous liquidation results
            await db.execute("DELETE FROM liquidation_results")
            
            # Get current token price
            current_price = get_random_price()
            liquidation_summary = []
            
            print(f"⏰ 10-MINUTE TIMER EXPIRED!")
            print(f"🛑 AUTO-LIQUIDATING ALL USERS")
            print(f"💰 Liquidation price: ${current_price:.4f}")
            print(f"👥 Processing {len(all_positions)} users...")
            print("=" * 60)
            
            # Liquidate ALL users
            for position in all_positions:
                (wallet_addr, starting_investment, current_investment_from_db, current_tokens_from_db, 
                 buy_sell_calls_from_db, created_at, updated_at) = position
                
                current_investment = float(current_investment_from_db) if current_investment_from_db is not None else 0.0
                current_tokens = float(current_tokens_from_db) if current_tokens_from_db is not None else 0.0
                
                # Liquidate tokens
                if current_tokens > 0:
                    liquidation_amount = current_tokens * current_price
                    final_investment = current_investment + liquidation_amount
                    tokens_liquidated = current_tokens
                else:
                    liquidation_amount = 0
                    final_investment = current_investment
                    tokens_liquidated = 0
                
                # Calculate profit/loss
                profit_loss = final_investment - starting_investment
                profit_loss_percentage = (profit_loss / starting_investment) * 100 if starting_investment > 0 else 0
                
                # Store in liquidation_results table
                await db.execute("""
                    INSERT INTO liquidation_results 
                    (wallet_address, starting_investment, final_investment, tokens_liquidated, 
                     liquidation_value, profit_loss, profit_loss_percentage, liquidation_price)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (wallet_addr, starting_investment, final_investment, tokens_liquidated,
                      liquidation_amount, profit_loss, profit_loss_percentage, current_price))
                
                liquidation_summary.append({
                    "wallet_address": wallet_addr,
                    "tokens_liquidated": tokens_liquidated,
                    "liquidation_value": liquidation_amount,
                    "final_investment": final_investment,
                    "profit_loss": profit_loss,
                    "profit_loss_percentage": profit_loss_percentage
                })
                
                # Print individual summary
                status_icon = "📈" if profit_loss >= 0 else "📉"
                print(f"{status_icon} {wallet_addr[:10]}...")
                print(f"   Tokens liquidated: {tokens_liquidated:.4f} → ${liquidation_amount:.2f}")
                print(f"   Final amount: ${final_investment:.2f}")
                print(f"   P&L: ${profit_loss:.2f} ({profit_loss_percentage:.2f}%)")
                print("-" * 40)
            
            # Clear trading positions
            await db.execute("DELETE FROM trading_positions")
            
            # Set pool to closed
            await db.execute("""
                UPDATE pool_settings 
                SET is_over = TRUE, updated_at = CURRENT_TIMESTAMP 
                WHERE id = 1
            """)
            await db.commit()
            
            # Generate session ID and update leaderboard
            session_id = f"session_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"
            await update_leaderboard(liquidation_summary, session_id, current_price)
            
            # Print final summary
            total_liquidation = sum(item["liquidation_value"] for item in liquidation_summary)
            avg_profit_loss = sum(item["profit_loss_percentage"] for item in liquidation_summary) / len(liquidation_summary)
            winners = len([item for item in liquidation_summary if item["profit_loss"] >= 0])
            losers = len(liquidation_summary) - winners
            
            print("=" * 60)
            print(f"🏁 SESSION ENDED - FINAL RESULTS:")
            print(f"   👥 Total users liquidated: {len(liquidation_summary)}")
            print(f"   💰 Total liquidation value: ${total_liquidation:.2f}")
            print(f"   📊 Average P&L: {avg_profit_loss:.2f}%")
            print(f"   🏆 Winners: {winners} | 💸 Losers: {losers}")
            print(f"   💾 Results stored in liquidation_results table")
            print(f"   📊 Leaderboard updated with session: {session_id}")
            print(f"   🔒 POOL LOCKED - Waiting for new users to restart")
            print("=" * 60)
                
        timer_active = False
    except Exception as e:
        timer_active = False
        print(f"❌ Error in process_stop_decision: {str(e)}")

# API Endpoints
@app.post("/find_boosted_tokens")
async def find_boosted_tokens(request: QueryRequest):
    """Process natural language query for token investment"""
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

    # Get trending token
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
    """Initialize legacy pool database"""
    os.makedirs("database", exist_ok=True)
    db_path = os.path.join("database", "pool.db")

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

    # Store pool start time
    start_time_path = os.path.join("database", "pool_start_time.txt")
    with open(start_time_path, "w") as f:
        f.write(str(time.time()))

    return {
        "message": "Async database and table initialized successfully.",
        "start_time_path": start_time_path
    }

@app.post("/all_users")
async def add_users(request: BulkUserRequest):
    """
    WORKFLOW: Reset pool → Add users → Start timer → Open trading
    """
    global timer_task, timer_active
    
    # Validate input
    if len(request.names) != len(request.wallet_addresses):
        raise HTTPException(
            status_code=400, 
            detail=f"Mismatch: {len(request.names)} names but {len(request.wallet_addresses)} wallet addresses. Lists must have equal length."
        )
    
    if len(request.names) == 0:
        raise HTTPException(status_code=400, detail="Empty lists provided. At least one user required.")
    
    print("🔄 STARTING NEW TRADING SESSION...")
    
    # STEP 1: Reset pool
    print("1️⃣ Resetting trading pool...")
    if timer_task is not None:
        timer_task.cancel()
        timer_task = None
        print("   ⏹️ Previous timer cancelled")
    
    await reset_trading_db()
    print("   🗑️ All trading data cleared")
    
    # STEP 2: Add users
    print("2️⃣ Adding users...")
    os.makedirs("database", exist_ok=True)
    users_db_path = os.path.join("database", "users.db")
    
    try:
        async with aiosqlite.connect(users_db_path) as db:
            # Reset users table
            await db.execute("DROP TABLE IF EXISTS users")
            await db.execute("""
                CREATE TABLE users (
                    wallet_address TEXT PRIMARY KEY CHECK(length(wallet_address) <= 255),
                    name TEXT NOT NULL CHECK(length(name) <= 100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            results = []
            created_count = 0
            error_count = 0
            
            # Process each user
            for i, (name, wallet_address) in enumerate(zip(request.names, request.wallet_addresses)):
                try:
                    if not name or not name.strip():
                        results.append({
                            "index": i,
                            "name": name,
                            "wallet_address": wallet_address,
                            "status": "error",
                            "message": "Name cannot be empty"
                        })
                        error_count += 1
                        continue
                    
                    if not wallet_address or not wallet_address.strip():
                        results.append({
                            "index": i,
                            "name": name,
                            "wallet_address": wallet_address,
                            "status": "error",
                            "message": "Wallet address cannot be empty"
                        })
                        error_count += 1
                        continue
                    
                    # Insert user
                    await db.execute("""
                        INSERT INTO users (wallet_address, name) 
                        VALUES (?, ?)
                    """, (wallet_address.strip(), name.strip()))
                    
                    created_count += 1
                    results.append({
                        "index": i,
                        "name": name.strip(),
                        "wallet_address": wallet_address.strip(),
                        "status": "success",
                        "action": "created"
                    })
                    
                except Exception as e:
                    results.append({
                        "index": i,
                        "name": name,
                        "wallet_address": wallet_address,
                        "status": "error",
                        "message": str(e)
                    })
                    error_count += 1
            
            await db.commit()
            print(f"   👥 {created_count} users added successfully")
            
            # STEP 3: Start timer
            if created_count > 0:
                print("3️⃣ Starting 10-minute trading session...")
                timer_task = asyncio.create_task(auto_stop_pool())
                timer_active = True
                print("   ⏰ Timer started - Auto-liquidation in 10 minutes")
                
                # STEP 4: Open pool
                print("4️⃣ Opening pool for trading...")
                await set_pool_status(False)
                print("   🟢 Pool is now ACTIVE - Users can start trading!")
                
                print("=" * 50)
                print("🚀 NEW TRADING SESSION STARTED!")
                print(f"   👥 Participants: {created_count}")
                print(f"   ⏱️ Duration: 10 minutes")
                print(f"   💰 Starting balance: $1000 each")
                print("=" * 50)
            
            return {
                "message": f"NEW TRADING SESSION STARTED! {created_count} users added, 10-minute timer started, pool opened for trading",
                "session_info": {
                    "users_added": created_count,
                    "session_duration_minutes": 10,
                    "starting_balance_per_user": 1000.00,
                    "pool_status": "ACTIVE",
                    "timer_started": True
                },
                "summary": {
                    "total_processed": len(request.names),
                    "created": created_count,
                    "updated": 0,
                    "errors": error_count
                },
                "workflow_completed": {
                    "step_1_pool_reset": True,
                    "step_2_users_added": created_count > 0,
                    "step_3_timer_started": created_count > 0,
                    "step_4_pool_opened": created_count > 0
                },
                "results": results
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/all_users")
async def get_all_users():
    """Get all users from database"""
    users_db_path = os.path.join("database", "users.db")
    
    if not os.path.exists(users_db_path):
        return {
            "users": [],
            "total_count": 0,
            "message": "No users database found. Add some users first."
        }
    
    try:
        async with aiosqlite.connect(users_db_path) as db:
            cursor = await db.execute("""
                SELECT wallet_address, name, created_at, updated_at 
                FROM users 
                ORDER BY created_at DESC
            """)
            rows = await cursor.fetchall()
            
            users = []
            for row in rows:
                users.append({
                    "wallet_address": row[0],
                    "name": row[1],
                    "created_at": row[2],
                    "updated_at": row[3]
                })
            
            return {
                "users": users,
                "total_count": len(users),
                "message": f"Retrieved {len(users)} users successfully!"
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/decision")
async def make_trading_decision(request: DecisionRequest):
    """Execute trading decisions: buy, sell, or stop"""
    # Validate action
    if request.action.lower() not in ["buy", "sell", "stop"]:
        raise HTTPException(status_code=400, detail="Action must be 'buy', 'sell', or 'stop'")
    
    await initialize_trading_db()
    trading_db_path = os.path.join("database", "trading.db")
    action = request.action.lower()
    
    try:
        async with aiosqlite.connect(trading_db_path) as db:
            await db.execute("PRAGMA journal_mode=WAL")
            
            # Get or create user position
            cursor = await db.execute(
                "SELECT * FROM trading_positions WHERE wallet_address = ?",
                (request.wallet_address,)
            )
            existing_position = await cursor.fetchone()
            
            if not existing_position:
                # Create new position
                starting_amount = 1000.0
                await db.execute("""
                    INSERT INTO trading_positions 
                    (wallet_address, starting_investment, current_investment, current_tokens, buy_sell_calls)
                    VALUES (?, ?, ?, ?, ?)
                """, (request.wallet_address, starting_amount, starting_amount, 0.0, 0))
                await db.commit()
                
                cursor = await db.execute(
                    "SELECT * FROM trading_positions WHERE wallet_address = ?",
                    (request.wallet_address,)
                )
                existing_position = await cursor.fetchone()
                is_first_trade = True
            else:
                is_first_trade = False
            
            # Unpack position data
            (wallet_address, starting_investment, current_investment_from_db, current_tokens_from_db, 
             buy_sell_calls_from_db, created_at, updated_at) = existing_position
            
            current_investment = float(current_investment_from_db) if current_investment_from_db is not None else 0.0
            current_tokens = float(current_tokens_from_db) if current_tokens_from_db is not None else 0.0
            buy_sell_calls = int(buy_sell_calls_from_db) if buy_sell_calls_from_db is not None else 0
            
            # Check pool status
            pool_cursor = await db.execute("SELECT is_over FROM pool_settings WHERE id = 1")
            pool_result = await pool_cursor.fetchone()
            pool_is_over = pool_result[0] if pool_result else False
            
            if pool_is_over:
                return {
                    "message": "Trading pool is closed. No further actions allowed for any users.",
                    "wallet_address": request.wallet_address,
                    "action": action,
                    "status": "rejected",
                    "pool_status": "closed"
                }
            
            # Store original values
            original_investment = current_investment
            original_tokens = current_tokens
            original_trade_count = buy_sell_calls
            current_price = get_random_price()
            
            if action == "buy":
                if current_investment <= 0:
                    return {
                        "message": f"Insufficient funds: No investment available for buying tokens. Current balance: ${current_investment:.2f}",
                        "wallet_address": request.wallet_address,
                        "action": action,
                        "status": "failed",
                        "current_investment": current_investment,
                        "required_minimum": 0.01,
                        "is_first_trade": is_first_trade
                    }
                
                buy_percentage = random.uniform(0.1, 0.5)
                buy_amount = current_investment * buy_percentage
                
                if buy_amount < 0.01:
                    return {
                        "message": f"Insufficient funds: Available ${current_investment:.2f}, but minimum buy amount is $0.01",
                        "wallet_address": request.wallet_address,
                        "action": action,
                        "status": "failed",
                        "current_investment": current_investment,
                        "attempted_buy_amount": buy_amount,
                        "required_minimum": 0.01,
                        "is_first_trade": is_first_trade
                    }
                
                tokens_purchased = buy_amount / current_price
                new_current_investment = current_investment - buy_amount
                new_current_tokens = current_tokens + tokens_purchased
                new_buy_sell_calls = buy_sell_calls + 1
                
                await db.execute("""
                    UPDATE trading_positions 
                    SET current_investment = ?, current_tokens = ?, buy_sell_calls = ?, 
                        updated_at = CURRENT_TIMESTAMP
                    WHERE wallet_address = ?
                """, (new_current_investment, new_current_tokens, new_buy_sell_calls, request.wallet_address))
                await db.commit()
                
                result_message = f"Buy order executed: ${buy_amount:.2f} spent from available ${current_investment:.2f}, {tokens_purchased:.4f} tokens purchased at ${current_price:.4f}"
                
            elif action == "sell":
                if current_tokens <= 0:
                    return {
                        "message": "No tokens available: Cannot sell when token balance is zero",
                        "wallet_address": request.wallet_address,
                        "action": action,
                        "status": "failed",
                        "current_tokens": current_tokens,
                        "current_investment": current_investment,
                        "is_first_trade": is_first_trade
                    }
                
                sell_percentage = random.uniform(0.1, 0.5)
                tokens_to_sell = current_tokens * sell_percentage
                
                if tokens_to_sell < 0.0001:
                    return {
                        "message": f"Insufficient tokens: Have {current_tokens:.6f} tokens, but minimum sell amount is 0.0001",
                        "wallet_address": request.wallet_address,
                        "action": action,
                        "status": "failed",
                        "current_tokens": current_tokens,
                        "attempted_sell_tokens": tokens_to_sell,
                        "required_minimum": 0.0001,
                        "is_first_trade": is_first_trade
                    }
                
                sell_amount = tokens_to_sell * current_price
                
                if sell_amount < 0.01:
                    return {
                        "message": f"Sell amount too small: {tokens_to_sell:.6f} tokens worth only ${sell_amount:.6f} at current price ${current_price:.4f}",
                        "wallet_address": request.wallet_address,
                        "action": action,
                        "status": "failed",
                        "tokens_to_sell": tokens_to_sell,
                        "sell_amount": sell_amount,
                        "token_price": current_price,
                        "is_first_trade": is_first_trade
                    }
                
                new_current_tokens = current_tokens - tokens_to_sell
                new_current_investment = current_investment + sell_amount
                new_buy_sell_calls = buy_sell_calls + 1
                
                await db.execute("""
                    UPDATE trading_positions 
                    SET current_investment = ?, current_tokens = ?, buy_sell_calls = ?, 
                        updated_at = CURRENT_TIMESTAMP
                    WHERE wallet_address = ?
                """, (new_current_investment, new_current_tokens, new_buy_sell_calls, request.wallet_address))
                await db.commit()
                
                result_message = f"Sell order executed: {tokens_to_sell:.4f} tokens sold for ${sell_amount:.2f} at ${current_price:.4f}. New cash balance: ${new_current_investment:.2f}"
                
            elif action == "stop":
                # Get ALL positions for liquidation
                cursor = await db.execute("SELECT * FROM trading_positions")
                all_positions = await cursor.fetchall()
                
                liquidation_summary = []
                total_liquidation_value = 0
                
                # Liquidate ALL users
                for position in all_positions:
                    (pos_wallet, pos_starting, pos_current_inv, pos_current_tokens, 
                     pos_calls, pos_created, pos_updated) = position
                    
                    pos_investment = float(pos_current_inv) if pos_current_inv is not None else 0.0
                    pos_tokens = float(pos_current_tokens) if pos_current_tokens is not None else 0.0
                    
                    if pos_tokens > 0:
                        pos_liquidation = pos_tokens * current_price
                        pos_final = pos_investment + pos_liquidation
                        total_liquidation_value += pos_liquidation
                    else:
                        pos_liquidation = 0
                        pos_final = pos_investment
                    
                    await db.execute("""
                        UPDATE trading_positions 
                        SET current_investment = ?, current_tokens = 0, updated_at = CURRENT_TIMESTAMP
                        WHERE wallet_address = ?
                    """, (pos_final, pos_wallet))
                    
                    pos_profit_loss = pos_final - pos_starting
                    pos_profit_percentage = (pos_profit_loss / pos_starting) * 100 if pos_starting > 0 else 0
                    
                    liquidation_summary.append({
                        "wallet_address": pos_wallet,
                        "tokens_liquidated": pos_tokens,
                        "liquidation_value": pos_liquidation,
                        "final_investment": pos_final,
                        "profit_loss": pos_profit_loss,
                        "profit_loss_percentage": pos_profit_percentage
                    })
                
                # Set pool to closed
                await db.execute("""
                    UPDATE pool_settings 
                    SET is_over = TRUE, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = 1
                """)
                
                # Cancel timer
                global timer_task
                if timer_task is not None:
                    timer_task.cancel()
                    timer_task = None
                
                # Generate session ID and update leaderboard
                session_id = f"session_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"
                await update_leaderboard(liquidation_summary, session_id, current_price)
                
                # Get triggering user's final details
                triggering_user = next((item for item in liquidation_summary if item["wallet_address"] == request.wallet_address), None)
                
                if triggering_user:
                    user_final = triggering_user["final_investment"]
                    user_profit_loss = triggering_user["profit_loss"]
                    user_profit_percentage = triggering_user["profit_loss_percentage"]
                else:
                    user_final = current_investment
                    user_profit_loss = 0
                    user_profit_percentage = 0
                
                winners = len([item for item in liquidation_summary if item["profit_loss"] >= 0])
                losers = len(liquidation_summary) - winners
                
                result_message = (
                    f"POOL CLOSED! All {len(liquidation_summary)} users liquidated. "
                    f"Total liquidation: ${total_liquidation_value:.2f}. "
                    f"Winners: {winners}, Losers: {losers}. "
                    f"Your final: ${user_final:.2f} (P&L: ${user_profit_loss:.2f}, {user_profit_percentage:.2f}%)"
                )
            
            # Get updated position for response
            cursor = await db.execute(
                "SELECT * FROM trading_positions WHERE wallet_address = ?",
                (request.wallet_address,)
            )
            updated_position = await cursor.fetchone()
            
            # Get current pool status
            pool_cursor = await db.execute("SELECT is_over FROM pool_settings WHERE id = 1")
            pool_result = await pool_cursor.fetchone()
            pool_status = pool_result[0] if pool_result else False
            
            return {
                "message": result_message,
                "wallet_address": request.wallet_address,
                "action": action,
                "status": "success",
                "token_price": current_price,
                "pool_status": "closed" if pool_status else "active",
                "is_first_trade": is_first_trade,
                "position": {
                    "starting_investment": updated_position[1],
                    "current_investment": updated_position[2],
                    "current_tokens": updated_position[3],
                    "buy_sell_calls": updated_position[4]
                },
                "debug_info": {
                    "database_path": trading_db_path,
                    "database_exists": os.path.exists(trading_db_path),
                    "previous_investment": original_investment,
                    "previous_tokens": original_tokens,
                    "trade_number": original_trade_count + 1,
                    "wallet_address": request.wallet_address
                }
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/all_positions")
async def get_all_positions():
    """Get all user trading positions with profit/loss calculations"""
    try:
        os.makedirs("database", exist_ok=True)
        trading_db_path = os.path.join("database", "trading.db")
        
        if not os.path.exists(trading_db_path):
            return {
                "positions": [],
                "total_users": 0,
                "pool_status": "not_initialized",
                "message": "No trading database found"
            }
        
        async with aiosqlite.connect(trading_db_path) as db:
            # Check if table exists
            cursor = await db.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='trading_positions'
            """)
            table_exists = await cursor.fetchone()
            
            if not table_exists:
                return {
                    "positions": [],
                    "total_users": 0,
                    "pool_status": "not_initialized",
                    "message": "Trading positions table does not exist"
                }
            
            # Get all positions
            cursor = await db.execute("""
                SELECT wallet_address, starting_investment, current_investment, 
                       current_tokens, buy_sell_calls, created_at, updated_at
                FROM trading_positions 
                ORDER BY created_at DESC
            """)
            rows = await cursor.fetchall()
            
            positions = []
            for row in rows:
                current_cash = row[2]
                current_token_count = row[3]
                starting_investment = row[1]
                
                # Calculate token value
                current_price = get_random_price()
                token_value = current_token_count * current_price
                total_current_value = current_cash + token_value
                
                profit_loss = total_current_value - starting_investment
                profit_loss_percentage = (profit_loss / starting_investment * 100) if starting_investment > 0 else 0
                
                positions.append({
                    "wallet_address": row[0],
                    "starting_investment": row[1],
                    "current_investment": row[2],
                    "current_tokens": row[3],
                    "buy_sell_calls": row[4],
                    "created_at": row[5],
                    "updated_at": row[6],
                    "current_token_value": token_value,
                    "total_current_value": total_current_value,
                    "profit_loss": profit_loss,
                    "profit_loss_percentage": round(profit_loss_percentage, 2)
                })
            
            # Get pool status
            try:
                pool_status = await get_pool_status()
                pool_status_text = "closed" if pool_status else "active"
            except:
                pool_status_text = "unknown"
            
            return {
                "positions": positions,
                "total_users": len(positions),
                "pool_status": pool_status_text,
                "message": f"Found {len(positions)} trading positions"
            }
            
    except Exception as e:
        return {
            "positions": [],
            "total_users": 0,
            "pool_status": "error",
            "message": f"Database error: {str(e)}"
        }

@app.get("/db")
async def get_database_info():
    """Get database information in table format"""
    try:
        trading_db_path = os.path.join("database", "trading.db")
        
        if not os.path.exists(trading_db_path):
            return {
                "database_exists": False,
                "database_path": trading_db_path,
                "message": "Trading database does not exist",
                "tables": {}
            }
        
        async with aiosqlite.connect(trading_db_path) as db:
            result = {
                "database_exists": True,
                "database_path": trading_db_path,
                "tables": {}
            }
            
            # Get trading_positions table (current session)
            try:
                cursor = await db.execute("""
                    SELECT wallet_address, starting_investment, current_investment, 
                           current_tokens, buy_sell_calls, created_at, updated_at
                    FROM trading_positions 
                    ORDER BY created_at DESC
                """)
                trading_rows = await cursor.fetchall()
                
                result["tables"]["trading_positions"] = {
                    "title": "Current Trading Session (Active)",
                    "headers": [
                        "Wallet Address", 
                        "Starting Investment", 
                        "Current Investment", 
                        "Current Tokens", 
                        "Buy/Sell Calls", 
                        "Created At", 
                        "Updated At"
                    ],
                    "rows": [
                        [
                            row[0][:10] + "..." if len(row[0]) > 13 else row[0],
                            f"${row[1]:.2f}" if row[1] is not None else "N/A",
                            f"${row[2]:.2f}" if row[2] is not None else "N/A", 
                            f"{row[3]:.4f}" if row[3] is not None else "0.0000",
                            str(row[4]) if row[4] is not None else "0",
                            row[5][:19] if row[5] else "N/A",
                            row[6][:19] if row[6] else "N/A"
                        ] for row in trading_rows
                    ],
                    "total_rows": len(trading_rows)
                }
            except Exception as e:
                result["tables"]["trading_positions"] = {
                    "title": "Current Trading Session",
                    "error": f"Could not read trading_positions: {str(e)}",
                    "headers": [],
                    "rows": [],
                    "total_rows": 0
                }
            
            # Get liquidation_results table (previous session)
            try:
                cursor = await db.execute("""
                    SELECT wallet_address, starting_investment, final_investment, 
                           tokens_liquidated, liquidation_value, profit_loss, 
                           profit_loss_percentage, liquidation_price, liquidated_at
                    FROM liquidation_results 
                    ORDER BY liquidated_at DESC
                """)
                liquidation_rows = await cursor.fetchall()
                
                result["tables"]["liquidation_results"] = {
                    "title": "Previous Session Results (Final)",
                    "headers": [
                        "Wallet Address",
                        "Starting Inv.",
                        "Final Inv.", 
                        "Tokens Liquidated",
                        "Liquidation Value",
                        "Profit/Loss",
                        "P&L %",
                        "Liquidation Price",
                        "Liquidated At"
                    ],
                    "rows": [
                        [
                            row[0][:10] + "..." if len(row[0]) > 13 else row[0],
                            f"${row[1]:.2f}" if row[1] is not None else "N/A",
                            f"${row[2]:.2f}" if row[2] is not None else "N/A",
                            f"{row[3]:.4f}" if row[3] is not None else "0.0000",
                            f"${row[4]:.2f}" if row[4] is not None else "N/A",
                            f"${row[5]:.2f}" if row[5] is not None else "N/A",
                            f"{row[6]:.2f}%" if row[6] is not None else "N/A",
                            f"${row[7]:.4f}" if row[7] is not None else "N/A",
                            row[8][:19] if row[8] else "N/A"
                        ] for row in liquidation_rows
                    ],
                    "total_rows": len(liquidation_rows)
                }
            except Exception as e:
                result["tables"]["liquidation_results"] = {
                    "title": "Previous Session Results",
                    "error": f"Could not read liquidation_results: {str(e)}",
                    "headers": [],
                    "rows": [],
                    "total_rows": 0
                }
            
            # Get pool_settings table
            try:
                cursor = await db.execute("""
                    SELECT id, is_over, created_at, updated_at
                    FROM pool_settings 
                    ORDER BY id
                """)
                pool_rows = await cursor.fetchall()
                
                result["tables"]["pool_settings"] = {
                    "title": "Pool Status",
                    "headers": [
                        "ID", 
                        "Pool Status", 
                        "Created At", 
                        "Updated At"
                    ],
                    "rows": [
                        [
                            str(row[0]),
                            "LOCKED" if row[1] else "ACTIVE",
                            row[2][:19] if row[2] else "N/A",
                            row[3][:19] if row[3] else "N/A"
                        ] for row in pool_rows
                    ],
                    "total_rows": len(pool_rows)
                }
            except Exception as e:
                result["tables"]["pool_settings"] = {
                    "title": "Pool Status",
                    "error": f"Could not read pool_settings: {str(e)}",
                    "headers": [],
                    "rows": [],
                    "total_rows": 0
                }
            
            # Get summary statistics
            try:
                cursor = await db.execute("SELECT COUNT(*) FROM trading_positions")
                positions_count = (await cursor.fetchone())[0]
                
                cursor = await db.execute("SELECT COUNT(*) FROM liquidation_results")
                liquidation_count = (await cursor.fetchone())[0]
                
                cursor = await db.execute("SELECT COUNT(*) FROM pool_settings")
                settings_count = (await cursor.fetchone())[0]
                
                result["summary"] = {
                    "current_active_traders": positions_count,
                    "previous_session_results": liquidation_count,
                    "pool_settings_records": settings_count,
                    "database_size_mb": round(os.path.getsize(trading_db_path) / (1024 * 1024), 2)
                }
            except Exception as e:
                result["summary"] = {
                    "error": f"Could not get summary: {str(e)}"
                }
            
            return result
            
    except Exception as e:
        return {
            "database_exists": False,
            "error": str(e),
            "message": "Error reading database",
            "tables": {}
        }

@app.get("/pool_status")
async def check_pool_status():
    """Check if the trading pool is active or closed"""
    try:
        await initialize_trading_db()
        pool_is_over = await get_pool_status()
        
        return {
            "pool_status": "closed" if pool_is_over else "active",
            "message": "Pool is closed - no trading allowed" if pool_is_over else "Pool is active - trading allowed"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/reset_pool")
async def reset_pool():
    """DANGER: Complete reset - deletes ALL data and reopens pool"""
    global timer_task, timer_active
    
    try:
        # Cancel timer
        if timer_task is not None:
            timer_task.cancel()
            timer_task = None
            timer_active = False
            print("🛑 Auto-stop timer cancelled due to pool reset")
        
        await initialize_trading_db()
        return {
            "message": "⚠️ COMPLETE RESET: All user positions and history deleted. Pool reopened.",
            "pool_status": "active",
            "warning": "All trading data has been permanently lost",
            "timer_info": {
                "timer_cancelled": True,
                "message": "Previous auto-stop timer was cancelled"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/reopen_pool")
async def reopen_pool():
    """Reopen the pool without losing user data"""
    global timer_task, timer_active
    
    try:
        await initialize_trading_db()
        await set_pool_status(False)
        
        # Cancel timer
        if timer_task is not None:
            timer_task.cancel()
            timer_task = None
            timer_active = False
            print("🛑 Auto-stop timer cancelled due to manual pool reopen")
        
        return {
            "message": "Pool reopened successfully. All user positions preserved.",
            "pool_status": "active",
            "note": "Users can resume trading with their existing positions",
            "timer_info": {
                "timer_cancelled": True,
                "message": "Auto-stop timer was cancelled due to manual reopen"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/leaderboard")
async def get_current_leaderboard():
    """
    Get current session leaderboard with rankings
    """
    try:
        leaderboard_db_path = os.path.join("database", "leaderboard.db")
        
        if not os.path.exists(leaderboard_db_path):
            return {
                "leaderboard": [],
                "total_participants": 0,
                "session_info": {
                    "session_id": None,
                    "liquidated_at": None
                },
                "message": "No leaderboard data found. Complete a trading session first."
            }
        
        async with aiosqlite.connect(leaderboard_db_path) as db:
            # Get leaderboard data ordered by rank
            cursor = await db.execute("""
                SELECT wallet_address, name, starting_investment, final_investment,
                       tokens_liquidated, liquidation_value, profit_loss, 
                       profit_loss_percentage, liquidation_price, rank_position,
                       liquidated_at, session_id
                FROM current_leaderboard 
                ORDER BY rank_position ASC
            """)
            rows = await cursor.fetchall()
            
            if not rows:
                return {
                    "leaderboard": [],
                    "total_participants": 0,
                    "session_info": {
                        "session_id": None,
                        "liquidated_at": None
                    },
                    "message": "No leaderboard data available"
                }
            
            leaderboard = []
            for row in rows:
                # Determine medal/status
                rank = row[9]
                if rank == 1:
                    medal = "🥇"
                    status = "WINNER"
                elif rank == 2:
                    medal = "🥈"
                    status = "RUNNER-UP"
                elif rank == 3:
                    medal = "🥉"
                    status = "THIRD PLACE"
                else:
                    medal = f"#{rank}"
                    status = "PARTICIPANT"
                
                # Determine profit/loss indicator
                pnl_indicator = "📈" if row[6] >= 0 else "📉"
                
                leaderboard.append({
                    "rank": rank,
                    "medal": medal,
                    "status": status,
                    "wallet_address": row[0],
                    "name": row[1],
                    "starting_investment": row[2],
                    "final_investment": row[3],
                    "tokens_liquidated": row[4],
                    "liquidation_value": row[5],
                    "profit_loss": row[6],
                    "profit_loss_percentage": row[7],
                    "liquidation_price": row[8],
                    "pnl_indicator": pnl_indicator,
                    "liquidated_at": row[10]
                })
            
            # Get session info from first row
            session_info = {
                "session_id": rows[0][11],
                "liquidated_at": rows[0][10],
                "total_participants": len(rows),
                "liquidation_price": rows[0][8]
            }
            
            # Calculate statistics
            total_profit_loss = sum(participant["profit_loss"] for participant in leaderboard)
            avg_profit_loss = total_profit_loss / len(leaderboard) if leaderboard else 0
            winners = len([p for p in leaderboard if p["profit_loss"] >= 0])
            losers = len(leaderboard) - winners
            best_performer = leaderboard[0] if leaderboard else None
            worst_performer = leaderboard[-1] if leaderboard else None
            
            return {
                "leaderboard": leaderboard,
                "total_participants": len(leaderboard),
                "session_info": session_info,
                "statistics": {
                    "total_profit_loss": round(total_profit_loss, 2),
                    "average_profit_loss": round(avg_profit_loss, 2),
                    "average_profit_loss_percentage": round(avg_profit_loss / 1000 * 100, 2) if avg_profit_loss else 0,
                    "winners": winners,
                    "losers": losers,
                    "best_performer": {
                        "name": best_performer["name"] if best_performer else None,
                        "profit_percentage": best_performer["profit_loss_percentage"] if best_performer else None
                    },
                    "worst_performer": {
                        "name": worst_performer["name"] if worst_performer else None,
                        "profit_percentage": worst_performer["profit_loss_percentage"] if worst_performer else None
                    }
                },
                "message": f"Leaderboard for {session_info['session_id']} with {len(leaderboard)} participants"
            }
            
    except Exception as e:
        return {
            "leaderboard": [],
            "total_participants": 0,
            "session_info": {
                "session_id": None,
                "liquidated_at": None
            },
            "error": str(e),
            "message": "Error retrieving leaderboard data"
        }

@app.get("/leaderboard/summary")
async def get_leaderboard_summary():
    """
    Get condensed leaderboard summary with top 3 and key stats
    """
    try:
        leaderboard_data = await get_current_leaderboard()
        
        if not leaderboard_data["leaderboard"]:
            return {
                "top_3": [],
                "statistics": {},
                "message": "No leaderboard data available"
            }
        
        leaderboard = leaderboard_data["leaderboard"]
        
        # Get top 3
        top_3 = leaderboard[:3]
        
        # Simplified stats
        stats = leaderboard_data["statistics"]
        
        return {
            "top_3": [
                {
                    "rank": p["rank"],
                    "medal": p["medal"],
                    "name": p["name"],
                    "wallet_address": p["wallet_address"][:10] + "...",
                    "profit_loss_percentage": p["profit_loss_percentage"],
                    "final_investment": p["final_investment"],
                    "pnl_indicator": p["pnl_indicator"]
                } for p in top_3
            ],
            "statistics": {
                "total_participants": leaderboard_data["total_participants"],
                "average_profit_loss_percentage": stats["average_profit_loss_percentage"],
                "winners": stats["winners"],
                "losers": stats["losers"]
            },
            "session_info": {
                "session_id": leaderboard_data["session_info"]["session_id"],
                "liquidated_at": leaderboard_data["session_info"]["liquidated_at"]
            },
            "message": f"Top 3 performers from latest session"
        }
        
    except Exception as e:
        return {
            "top_3": [],
            "statistics": {},
            "error": str(e),
            "message": "Error retrieving leaderboard summary"
        }

@app.get("/heartbeat")
async def heartbeat():
    """
    Returns timer status without any parameters
    Returns True when timer is active, False when timer is not active
    """
    global timer_active
    return timer_active


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)