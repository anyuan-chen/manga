"""
Very small helper that runs `process_page.process_page` for every page in a
chapter PDF. No CLI, no extra bells—edit the `if __name__ == "__main__"` block
to point at whatever chapter you're experimenting with.
"""


import json
import os
from pathlib import Path
import fitz  # PyMuPDF

from process_page import process_page, render_page_from_doc


def _load_dotenv(dotenv_path: str | Path = ".env") -> None:
    """
    Minimal .env loader so we don't need extra dependencies.

    Lines should look like:
        KEY=VALUE
    Comments starting with '#' and blank lines are ignored.
    Variables already present in the environment are left unchanged.
    """
    path = Path(dotenv_path)
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        os.environ.setdefault(key, value)


# Load a local .env file (if present) once when this module is imported.
_load_dotenv()


def process_chapter(
    pdf_path: Path,
    *,
    model: str = "gemini-1.5-flash",
    output_path: Path,
) -> None:
    """Process the entire PDF and dump all page data into a single JSON file."""

    pdf_path = Path(pdf_path)
    output_path = Path(output_path)

    if not pdf_path.exists():
        raise FileNotFoundError(pdf_path)

    with fitz.open(pdf_path) as doc:
        total_pages = doc.page_count

        if total_pages == 0:
            raise ValueError("PDF has no pages")

        output_path.parent.mkdir(parents=True, exist_ok=True)

        chapter_data = []
        for page_number in range(1, total_pages + 1):
            print(f"Processing page {page_number}/{total_pages}...")
            image_bytes = render_page_from_doc(doc, page_number)
            result = process_page(
                pdf_path,
                page=page_number,
                model=model,
                image_bytes=image_bytes,
            )
            chapter_data.append(
                {
                    "page": page_number,
                    "data": result,
                }
            )

    output_path.write_text(
        json.dumps(
            {
                "pdf": str(pdf_path),
                "total_pages": total_pages,
                "pages": chapter_data,
            },
            ensure_ascii=False,
            indent=2,
        ),
        "utf-8",
    )
    print(f"Saved chapter JSON to {output_path}")


if __name__ == "__main__":
    # Quick-and-dirty entry point—edit these paths/pages as you iterate.
    
    CHAPTER_PDF = Path("Yotsubato-ch1.pdf")
    OUTPUT_PATH = Path("chapter_outputs/Yotsubato_ch1.json")

    process_chapter(
        CHAPTER_PDF,
        output_path=OUTPUT_PATH,
    )

