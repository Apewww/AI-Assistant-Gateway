import contextvars
from typing import Optional

action_triggered_var = contextvars.ContextVar("action_triggered", default=None)


def control_audio_player(action: str, genre: Optional[str] = None) -> str:
    """Mengontrol player musik Audio Stream (Syncra) seperti memutar track/genre tertentu.

    Args:
        action: Perintah kontrol seperti PLAY_TRACK, STOP, PAUSE, NEXT, PREV
        genre: Genre musik opsional (misal: lo-fi, pop, jazz)
    """
    action_payload = {
        "target_service": "audio_stream",
        "command": action,
        "parameters": {
            "genre": genre or "general",
            "track_id": "lf_009" if (genre and "lo-fi" in genre.lower()) else "default_track",
        },
    }
    action_triggered_var.set(action_payload)
    return f"Menjalankan perintah {action} di Audio Stream untuk musik {genre or 'umum'}."
