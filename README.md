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

### AI Mode

Configure `AI_MODE` in `.env` to control how restrictive the assistant is:

- **`isolated`** (default) — Portfolio-only assistant. Refuses out-of-context questions, strict security rules, forces function calls for portfolio data.
- **`open`** — General-purpose assistant. Can answer any question while still having access to weather, music, and portfolio tools.

---

## Features

- **Single API Endpoint** — All platforms (portfolio, weather, audio) talk through one endpoint.
- **AI Mode Switch** — Toggle between `isolated` (portfolio-only) and `open` (general-purpose) assistant via `.env`.
- **Function Calling (Tools)** — The LLM dynamically calls backend functions (`get_current_weather`, `control_audio_player`, `get_portfolio_info`).
- **Session Persistence** — Redis-backed conversation history with automatic in-memory fallback.
- **Rate Limiting** — 10 requests/minute/session to prevent abuse.
- **Modular Architecture** — Clean separation of concerns in the `app/` package.
- **Next.js Frontend** — Chat UI with dark theme, markdown rendering, and session management.

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
├── frontend/                     # Next.js chat UI
│   ├── app/                      # App router pages
│   ├── components/               # React components
│   ├── lib/                      # API client & persistence
│   └── types/                    # TypeScript types
│
├── main.py                       # Entry point
├── test_gateway.py               # Unit tests
├── requirements.txt              # Python dependencies
├── .env.example                  # Environment variable template
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
HOST=0.0.0.0

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-your_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Model & inference
MODEL=google/gemini-2.0-flash-exp:free
TEMPERATURE=0.7
MAX_TOOL_CALLS=5

# AI Mode: "isolated" (portfolio-only) or "open" (general-purpose)
AI_MODE=isolated

# Error detection patterns (comma-separated)
ERROR_PATTERNS=does not support image,cannot read,image input,does not support

# Redis (optional — remove or leave blank to use in-memory)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=
```

### 5. Run Backend

```bash
python main.py
```

Server starts at `http://127.0.0.1:8000`.

### 6. Run Frontend (Optional)

```bash
cd frontend
npm install
npm run dev
```

Frontend starts at `http://127.0.0.1:3000` (or LAN IP if using `--host 0.0.0.0`).

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
