import os
import subprocess
import time
import redis
import docker

# Paths
DOCKER_DIR = os.path.join(os.path.dirname(__file__), 'docker')
DOCKER_COMPOSE_FILE = os.path.join(DOCKER_DIR, 'docker-compose.yml')

REDIS_CONTAINER_NAME = "redis-server"
REDIS_PORT = 6379

async def setup_docker_redis_engine():
    client = docker.from_env()

    try:
        container = client.containers.get(REDIS_CONTAINER_NAME)
        if container.status != "running":
            print("        [FOUND BUT NOT RUNNING] 🚀 Redis container exists but is not running. Starting it...")
            container.start()
        else:
            print("        [FOUND AND RUNNING] ✅ Redis container is already running.")
    except docker.errors.NotFound:
        print("        [NOT FOUND]📦 Redis container not found. Building and starting using docker-compose...")

        subprocess.run([
            'docker-compose',
            '-f', DOCKER_COMPOSE_FILE,
            'up', '-d', '--build'
        ], check=True, cwd=DOCKER_DIR)

    # Wait for Redis to be responsive
    for i in range(10):
        try:
            r = redis.Redis(host='localhost', port=REDIS_PORT)
            if r.ping():
                print("        [INFO] ✅ Redis is up and ready.")
                return
        except redis.exceptions.ConnectionError:
            print(f"        [TIMEOUT] ⏳ Waiting for Redis to start... ({i+1}/10)")
            time.sleep(1)

    raise RuntimeError("        [ERROR] ❌ Redis started, but did not respond.")
