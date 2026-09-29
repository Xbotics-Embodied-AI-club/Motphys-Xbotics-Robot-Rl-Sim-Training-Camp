from dataclasses import dataclass
from pathlib import Path


@dataclass
class OutlineItem:
    title: str
    bullets: list[str]


def build_markdown_outline(items: list[OutlineItem], output: str | Path) -> Path:
    path = Path(output)
    path.parent.mkdir(parents=True, exist_ok=True)
    lines: list[str] = []
    for item in items:
        lines.append(f"# {item.title}")
        lines.append("")
        for bullet in item.bullets:
            lines.append(f"- {bullet}")
        lines.append("")
    path.write_text("\n".join(lines), encoding="utf-8")
    return path
