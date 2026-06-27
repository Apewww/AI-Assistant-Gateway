import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router
from app.session import session_store

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()],
)


def create_app() -> FastAPI:
    app = FastAPI(
        title="Centralized AI Chatbot Gateway",
        description="Orchestrator connecting Gemini 1.5 Pro with raflylabs portfolio, weather, and audio stream systems.",
        version="1.0.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(router)

    @app.get("/health")
    def health_check():
        return {
            "status": "healthy",
            "redis_connected": session_store.redis_client is not None,
        }

    return app
