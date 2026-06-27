import os
import re
from dotenv import load_dotenv

load_dotenv()


def get_env(key: str, default=None):
    return os.getenv(key, default)


# Server
PORT = int(get_env("PORT", 8000))
HOST = get_env("HOST", "0.0.0.0")

# OpenRouter
OPENROUTER_API_KEY = get_env("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = get_env("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

# Model & inference
MODEL = get_env("MODEL", "google/gemini-2.0-flash-exp:free")
TEMPERATURE = float(get_env("TEMPERATURE", 0.7))
MAX_TOOL_CALLS = int(get_env("MAX_TOOL_CALLS", 5))

# AI mode: "isolated" (portfolio-only) or "open" (general assistant)
AI_MODE = get_env("AI_MODE", "isolated")

# Comma-separated error patterns to detect model failure
_ERROR_PATTERNS_RAW = get_env(
    "ERROR_PATTERNS",
    "does not support image,cannot read,image input,does not support",
)
ERROR_PATTERNS = [re.compile(p.strip(), re.IGNORECASE) for p in _ERROR_PATTERNS_RAW.split(",") if p.strip()]

# Redis
REDIS_HOST = get_env("REDIS_HOST", "127.0.0.1")
REDIS_PORT = int(get_env("REDIS_PORT", 6379))
REDIS_DB = int(get_env("REDIS_DB", 0))
REDIS_PASSWORD = get_env("REDIS_PASSWORD", None)
