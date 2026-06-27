# AI Assistant Gateway

A modular **FastAPI**-based AI Gateway that connects a Large Language Model (via OpenRouter) to multiple platform frontends through a single API endpoint.

Created by **Rafly Anggara Putra** — [GitHub](https://github.com/apewww) · [LinkedIn](https://linkedin.com/in/rafly-anggara) · [Portfolio](https://raflylabs.com)

---

## How It Works

```
User (Portfolio Website)  \
User (Weather Platform)   --->  POST /api/v1/chat/message  -->  LLM (OpenRouter)
User (Audio Stream)       /                                        |
                                                                    v
                                                          +------------------+
                                                          | Function Calling |
                                                          | - get_weather    |
                                                          | - play_audio     |
                                                          | - get_portfolio  |
                                                          +------------------+
```

The gateway acts as a **single point of contact** for all chat interactions across different platforms. Each request includes a `session_id` (for conversation continuity) and a `source_platform` (so the AI adapts its role per platform). The AI can call backend functions like fetching weather data, controlling music playback, or reading portfolio documents — and the response includes either plain text or an **action trigger** that the frontend can execute (e.g., play a song).

---

## Features

- **Single API Endpoint** — All platforms (portfolio, weather, audio) talk through one endpoint.
- **Function Calling (Tools)** — The LLM dynamically calls backend functions (`get_current_weather`, `control_audio_player`, `get_portfolio_info`).
- **Session Persistence** — Redis-backed conversation history with automatic in-memory fallback.
- **Rate Limiting** — 10 requests/minute/session to prevent abuse.
- **Modular Architecture** — Clean separation of concerns in the `app/` package.

---

## Project Structure

```
├── app/                          # Core application package
│   ├── app.py                    # FastAPI app factory & middleware
│   ├── config.py                 # Loads .env config
│   ├── models.py                 # Pydantic request/response schemas
│   ├── session.py                # Redis + in-memory session store
│   ├── rate_limiter.py           # Rate limiter (10 req/min)
│   ├── system_prompts.py         # AI system instructions & security rules
│   ├── routes.py                 # API endpoint + tool definitions
│   └── tools/
│       ├── weather.py            # get_current_weather()
│       ├── audio.py              # control_audio_player()
│       └── portfolio.py          # get_portfolio_info()
│
├── docs_aigateway/               # Portfolio markdown (skills, projects, etc.)
│   ├── skills.md
│   ├── projects.md
│   ├── experience.md
│   └── identity.md
│
├── main.py                       # Entry point
├── test_gateway.py               # Unit tests
├── requirements.txt              # Python dependencies
├── start_gateway.bat             # Windows service startup script
├── .env.example                  # Environment variable template
├── sdd.md                        # Software Design Document
└── LICENSE                       # MIT License
```

---

## Requirements

- **Python 3.11+**
- **Redis** (optional — falls back to in-memory storage)
- **OpenRouter API Key** ([get one free](https://openrouter.ai))

---

## Setup & Run

### 1. Clone & Enter

```bash
git clone https://github.com/apewww/AI-Assistant-Gateway.git
cd AI-Assistant-Gateway
```

### 2. Virtual Environment

```bash
python -m venv venv
```

- **Windows:** `.\venv\Scripts\activate`
- **Linux/macOS:** `source venv/bin/activate`

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment

Copy `.env.example` to `.env` and fill in your OpenRouter API key:

```env
# Server
PORT=8000
HOST=127.0.0.1

# OpenRouter API Key (get at https://openrouter.ai/keys)
OPENROUTER_API_KEY=sk-or-v1-your_key_here

# Redis (optional — remove or leave blank to use in-memory)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=
```

### 5. Run

```bash
python main.py
```

Server starts at `http://127.0.0.1:8000`.

---

## Testing

```bash
python test_gateway.py
```

Tests cover health check, tool functions, chat flow, action triggers, and rate limiting.

---

## API Reference

### `POST /api/v1/chat/message`

Send a user message and receive a text response and/or action trigger.

**Request:**
```json
{
  "session_id": "user_abc123",
  "source_platform": "web_porto",
  "message": "What skills does Rafly have?"
}
```

**Response (text):**
```json
{
  "session_id": "user_abc123",
  "response_type": "text",
  "content": "Rafly specializes in Python, FastAPI, and DevOps...",
  "action_triggered": null
}
```

**Response (action):**
```json
{
  "session_id": "user_abc123",
  "response_type": "action",
  "content": "Playing lo-fi music now.",
  "action_triggered": {
    "target_service": "audio_stream",
    "command": "PLAY_TRACK",
    "parameters": { "genre": "lo-fi", "track_id": "lf_009" }
  }
}
```

### `GET /health`

```json
{ "status": "healthy", "redis_connected": false }
```

---

## Deployment

### Linux (systemd)

```ini
[Unit]
Description=AI Assistant Gateway
After=network.target

[Service]
User=youruser
WorkingDirectory=/path/to/AI-Assistant-Gateway
ExecStart=/path/to/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

### Windows (NSSM)

Use `start_gateway.bat` as the application path when creating an NSSM service.

### Docker

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Credits

Built with ❤️ by **Rafly Anggara Putra**

- GitHub: [github.com/apewww](https://github.com/apewww)
- LinkedIn: [linkedin.com/in/rafly-anggara](https://linkedin.com/in/rafly-anggara)
- Portfolio: [raflylabs.com](https://raflylabs.com)

---

## License

MIT — see [LICENSE](LICENSE).
