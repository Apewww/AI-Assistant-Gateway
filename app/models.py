from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    session_id: str = Field(..., description="Unique identifier for the session")
    source_platform: str = Field(..., description="Platform sending the message (e.g. web_cuacakita, web_porto, audio_stream)")
    message: str = Field(..., description="The message content from the user")


class ActionTrigger(BaseModel):
    target_service: str
    command: str
    parameters: Dict[str, Any]


class ChatResponse(BaseModel):
    session_id: str
    response_type: str = Field(..., description="Type of response: 'text' or 'action'")
    content: str
    action_triggered: Optional[ActionTrigger] = None
