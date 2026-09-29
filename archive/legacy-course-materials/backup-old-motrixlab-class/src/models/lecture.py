from dataclasses import dataclass, field


@dataclass
class LectureSection:
    title: str
    bullets: list[str] = field(default_factory=list)


@dataclass
class LectureChapter:
    number: int
    title: str
    sections: list[LectureSection] = field(default_factory=list)
