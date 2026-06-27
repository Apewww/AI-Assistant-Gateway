import os
from dotenv import load_dotenv

load_dotenv()


def get_env(key: str, default=None):
    return os.getenv(key, default)


PORT = int(get_env("PORT", 8000))
HOST = get_env("HOST", "0.0.0.0")
OPENROUTER_API_KEY = get_env("OPENROUTER_API_KEY")
REDIS_HOST = get_env("REDIS_HOST", "127.0.0.1")
REDIS_PORT = int(get_env("REDIS_PORT", 6379))
REDIS_DB = int(get_env("REDIS_DB", 0))
REDIS_PASSWORD = get_env("REDIS_PASSWORD", None)
