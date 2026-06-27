def get_current_weather(location: str) -> str:
    """Mengambil prakiraan cuaca saat ini untuk lokasi yang ditentukan dari internal CuacaKita.

    Args:
        location: Nama kota atau lokasi (misal: Cimahi, Bandung, Jakarta)
    """
    loc = location.lower()
    weather_data = {
        "cimahi": "Cerah berawan dengan suhu 26°C, kelembaban 70%.",
        "bandung": "Hujan ringan dengan suhu 22°C, kelembaban 85%.",
        "jakarta": "Cerah dengan suhu 32°C, kelembaban 60%.",
    }

    for key, val in weather_data.items():
        if key in loc:
            return f"Laporan cuaca internal untuk {location}: {val}"

    return f"Laporan cuaca internal untuk {location}: Terpantau cerah berawan dengan suhu rata-rata 25°C."
