import json
import logging
from typing import Dict, List, Optional
import redis
from app.config import REDIS_HOST, REDIS_PORT, REDIS_DB, REDIS_PASSWORD


class SessionStore:
    def __init__(self):
        self.redis_client = None
        self.in_memory_db: Dict[str, List[Dict[str, str]]] = {}

        try:
            self.redis_client = redis.Redis(
                host=REDIS_HOST,
                port=REDIS_PORT,
                db=REDIS_DB,
                password=REDIS_PASSWORD,
                decode_responses=True,
                socket_timeout=2.0,
                socket_connect_timeout=2.0,
            )
            self.redis_client.ping()
            logging.info("Connected to Redis successfully.")
        except Exception as e:
            logging.warning(f"Failed to connect to Redis, falling back to In-Memory storage. Error: {e}")
            self.redis_client = None

    def get_history(self, session_id: str) -> List[Dict[str, str]]:
        if self.redis_client:
            try:
                data = self.redis_client.get(f"session:{session_id}")
                if data:
                    return json.loads(data)
                return []
            except Exception as e:
                logging.error(f"Redis error in get_history: {e}. Falling back to in-memory.")
        return self.in_memory_db.get(session_id, [])

    def save_history(self, session_id: str, history: List[Dict[str, str]]):
        if self.redis_client:
            try:
                self.redis_client.set(f"session:{session_id}", json.dumps(history), ex=3600)
                return
            except Exception as e:
                logging.error(f"Redis error in save_history: {e}. Saving to in-memory.")
        self.in_memory_db[session_id] = history


session_store = SessionStore()
