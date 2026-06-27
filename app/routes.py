import json
import logging
import time
import urllib.request
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
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

# In-memory cache for model list
_models_cache = {"data": None, "timestamp": 0}
_MODELS_CACHE_TTL = 300  # 5 minutes

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


@router.get("/api/v1/models")
async def list_models():
    global _models_cache
    now = time.time()

    if _models_cache["data"] and now - _models_cache["timestamp"] < _MODELS_CACHE_TTL:
        return _models_cache["data"]

    try:
        req = urllib.request.Request(
            f"{OPENROUTER_BASE_URL}/models",
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read().decode())

        models = body.get("data", [])
        free = [
            {
                "id": m["id"],
                "name": m.get("name", m["id"]),
                "pricing": m.get("pricing", {}),
            }
            for m in models
            if m.get("pricing", {}).get("prompt") == "0"
        ]
        free.sort(key=lambda m: m["name"].lower())

        result = {"models": free, "total": len(free)}
        _models_cache = {"data": result, "timestamp": now}
        return result

    except Exception as e:
        logging.error(f"Failed to fetch models from OpenRouter: {e}")
        fallback = {
            "models": [
                {"id": "google/gemini-2.0-flash-exp:free", "name": "Gemini 2.0 Flash (free)", "pricing": {"prompt": "0", "completion": "0"}},
                {"id": "openai/gpt-4o-mini", "name": "GPT-4o Mini", "pricing": {"prompt": "0", "completion": "0"}},
                {"id": "anthropic/claude-3-haiku", "name": "Claude 3 Haiku", "pricing": {"prompt": "0", "completion": "0"}},
                {"id": "meta-llama/llama-3-70b-instruct", "name": "Llama 3 70B Instruct", "pricing": {"prompt": "0", "completion": "0"}},
                {"id": "mistralai/mistral-7b-instruct", "name": "Mistral 7B Instruct", "pricing": {"prompt": "0", "completion": "0"}},
                {"id": "qwen/qwen-2.5-72b-instruct", "name": "Qwen 2.5 72B Instruct", "pricing": {"prompt": "0", "completion": "0"}},
            ],
            "total": 6,
        }
        return fallback


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
        active_model = request.model or MODEL

        for _ in range(MAX_TOOL_CALLS):
            response = client.chat.completions.create(
                model=active_model,
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


def _process_tool_calls(message, content, messages, tool_calls_list):
    """Execute tool calls and append results to messages. Shared helper."""
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
    return messages


@router.post("/api/v1/chat/stream")
async def chat_stream(request: ChatRequest):
    check_rate_limit(request.session_id)

    action_triggered_var.set(None)
    history = session_store.get_history(request.session_id)

    api_key = OPENROUTER_API_KEY
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OPENROUTER_API_KEY belum dikonfigurasi di file .env.",
        )

    client = OpenAI(base_url=OPENROUTER_BASE_URL, api_key=api_key)

    def generate():
        nonlocal history
        active_model = request.model or MODEL
        full_response = ""
        action = None

        try:
            messages = [
                {"role": "system", "content": get_system_instruction(request.source_platform, AI_MODE)}
            ]
            for msg in history:
                role = "assistant" if msg["role"] == "model" else msg["role"]
                messages.append({"role": role, "content": msg["message"]})
            messages.append({"role": "user", "content": request.message})

            for _ in range(MAX_TOOL_CALLS):
                stream = client.chat.completions.create(
                    model=active_model,
                    messages=messages,
                    tools=TOOLS,
                    tool_choice="auto",
                    temperature=TEMPERATURE,
                    stream=True,
                )

                content_chunks = []
                tool_calls_acc = {}
                finish_reason = None

                for chunk in stream:
                    if not chunk.choices:
                        continue
                    delta = chunk.choices[0].delta
                    finish_reason = chunk.choices[0].finish_reason

                    if delta.content:
                        content_chunks.append(delta.content)
                        yield f"data: {json.dumps({'type': 'text', 'content': delta.content})}\n\n"

                    if delta.tool_calls:
                        for tc in delta.tool_calls:
                            idx = tc.index
                            if idx not in tool_calls_acc:
                                tool_calls_acc[idx] = {"id": "", "function": {"name": "", "arguments": ""}}
                            if tc.id:
                                tool_calls_acc[idx]["id"] = tc.id
                            if tc.function:
                                if tc.function.name:
                                    tool_calls_acc[idx]["function"]["name"] = tc.function.name
                                if tc.function.arguments:
                                    tool_calls_acc[idx]["function"]["arguments"] += tc.function.arguments

                    if finish_reason in ("stop", "tool_calls"):
                        break

                acc_text = "".join(content_chunks)
                is_model_error = any(p.search(acc_text) for p in ERROR_PATTERNS)
                if is_model_error:
                    full_response = ""
                    break

                if finish_reason == "stop":
                    full_response = acc_text
                    break

                # Process tool calls
                if not tool_calls_acc:
                    full_response = acc_text
                    break

                tool_calls_list = list(tool_calls_acc.values())
                tool_calls_payload = [
                    {
                        "id": tc["id"],
                        "type": "function",
                        "function": {
                            "name": tc["function"]["name"],
                            "arguments": tc["function"]["arguments"],
                        },
                    }
                    for tc in tool_calls_list
                ]
                messages.append({
                    "role": "assistant",
                    "content": acc_text,
                    "tool_calls": tool_calls_payload,
                })

                for tc_data in tool_calls_list:
                    function_name = tc_data["function"]["name"]
                    function_args = json.loads(tc_data["function"]["arguments"])
                    yield f"data: {json.dumps({'type': 'tool_call', 'name': function_name, 'args': function_args})}\n\n"
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
                        "tool_call_id": tc_data["id"],
                        "name": function_name,
                        "content": result,
                    })
                continue
            else:
                if not full_response:
                    full_response = "Maaf, terjadi kesalahan komunikasi dengan model AI. Silakan coba lagi."

            if not full_response or full_response == "Maaf, terjadi kesalahan komunikasi dengan model AI. Silakan coba lagi.":
                if not full_response:
                    full_response = "Maaf, terjadi kesalahan komunikasi dengan model AI. Silakan coba lagi."

            history.append({"role": "user", "message": request.message})
            history.append({"role": "model", "message": full_response})
            session_store.save_history(request.session_id, history)

            action = action_triggered_var.get()
            yield f"data: {json.dumps({'type': 'done', 'model': active_model, 'action_triggered': action})}\n\n"

        except Exception as e:
            logging.error(f"Error in stream: {e}")
            err_str = str(e)
            is_image_error = any(p.search(err_str) for p in ERROR_PATTERNS)
            if is_image_error:
                msg = "Asisten AI saat ini tidak mendukung pemrosesan gambar. Silakan kirim pertanyaan berupa teks."
            else:
                msg = f"Terjadi kesalahan saat memproses pesan: {err_str}"
            yield f"data: {json.dumps({'type': 'error', 'message': msg})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
