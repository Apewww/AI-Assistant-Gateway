from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    session_id: str = Field(..., description="Unique identifier for the session")
    source_platform: str = Field(..., description="Platform sending the message (e.g. web_cuacakita, web_porto, audio_stream)")
    message: str = Field(..., description="The message content from the user")
    model: Optional[str] = Field(default=None, description="Model override (falls back to env MODEL)")
    temperature: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Temperature override (falls back to env TEMPERATURE)")
    file_ids: Optional[List[str]] = Field(default=None, description="IDs of pre-uploaded files to include with the message")


class UploadResponse(BaseModel):
    file_id: str
    filename: str
    mime_type: str
    size: int


class ActionTrigger(BaseModel):
    target_service: str
    command: str
    parameters: Dict[str, Any]


class ChatResponse(BaseModel):
    session_id: str
    response_type: str = Field(..., description="Type of response: 'text' or 'action'")
    content: str
    action_triggered: Optional[ActionTrigger] = None
