"""
Minimal helper that converts a manga PDF page to an image and asks Gemini for
Japanese + English breakdowns.
"""

import json
import os
from pathlib import Path

import fitz  # PyMuPDF
import google.generativeai as genai


DPI = 300


def render_page_from_doc(doc: fitz.Document, page_number: int) -> bytes:
    """Render a PDF page using an already-open fitz Document."""
    page = doc.load_page(page_number - 1)
    zoom = DPI / 72
    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
    return pix.tobytes("png")


PROMPT = """
Extract every Japanese utterance on this manga page, translate it, note key
grammar points, and list vocabulary. Return concise JSON.
""".strip()


def ask_gemini(image_bytes: bytes, model: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise SystemExit("GEMINI_API_KEY not set.")

    genai.configure(api_key=api_key)
    response = genai.GenerativeModel(model).generate_content(
        [
            {"mime_type": "image/png", "data": image_bytes},
            PROMPT,
        ],
        generation_config={"response_mime_type": "application/json"},
    )
    if not response or not response.text:
        raise RuntimeError("Empty Gemini response.")
    return response.text


def parse_response(text: str):
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise RuntimeError("Gemini returned invalid JSON.") from exc


def process_page(
    pdf_path: Path | str,
    *,
    page: int = 1,
    model: str = "gemini-1.5-flash",
    image_bytes: bytes | None = None,
) -> dict:
    """
    Render a PDF page (unless pre-rendered bytes are provided) and send to Gemini.
    """

    if image_bytes is None:
        # For chapter runs we always pass pre-rendered bytes. If this is ever
        # called without them, skip the page 
        print(f"Warning: no image bytes for {pdf_path=}, {page=}; skipping page.")
        return {}

    parsed = parse_response(ask_gemini(image_bytes, model))

    return parsed
