from pathlib import Path


def ensure_parent_dir(path: str | Path) -> Path:
    """Ensure the parent directory of a path exists and return the Path."""
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    return p


def read_text(path: str | Path) -> str:
    return Path(path).read_text(encoding="utf-8")


def write_text(path: str | Path, content: str) -> Path:
    p = ensure_parent_dir(path)
    p.write_text(content, encoding="utf-8")
    return p
