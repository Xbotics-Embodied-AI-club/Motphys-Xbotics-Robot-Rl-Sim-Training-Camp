# 项目仓库结构说明

本仓库同时支持三种使用方式：

1. 课程讲稿仓库：每章一个 Markdown 文件，方便直接录课
2. PPT 大纲仓库：每页一个标题块，方便直接制作幻灯片
3. 教学项目仓库：补充 `src/`、`notes/`、`assets/`、`examples/` 等目录，便于长期维护

## 推荐目录结构

```text
MotrixlabClass/
├── README.md
├── course_outline.md
├── project_structure.md
├── lectures/
│   ├── 01_course_intro.md
│   ├── 02_basic_framework.md
│   ├── 03_training_environment.md
│   ├── 04_reward_function.md
│   ├── 05_config_system.md
│   ├── 06_registry_system.md
│   ├── 07_training_pipeline.md
│   ├── 08_demo_analysis.md
│   ├── 09_basic_control_demos.md
│   ├── 10_manipulation_demos.md
│   ├── 11_locomotion_demos.md
│   └── 12_final_summary.md
├── ppt/
│   ├── 00_title.md
│   ├── 01_course_intro.md
│   ├── 02_framework_overview.md
│   ├── 03_environment_reward_config.md
│   ├── 04_registry_pipeline.md
│   ├── 05_demo_analysis.md
│   ├── 06_basic_control.md
│   ├── 07_manipulation.md
│   ├── 08_locomotion.md
│   └── 09_summary.md
├── src/
│   ├── __init__.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── lecture.py
│   ├── services/
│   │   ├── __init__.py
│   │   └── outline_builder.py
│   └── utils/
│       ├── __init__.py
│       └── file_ops.py
├── notes/
│   ├── glossary.md
│   ├── reading_notes.md
│   └── experiment_log.md
├── assets/
│   ├── diagrams/
│   └── screenshots/
└── examples/
    ├── demo_analysis_template.md
    └── lecture_template.md
```

## 使用方式建议

- `lectures/`：录课时按章节逐个补充讲稿
- `ppt/`：按幻灯片顺序整理，每个文件对应一节内容页
- `src/`：存放辅助脚本、解析工具、示例代码
- `notes/`：存放术语表、阅读笔记、实验记录
- `assets/`：存放图片、流程图、截图
- `examples/`：存放可复用模板
