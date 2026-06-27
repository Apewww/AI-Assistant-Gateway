import os
import logging


def get_portfolio_info(topic: str) -> str:
    """Mengambil informasi detail mengenai portofolio, skill, proyek, identitas, pendidikan, sertifikasi, atau riwayat kerja Rafly Anggara Putra dari dokumentasi lokal markdown.

    Args:
        topic: Topik pencarian spesifik (misal: skill, projects, experience, identity, pendidikan, sertifikasi)
    """
    topic_lower = topic.lower()

    if ".." in topic_lower or "/" in topic_lower or "\\" in topic_lower or "docs_syncra" in topic_lower or "docs_porto" in topic_lower or "docs_cuacakita" in topic_lower:
        logging.warning(f"Percobaan akses file tidak sah terdeteksi pada parameter topic: {topic}")
        return "Akses ditolak: Topik tidak valid."

    docs_dir = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "docs_aigateway"))
    filename = None

    if "skill" in topic_lower or "keahlian" in topic_lower or "kemampuan" in topic_lower or "teknologi" in topic_lower or "stack" in topic_lower:
        filename = "skills.md"
    elif "project" in topic_lower or "proyek" in topic_lower or "syncra" in topic_lower or "cuacakita" in topic_lower or "natahost" in topic_lower or "myfinance" in topic_lower:
        filename = "projects.md"
    elif (
        "experience" in topic_lower or "pengalaman" in topic_lower or "kerja" in topic_lower
        or "sertifikasi" in topic_lower or "sertif" in topic_lower or "certif" in topic_lower
        or "certification" in topic_lower or "certificate" in topic_lower or "cert" in topic_lower
        or "pendidikan" in topic_lower or "education" in topic_lower or "riwayat" in topic_lower
        or "ijazah" in topic_lower or "gelar" in topic_lower or "kuliah" in topic_lower
        or "sekolah" in topic_lower or "universitas" in topic_lower
    ):
        filename = "experience.md"
    elif "identity" in topic_lower or "identitas" in topic_lower or "profil" in topic_lower or "profile" in topic_lower or "siapa" in topic_lower or "rafly" in topic_lower or "bio" in topic_lower:
        filename = "identity.md"

    if filename:
        filepath = os.path.abspath(os.path.join(docs_dir, filename))
        if not filepath.startswith(docs_dir):
            logging.warning(f"Path traversal terdeteksi: {filepath}")
            return "Akses ditolak: Percobaan akses di luar direktori yang diizinkan."
        if os.path.exists(filepath):
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    return f.read()
            except Exception as e:
                return f"Gagal membaca berkas portofolio: {str(e)}"

    try:
        if os.path.exists(docs_dir):
            files = [f for f in os.listdir(docs_dir) if f.endswith(".md")]
            return f"Topik '{topic}' tidak ditemukan secara spesifik. Dokumentasi yang tersedia: {', '.join(files)}. Silakan tanyakan seputar skill, proyek, pengalaman, pendidikan, atau identitas Rafly."
    except Exception:
        pass

    return f"Informasi untuk topik '{topic}' tidak ditemukan di server."
