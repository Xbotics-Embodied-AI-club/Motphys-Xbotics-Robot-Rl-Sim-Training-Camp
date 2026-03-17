# 谋先飞线上实习：第二个月（机器人仿真实操）

> [!TIP]
> 🎯 **本月核心目标**：熟悉 IsaacLab 中的导航任务 `Isaac-Navigation-Flat-Anymal-C-v0`，并将其完整迁移到 MotrixLab 平台中运行。

通过本月的实操，你将深入理解主流具身智能仿真平台的文件结构、配置机制、强化学习奖励设计，并掌握不同仿真器（Isaac Sim / MuJoCo）底层资产的迁移与对接。

---

## 📅 详细学习路线与任务

### 第 1 周：熟悉平台 & 跑通基础任务
* **学习目标**：搞懂 IsaacLab / MotrixLab 的基本使用方式，跑通示例任务。
* **核心内容**：
    * **IsaacLab 基础**：
        * 了解 IsaacLab 仓库目录结构。
        * 了解 `Navigation-Flat-Anymal-C-v0` 任务相关的文件结构。
    * **MotrixLab 基础**：
        * 了解 MotrixLab 仓库目录结构。
        * 了解 `GO1` 环境的结构（为后续迁移 Anymal C 做准备）。
* **实操任务**：
    1. 在 IsaacLab 中进行 `Navigation-Flat-Anymal-C-v0` 任务的训练和推理。
    2. 在 MotrixLab 中进行 Unitree GO1 示例任务的训练和推理。
    > *注意：记得多更换下模型训练、推理命令的参数，比如设置环境数，无头模式等。*
* **本周周报**：
    1. 两个平台任务跑通的截图。
    2. 仓库目录结构说明。
    3. 任务相关的文件结构说明。

### 第 2 周：深入理解 Navigation-Flat-Anymal-C-v0
* **学习目标**：拆解并完全理解 IsaacLab 中该任务的执行流程、配置与奖励机制。
* **核心内容**：
    * **环境基础结构**：
        * 环境注册：`config/anymal_c/__init__.py`（理解环境如何注册到 Gymnasium）。
        * 环境配置：`config/anymal_c/navigation_env_cfg.py`（理解 Actions, Observations, Rewards, Commands, Terminations 的作用）。
    * **策略与控制**：
        * 预训练策略动作：`mdp/pre_trained_policy_action.py`（理解层次化控制的实现原理）。
        * 低层环境配置：`locomotion/velocity/config/anymal_c/flat_env_cfg.py`（理解低层策略的观测和动作需求）。
    * **奖励与命令**：
        * 奖励函数：`mdp/rewards.py`（理解如何计算位置和朝向跟踪奖励）。
* **深入实操**：
    1. 研究低层策略的输入输出，理解为什么需要 `low_level_decimation`。
    2. 修改奖励函数，尝试不同的权重，观察其对训练的影响。
    3. 修改命令生成（改变目标位置范围、修改命令重采样时间）。
* **本周周报**（回答以下问题）：
    1. 为什么需要层次化控制？
    2. `low_level_decimation` 的作用是什么？
    3. 低层策略的观测从哪里来？
    4. 如何修改目标位置范围？
    5. **输出一个 episode 完整数据流的示意图**。

### 第 3 周：开始迁移（IsaacLab -> MotrixLab）
* **学习目标**：搭建最小可运行环境，理解 MotrixLab 对 Anymal C 的支持方式。
* **核心内容**：
    * **目录与资产准备**：
        * 创建标准的 MotrixLab 任务目录结构（包含 `__init__.py`, `cfg.py`, `anymal_c_np.py`, `xmls/` 等）。
        * 从 MuJoCo Menagerie 下载资产，学习 Body, Site, Geom, Joint 等组件概念。
    * **配置类迁移**：
        * 从 IsaacLab 的 `*_cfg.py` 提取参数，组织成嵌套的配置类。
        * 设置合理的默认值（使用 `field(default_factory=...)`）。
    * **环境类框架搭建 (`__init__`)**：
        * 获取关键 body、joint、actuator。
        * 定义动作/观测空间，初始化状态和缓冲区。
    * **核心方法实现**：
        * `apply_action` (动作处理)
        * `_compute_observation` (观测计算与空间对齐)
        * `_compute_reward` (奖励计算)
        * `_check_termination` (终止条件)
        * `reset` 与 `update_state`
