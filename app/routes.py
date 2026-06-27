import json
import logging
from fastapi import APIRouter, HTTPException, status
from openai import OpenAI, APIError

from app.config import (
    OPENROUTER_API_KEY,
    OPENROUTER_BASE_URL,
    MODEL,
    TEMPERATURE,
    MAX_TOOL_CALLS,
    AI_MODE,
    ERROR_PATTERNS,
)
from app.models import ChatRequest, ChatResponse, ActionTrigger
from app.session import session_store
from app.rate_limiter import check_rate_limit
from app.system_prompts import get_system_instruction
from app.tools.weather import get_current_weather
from app.tools.audio import control_audio_player, action_triggered_var
from app.tools.portfolio import get_portfolio_info

router = APIRouter()

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_current_weather",
            "description": "Mengambil prakiraan cuaca saat ini untuk lokasi yang ditentukan dari internal CuacaKita.",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "Nama kota atau lokasi (misal: Cimahi, Bandung, Jakarta)",
                    }
                },
                "required": ["location"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "control_audio_player",
            "description": "Mengontrol player musik Audio Stream (Syncra) seperti memutar track/genre tertentu.",
            "parameters": {
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "description": "Perintah kontrol seperti PLAY_TRACK, STOP, PAUSE, NEXT, PREV",
                    },
                    "genre": {
                        "type": "string",
                        "description": "Genre musik opsional (misal: lo-fi, pop, jazz)",
                    },
                },
                "required": ["action"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_portfolio_info",
            "description": "Mengambil informasi detail mengenai portofolio, skill, proyek, pengalaman kerja, sertifikasi, pendidikan, atau identitas Rafly Anggara Putra dari dokumentasi lokal markdown. Gunakan fungsi ini untuk pertanyaan tentang sertifikasi (certification), pendidikan (education), riwayat kerja (experience), keahlian (skills), atau proyek.",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "Topik pencarian spesifik. Contoh: 'skill', 'projects', 'experience', 'sertifikasi', 'certification', 'pendidikan', 'education', 'identity'",
                    }
                },
                "required": ["topic"],
            },
        },
    },
]


@router.post("/api/v1/chat/message", response_model=ChatResponse)
async def chat_message(request: ChatRequest):
    check_rate_limit(request.session_id)

    action_triggered_var.set(None)

    history = session_store.get_history(request.session_id)

    api_key = OPENROUTER_API_KEY
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OPENROUTER_API_KEY belum dikonfigurasi di file .env.",
        )

    try:
        client = OpenAI(
            base_url=OPENROUTER_BASE_URL,
            api_key=api_key,
        )

        messages = [{"role": "system", "content": get_system_instruction(request.source_platform, AI_MODE)}]
        for msg in history:
            role = "assistant" if msg["role"] == "model" else msg["role"]
            messages.append({"role": role, "content": msg["message"]})

        messages.append({"role": "user", "content": request.message})

        response_text = ""

        for _ in range(MAX_TOOL_CALLS):
            response = client.chat.completions.create(
                model=MODEL,
                messages=messages,
                tools=TOOLS,
                tool_choice="auto",
                temperature=TEMPERATURE,
            )

            if not response.choices or response.choices[0] is None:
                logging.warning("OpenRouter returned empty choices. Breaking loop.")
                response_text = "Maaf, asisten AI sedang tidak dapat merespons saat ini. Silakan coba lagi."
                break

            message = response.choices[0].message

            content = (message.content or "").strip()
            is_model_error = any(p.search(content) for p in ERROR_PATTERNS)
            if is_model_error:
                response_text = ""
                break

            if message.tool_calls:
                tool_calls_payload = [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {"name": tc.function.name, "arguments": tc.function.arguments},
                    }
                    for tc in message.tool_calls
                ]
                messages.append({
                    "role": "assistant",
                    "content": content,
                    "tool_calls": tool_calls_payload,
                })

                for tool_call in message.tool_calls:
                    function_name = tool_call.function.name
                    function_args = json.loads(tool_call.function.arguments)

                    if function_name == "get_current_weather":
                        result = get_current_weather(**function_args)
                    elif function_name == "control_audio_player":
                        result = control_audio_player(**function_args)
                    elif function_name == "get_portfolio_info":
                        result = get_portfolio_info(**function_args)
                    else:
                        result = f"Error: Function {function_name} not found."

                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "name": function_name,
                        "content": result,
                    })
                continue
            else:
                response_text = content
                break
        else:
            last_content = None
            if response.choices and response.choices[0] is not None:
                content = (response.choices[0].message.content or "").strip()
                is_model_error = any(p.search(content) for p in ERROR_PATTERNS)
                last_content = "" if is_model_error else content
            response_text = last_content or ""

        if not response_text:
            response_text = "Maaf, terjadi kesalahan komunikasi dengan model AI. Silakan coba lagi."

        history.append({"role": "user", "message": request.message})
        history.append({"role": "model", "message": response_text})
        session_store.save_history(request.session_id, history)

        action = action_triggered_var.get()

        if action:
            return ChatResponse(
                session_id=request.session_id,
                response_type="action",
                content=response_text,
                action_triggered=ActionTrigger(**action),
            )
        else:
            return ChatResponse(
                session_id=request.session_id,
                response_type="text",
                content=response_text,
                action_triggered=None,
            )

    except Exception as e:
        logging.error(f"Error calling OpenRouter: {e}")
        err_str = str(e)
        is_image_error = any(p.search(err_str) for p in ERROR_PATTERNS)
        if is_image_error:
            detail = "Asisten AI saat ini tidak mendukung pemrosesan gambar. Silakan kirim pertanyaan berupa teks."
        else:
            detail = f"Terjadi kesalahan saat memproses pesan: {err_str}"
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
        )
