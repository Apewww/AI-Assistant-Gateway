# Fitur AI Assistant Gateway

## Chat & AI

- **Streaming Response** — Teks muncul real-time dari AI tanpa nunggu selesai. Didukung SSE (`/api/v1/chat/stream`).
- **Function Calling** — AI bisa memanggil fungsi backend: cek cuaca (`get_current_weather`), kontrol musik (`control_audio_player`), baca portofolio (`get_portfolio_info`).
- **Session Persistence** — Riwayat chat tersimpan per session (Redis atau in-memory fallback). Bertahan walaupun halaman di-refresh.
- **Markdown Rendering** — Tabel, code blocks, list, blockquote, link, inline code — semua di-render dengan `react-markdown` + `remark-gfm`.
- **Copy Code** — Setiap code block punya tombol "Copy" (hover) dengan feedback visual.
- **Edit & Delete Pesan** — Hover pada pesan sendiri untuk edit (inline textarea) atau hapus.
- **Auto-naming Session** — Nama chat otomatis diambil dari pesan pertama.

## AI Mode

- **`isolated`** (default) — Hanya menjawab pertanyaan tentang portofolio, cuaca, dan musik. Tolak pertanyaan di luar konteks.
- **`open`** — General-purpose assistant. Bisa jawab pertanyaan apa saja, tetap punya akses ke tools.

## Model Management

- **Model Selector** — Pilih model AI dari dropdown di sidebar. Daftar model di-fetch langsung dari OpenRouter API (otomatis update).
- **Kustom Model** — Bisa set default model lewat `.env` (`MODEL`), dan user bisa override per-chat dari UI.
- **Temperature Config** — Atur kreativitas AI lewat `.env` (`TEMPERATURE`, default `0.7`).

## User Interface

- **Deep Dark Theme** — OLED-friendly (#000, #0A0A0A, #111). Cocok untuk penggunaan malam hari.
- **Sidebar** — Daftar session chat, rename, delete. Toggle untuk mobile.
- **Token Usage Bar** — Progress bar di atas chat feed (perkiraan token). Merah kalau >75%. Tombol "Clear" untuk reset context.
- **Empty State** — Tampilan awal yang informatif saat belum ada chat.
- **Typing Indicator** — Animasi 3 dots saat AI sedang memproses.
- **Blinking Cursor** — Kursor berkedip saat AI sedang streaming.
- **Responsive** — Layout menyesuaikan desktop dan mobile (sidebar overlay di layar kecil).

## Admin & Konfigurasi

- **Environment Variables** — Semua konfigurasi lewat `.env` (model, temperature, rate limit, mode, error patterns, dll).
- **Rate Limiter** — 10 request/menit per session untuk mencegah abuse.
- **Error Pattern Detection** — Deteksi otomatis error model (gambar tidak didukung, dll) dan tampilkan pesan yang lebih ramah.
- **CORS All Origins** — Backend bisa diakses dari domain mana saja.

## API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/v1/chat/message` | Kirim pesan, dapat response non-streaming |
| `POST` | `/api/v1/chat/stream` | Kirim pesan, dapat response streaming (SSE) |
| `GET` | `/api/v1/models` | Daftar model gratis dari OpenRouter |
| `GET` | `/health` | Health check + status Redis |

## Tools / Function Calling

| Fungsi | Deskripsi |
|--------|-----------|
| `get_current_weather` | Ambil prakiraan cuaca untuk lokasi tertentu |
| `control_audio_player` | Kontrol pemutar musik Syncra (play, pause, next, dll) |
| `get_portfolio_info` | Baca data portofolio dari file markdown lokal |

## Teknologi

- **Backend**: Python 3.11+, FastAPI, OpenAI SDK (OpenRouter), Redis
- **Frontend**: Next.js 16, TypeScript, Tailwind CSS v4, react-markdown
- **Deploy**: systemd (Linux), NSSM (Windows), Docker