* **本周周报**：
    * 提交环境框架及核心方法的代码文件。

### 第 4 周：完整迁移 & 复现结果
* **学习目标**：完成任务迁移、跑 RL 训练、复现导航行为。
* **核心内容**：
    * **功能调试**：排除迁移过程中的 bug。
    * **训练测试**：使用默认超参数尝试训练 PPO。
    * **数据分析**：看懂 TensorBoard 训练曲线，评估训练效果。
* **本周周报**：
    1. 迁移完成的完整任务代码文件。
    2. 训练日志或 TensorBoard 曲线的截图与解释说明。

---

## 🛠️ 云平台使用指南

本项目统一使用云服务器平台进行实操，已预装相关环境与依赖：
* **平台登录**：[Robogo Cloud Desktop](https://robogo.d-robotics.cc/cloud-desktop)
* **使用说明文档**：[飞书云平台指南](https://yv6uc1awtjc.feishu.cn/wiki/WL3ZwoviBiQ3SmkCXZtcPxQMnFb?from=from_copylink)
* **镜像选择**：⚠️ 必须选择 `xbotics-full-v2.5.1` 镜像。该镜像已预装 VS Code、IsaacLab 和 MotrixLab 项目代码（位于 `/opt` 目录下）。
* **快速启动**：
    1. **IsaacLab**：VS Code 打开 `/opt/IsaacLab`，依赖已安装在本地，直接运行命令即可。
    2. **MotrixLab**：VS Code 打开 `/opt/MotrixLab`，依赖使用 `uv` 管理，需使用 `uv run` 等相关命令运行。

---

## 📚 学习资源与参考文档

### 官方文档
* **IsaacLab 中文文档**：[学习基本使用方法](https://docs.robotsfan.com/isaaclab/source/tutorials/03_envs/create_manager_base_env.html)
* **MotrixLab 官方文档**：[学习基本使用方法](https://motrixlab.readthedocs.io/zh-cn/latest/)
* **MuJoCo 资产库**：[Google DeepMind Menagerie](https://github.com/google-deepmind/mujoco_menagerie)（*注：MotrixLab 支持 xml 格式，IsaacLab 使用 usd 格式*）

### 核心任务资料 (Navigation-Flat-Anymal-C-v0)
* IsaacLab 任务课程与文档：`anymal_c_navigation_flat_isaaclab.mp4`, `anymal_c_navigation_flat(1).pptx`
* MotrixLab 奖励设计讲解：`anymal_c_navigation_flat.mp4`
* 迁移任务代码与文档参考：`迁移任务代码和详细文档.zip`

### 🎁 进阶加餐任务
学有余力的同学可参考以下资料，了解更多任务的迁移：
1. **Franka Cabinet Direct v0**：
   * `Isaac-Franka-Cabinet-Direct-v0教程.pdf`, `视频.rar`, `franka_open_cabinet.mp4`
2. **Lift Cube Franka v0**：
   * `Isaac-Lift-Cube-Franka-v0 教程.pdf`, `任务.rar`, `franka_lift_cube.mp4`
3. **Repose Cube Shadow Direct v0**：
   * `isaac-repose-cube-shadow-direct-v0.pptx`, `ppt介绍.mp4`, `IsaacLab复现.mp4`, `isaac-Repose-cube-shadow-direct-v0.mp4`
4. **统一复现代码**：`MotrixLab.zip`
