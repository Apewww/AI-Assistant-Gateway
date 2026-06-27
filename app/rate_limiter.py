import time
import logging
from typing import Dict, List
from fastapi import HTTPException, status
from app.session import session_store

rate_limit_db: Dict[str, List[float]] = {}


def check_rate_limit(session_id: str):
    now = time.time()

    if session_store.redis_client:
        key = f"rate_limit:{session_id}"
        try:
            pipe = session_store.redis_client.pipeline()
            pipe.rpush(key, now)
            pipe.ltrim(key, -10, -1)
            pipe.expire(key, 60)
            pipe.lrange(key, 0, -1)
            results = pipe.execute()

            timestamps = [float(t) for t in results[3]]
            recent_requests = [t for t in timestamps if now - t < 60]
            if len(recent_requests) > 10:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit terlampaui. Batas maksimal adalah 10 request per menit.",
                )
            return
        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"Redis rate limiter failed: {e}. Using in-memory fallback.")

    timestamps = rate_limit_db.get(session_id, [])
    timestamps = [t for t in timestamps if now - t < 60]
    rate_limit_db[session_id] = timestamps

    if len(timestamps) >= 10:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit terlampaui. Batas maksimal adalah 10 request per menit.",
        )

    timestamps.append(now)
