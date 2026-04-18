# 阶段二：平台实战

> [!TIP]
> 🎯 **阶段目标**：熟悉 MotrixLab 平台的任务结构、训练流程与调试方法，完成四足机器人任务的配置、训练与结果复现。

通过本月的实操，你将深入理解 MotrixLab 的文件结构、配置机制、强化学习奖励设计与训练调试流程，并逐步形成面向真实任务的工程实践能力。

## 📖 在线阅读

- 飞书在线文档：[MotrixLab 线上实习第二月](https://tcnmf6tdu5z9.feishu.cn/wiki/BlyewaSVmiZRThkHBVocspzCnAf?from=from_copylink)

## 📝 飞书文档文字摘录

### 第 1 周：熟悉 MotrixLab 平台 & 跑通基础任务

- **目标**：搞懂 MotrixLab 的基本使用方式，跑通官方示例任务，建立初步直觉。
- **本周学习重点**：
  - 仓库结构：了解 MotrixLab 仓库的整体目录划分与核心模块。
  - 环境基线：熟悉 ANYmal C 等已有环境的结构。
  - 运行机制：学习如何在 MotrixLab 中加载环境、启动训练脚本与渲染推理窗口。
- **实操任务**：
  - 基础跑通：在 MotrixLab 中成功训练和推理 ANYmal C（或其他官方默认的四足机器人）示例任务。
  - 参数实验：尝试修改模型训练与推理命令的参数，例如设置并行环境数 `num_envs`、开启无头模式 `headless`、调整总训练步数等，观察其对显存占用和训练速度的影响。

---

## 📅 详细学习路线与任务

### 第 1 周：熟悉平台 & 跑通基础任务

- **学习目标**：搞懂 MotrixLab 的基本使用方式，跑通示例任务。
- **核心内容**：
  - **MotrixLab 基础**：
    - 了解 MotrixLab 仓库目录结构。
    - 了解 `GO1` 环境的结构与核心模块关系。
- **实操任务**：
  1. 在 MotrixLab 中完成 Unitree GO1 示例任务的训练和推理。
  2. 熟悉常见训练、推理命令与参数配置方式。
- **注意**：记得多更换模型训练、推理命令的参数，比如设置环境数、无头模式等。
- **本周周报**：
  1. GO1 示例任务跑通的截图。
  2. MotrixLab 仓库目录结构说明。
  3. 任务相关文件结构说明。

### 第 2 周：深入理解 MotrixLab 任务结构

- **学习目标**：拆解并完全理解 MotrixLab 中任务的执行流程、配置组织与奖励机制。
- **核心内容**：
  - **环境基础结构**：
    - 环境配置：理解 `cfg.py` 中各类参数的组织方式。
    - 环境逻辑：理解任务环境文件中 `Actions`、`Observations`、`Rewards`、`Commands`、`Terminations` 的作用。
  - **策略与控制**：
    - 动作空间与控制接口：理解动作缩放、动作边界与关节控制需求。
    - 观测组织：理解不同观测项的来源与拼接方式。
  - **奖励与命令**：
    - 奖励函数：理解速度跟踪、姿态稳定、动作平滑等奖励项的设计思路。
- **深入实操**：
  1. 研究动作与观测的输入输出关系，理解关键配置参数的影响。
  2. 修改奖励函数，尝试不同的权重，观察其对训练的影响。
  3. 修改命令生成范围或重采样时间，观察训练行为变化。
- **本周周报**（回答以下问题）：
  1. 任务的动作空间是如何定义的？
  2. 关键观测项从哪里来？
  3. 如何修改目标速度或命令范围？
  4. 奖励函数中最关键的 2-3 项是什么？
  5. **输出一个 episode 完整数据流的示意图**。

### 第 3 周：开始搭建任务框架

- **学习目标**：搭建最小可运行任务环境，理解 MotrixLab 中任务框架的组织方式。
- **核心内容**：
  - **目录与资产准备**：
    - 创建标准的 MotrixLab 任务目录结构（包含 `__init__.py`, `cfg.py`, `*_np.py`, `xmls/` 等）。
    - 从 MuJoCo Menagerie 下载资产，学习 Body、Site、Geom、Joint 等组件概念。
  - **配置类搭建**：
    - 组织任务所需的嵌套配置类。
    - 设置合理的默认值（使用 `field(default_factory=...)`）。
  - **环境类框架搭建 (`__init__`)**：
    - 获取关键 body、joint、actuator。
    - 定义动作/观测空间，初始化状态和缓冲区。
  - **核心方法实现**：
    - `apply_action`（动作处理）
    - `_compute_observation`（观测计算与空间对齐）
    - `_compute_reward`（奖励计算）
    - `_check_termination`（终止条件）
    - `reset` 与 `update_state`
- **本周周报**：
  - 提交环境框架及核心方法的代码文件。

### 第 4 周：完整调试 & 复现结果

- **学习目标**：完成任务调试、跑 RL 训练、复现目标行为。
- **核心内容**：
  - **功能调试**：排除任务实现过程中的 bug。
  - **训练测试**：使用默认超参数尝试训练 PPO。
  - **数据分析**：看懂 TensorBoard 训练曲线，评估训练效果。
- **本周周报**：
  1. 任务完成后的完整代码文件。
  2. 训练日志或 TensorBoard 曲线的截图与解释说明。

---

## 🛠️ 云平台使用指南

本项目统一使用云服务器平台进行实操，已预装相关环境与依赖：

- **平台登录**：[Robogo Cloud Desktop](https://robogo.d-robotics.cc/cloud-desktop)
- **使用说明文档**：[飞书云平台指南](https://yv6uc1awtjc.feishu.cn/wiki/WL3ZwoviBiQ3SmkCXZtcPxQMnFb?from=from_copylink)
- **镜像选择**：⚠️ 必须选择 `xbotics-full-v2.5.1` 镜像。该镜像已预装 VS Code 和 MotrixLab 项目代码（位于 `/opt` 目录下）。
- **快速启动**：
  1. **MotrixLab**：VS Code 打开 `/opt/MotrixLab`，依赖使用 `uv` 管理，需使用 `uv run` 等相关命令运行。

---

## 📚 学习资源与参考文档

### 官方文档

- **MotrixLab 官方文档**：[学习基本使用方法](https://motrixlab.readthedocs.io/zh-cn/latest/)
- **MuJoCo 资产库**：[Google DeepMind Menagerie](https://github.com/google-deepmind/mujoco_menagerie)

### 核心任务资料

- MotrixLab 奖励设计讲解：`anymal_c_navigation_flat.mp4`
- 任务代码与文档参考：`迁移任务代码和详细文档.zip`

### 🎁 进阶加餐任务

学有余力的同学可继续围绕 MotrixLab 平台扩展更多任务实践与复现案例。

1. **机械臂任务**：尝试补充抓取、开柜等典型操作任务。
2. **四足机器人任务**：继续扩展不同地形、不同指令分布下的训练实验。
3. **统一复现代码**：`MotrixLab.zip`
