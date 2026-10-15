# Demo 分析方法

> MotrixLab 开源了多种强化学习 demo，涵盖了基础控制、运动、操作、导航等任务。

从本节开始，我们进入 MotrixLab 强化学习的案例讲解部分。我们将首先介绍通用的分析方法，然后讲解具体案例，带领大家逐渐深化对 MotrixLab 与强化学习的理解。

---

## 一、分析一个 Demo 的通用方法

### 了解任务

了解任务，也就是首先我们要对 demo 做一个整体的了解，需要确定具体用什么机器人，在什么环境中，完成什么样的任务，实现怎么样的效果。

在 MotrixLab 的官方文档中，每一个 demo 都提供了任务的文字描述和预期效果视频，结合描述文字和预期视频对每个 demo 做整体的把握。

| 项目 | 复杂地形行走 | 抓取方块 |
|------|-------------|----------|
| **任务描述** | 训练机器人在具有挑战性的阶梯地形上实现稳定行走 | 训练机器人在桌面上抓取立方体并将其提升到指定目标位置 |
| **demo视频** | go1_stairs_terrain_walk.mp4 | franka_lift_cube.mp4 |

### 分解要素

读懂一个强化学习案例，最有效的方式就是按照强化学习的各个要素将案例进行分解。

强化学习的要素首先包含 5 个基本元素：**agent, env, obs, reward, action**。除此之外，我们需要还关注**初始状态和终止状态**（终止条件）。因为这两点直接关乎任务完成，我们需要明确任务是从什么情况下开始的并在什么情况下结束。

在实际实现中，为了增强策略的鲁棒性和泛化性，reset 时会对初始状态和任务目标进行一定的随机化，此操作被称为**域随机化**（Domain Randomization）。

综上，分析一个具体的 demo，就需要详细了解如下要素：

| 基本元素 | 解释 | 备注 |
|----------|------|------|
| 环境与 agent（组成场景） | agent 和环境构成了强化学习中的场景，agent 是我们要控制的机器人，环境就是机器人需要交互的对象 | |
| 观测 | 观测作为策略的输入，代表 agent 可以从场景中"看到"什么 | 所有观测的集合构成观测空间 |
| 动作 | 作为策略输出，是 agent 可以对场景做出的影响 | 所有动作的集合构成动作空间 |
| 奖励 | 这里专指环境提供的即时奖励，即每一步环境对 agent 的动作的反馈 | |
| 初始状态与终止状态/条件 | 初始状态是每一个回合开始时 agent 和环境处于的状态；终止条件：成功终止(success)、失败终止(terminated)、截断(truncated) | 有时成功可以不终止，保持成功直到超时截断 |
| 域随机化 | 对初始状态和环境参数、任务目标等进行一定范围的随机，以增强策略的鲁棒性 | |

### 深入代码

要想深入读懂案例，必然要深入代码进行详细分析。

**首先运行 demo 的示例命令。** MotrixLab 中每一个 demo 都可以使用如下的 4 个命令：

| 命令 | 含义 | 备注 |
|------|------|------|
| `uv run scripts/view.py --env 任务名` | 环境预览，直观查看任务的环境与机器人的运动 | |
| `uv run scripts/train.py --env 任务名 --render` | 开始训练，启动强化学习的训练并可通过可视化查看训练时的效果 | 去掉 `--render` 可减少计算量 |
| `uv run tensorboard --logdir runs/任务名` | 查看进度，使用 tensorboard 查看奖励曲线 | |
| `uv run scripts/play.py --env 任务名` | 测试结果，推理模型查看训练后的效果 | |

**代码分析。** 对 demo 代码进行分析的思路是查看强化学习的各个元素在代码中的具体实现，梳理清楚整个运行过程中各个模块的调用关系。

(1) 通用强化学习流程与 MotrixLab 的封装

```python
# 通用强化学习流程
env = create_env()               # 由任务环境实现
agent = create_agent()           # 由rl算法实现
obs, extra_info = env.reset()    # 由任务环境实现
for i in range(total_timesteps):
    action = agent.policy(obs)   # 由rl算法实现
    new_obs, reward, truncated, terminated, extra_info = env.step(action)
    if terminated.any() or truncated.any():    
        obs, extra_info = env.reset()
    when need_update_policy:
        agent.update_policy()    # 由rl算法实现
```

(2) MotrixLab 的 Env 基类与包装类

| 类 | 作用 |
|----|------|
| NpEnv | 各具体任务的基类；定义了 `apply_action()`、`update_state()`、`reset()` 三个抽象方法；使用 NpState 类封装单步交互信息；通过 `step()`、`_reset_done_envs()` 定义单步交互和环境重置 |
| 包装类 | 封装 NpEnv；内部调用 NpEnv 的 `__init__` 和 `step` 方法对外提供 `reset`, `step` 接口 |

(3) 具体任务环境的实现

各要素与代码查看方向的对应关系：

| 要素 | 代码查看方向 |
|------|-------------|
| 环境与 agent | `xml` 定义、`env.__init__()` |
| 观测 | `env.__init__()`、`env.observation_space`、`env.update_state()` |
| 动作 | `env.__init__()`、`env.action_space`、`env.apply_action(action)` |
| 奖励 | `env.update_state()` |
| 初始状态与终止条件 | `env.__init__()`、`env.reset()`、`env.update_state()` |
| 域随机化 | `env.reset()` |

---

## 二、如何从 demo 中提炼可复用的设计思路

MotrixLab 仓库中已经给出了各个 demo 任务的完整环境、可视化、强化学习的训练与推理代码。通过学习这些 demo 的具体实现，我们不仅可以了解已有的 demo 的实现方法，更能进一步提炼出可复用的设计思路。

| 提炼方向 | 细分内容 |
|----------|----------|
| 仿真场景搭建 | mjcf 的基本使用、场景中各元素的组合方法 |
| 状态获取与修改 | 如何获取机器人关节的角度/速度；获取目标物体的坐标；如何修改机器人的关节角度 |
| 常见机器人观测/动作空间 | 机械臂通常有 6 个关节 + 一个夹爪；机器狗通常有 4×3 个关节 |
| 常见任务的奖励函数 | reach 任务的奖励函数、grasp 任务的奖励函数等 |
| 新环境的通用设计结构 | 确定观测空间、动作空间和初始/终止状态、搭建新环境需要实现的要素 |
| 新环境的集成 | 环境的注册与可视化、集成 RL 算法库进行训练和推理 |
