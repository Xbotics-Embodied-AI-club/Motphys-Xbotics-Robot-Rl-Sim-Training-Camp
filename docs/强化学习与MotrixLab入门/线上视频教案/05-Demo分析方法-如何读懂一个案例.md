# Demo分析方法：如何读懂一个案例

> MotrixLab 开源了多种强化学习 demo，涵盖了基础控制、运动、操作、导航等任务。

从本节开始，我们进入 MotrixLab 强化学习的案例讲解部分。我们将首先介绍通用的分析方法，然后讲解具体案例，带领大家逐渐深化对 Motrixlab 与强化学习的理解。

---

## 一、分析一个 demo 的通用方法

### 了解任务

了解任务，也就是首先我们要对 demo 做一个整体的了解，需要确定具体用什么机器人，在什么环境中，完成什么样的任务，实现怎么样的效果。

在 motrixlab 的官方文档中，每一个 demo 都提供了任务的文字描述和预期效果视频，结合描述文字和预期视频对每个 demo 做整体的把握。

| | 任务名 | 任务描述 | demo视频 |
|:--:|:------:|:--------:|:--------:|
| 1 | 复杂地形行走 | 训练机器人在具有挑战性的阶梯地形上实现稳定行走 | go1_stairs_terrain_walk.mp4 |
| 2 | 抓取方块 | 训练机器人在桌面上抓取立方体并将其提升到指定目标位置 | franka_lift_cube.mp4 |

### 分解要素

读懂一个强化学习案例，最有效的方式就是按照强化学习的各个要素将案例进行分解。

我们知道强化学习的要素首先包含5个基本元素：**agent, env, obs, reward, action**。除此之外，我们需要还关注**初始状态和终止状态**（终止条件）。因为这两点直接关乎任务完成，我们需要明确任务是从什么情况下开始的并在什么情况下结束。

在实际实现中，为了增强策略的鲁棒性和泛化性，reset 时会对初始状态和任务目标进行一定的随机化，此操作被称为**域随机化**（Domain Randomization）。

综上，分析一个具体的 demo，就需要详细了解如下要素：

| 基本元素 | 解释 | 备注 |
|:-------:|:----:|:----:|
| 环境与 agent（组成场景） | agent 和环境构成了强化学习中的场景，agent 是我们要控制的机器人，环境就是机器人需要交互的对象 | |
| 观测 | 观测作为策略的输入，代表 agent 可以从场景中"看到"什么 | 所有观测的集合构成观测空间 |
| 动作 | 作为策略输出，是 agent 可以对场景做出的影响 | 所有动作的集合构成动作空间 |
| 奖励 | 这里专指环境提供的即时奖励，即每一步环境对 agent 的动作的反馈 | |
| 初始状态与终止状态/条件 | 初始状态是每一个回合开始时 agent 和环境处于的状态。终止条件：1. 成功终止 success；2. 失败终止 terminated；3. 截断 truncated | 有时成功可以不终止，保持成功直到超时截断 |
| 域随机化 | 对初始状态和环境参数、任务目标等进行一定范围的随机，以增强策略的鲁棒性 | |

**示例：复杂地形行走**
- 环境：阶梯状的地形
- agent：机器狗
- 观测：质心速度和各关节的角度
- 动作：各关节需要旋转到的角度
- 奖励：可以是和运动速度线性相关的函数
- 初始状态：处于站立姿态，所有线速度和角速度初始化为零
- 结束状态：机器狗能够稳定上下台阶
- 域随机化：调整初始线速度和角速度，期望机器狗的运动速度

**示例：抓取方块**
- 环境：地板、工作台、红色方块
- agent：机械臂
- 观测：夹爪和方块的空间坐标
- 动作：机械臂各关节需要到的角度
- 奖励：可以是方块和夹爪之间的距离相关的函数
- 初始状态：机械臂和方块处于初始的关节角度和位置
- 结束状态：方块被抓到指定位置
- 域随机化：机械臂初始各个关节的角度，方块的位置，期望方块被抓取的位置

### 深入代码

要想深入读懂案例，必然要深入代码进行详细分析。

- 首先运行 demo 的示例命令

MotirxLab 中每一个 demo 都可以使用如下的 4 个命令，供可视化预览、训练、查看进度以及测试结果。通过运行这些命令我们能在分析代码前，查看 demo 中强化学习的效果。

| 命令 | 含义 | 备注 |
|:---:|:----:|:----:|
| `uv run scripts/view.py --env 任务名` | 环境预览，直观查看任务的环境与机器人的运动 | |
| `uv run scripts/train.py --env 任务名 --render` | 开始训练，启动强化学习的训练并可通过可视化查看训练时的效果 | 去掉 --render 参数可减少计算量，加快训练速度 |
| `uv run tensorboard --logdir runs/任务名` | 查看进度，使用 tensorboard 查看奖励曲线 | |
| `uv run scripts/play.py --env 任务名` | 测试结果，推理模型查看训练后的效果 | |

- 代码分析

对 demo 代码进行分析的思路是查看强化学习的各个元素在代码中的具体实现，梳理清楚整个运行过程中各个模块的调用关系。

MotrixLab 代码库遵循模块化开发原则，将 rl 算法和任务环境分别独立构建为 motrix_rl 和 motrix_envs。motrix_rl 封装 rsl_rl、skrl 等 rl 算法库，并支持 jax、pytorch 不同运行后端。而 motrix_envs 设计 NpEnv 基类和 NpEnvState 数据类以规定不同任务之间的统一开发规范。

**(1) 通用强化学习流程与 MotrixLab 的封装**

我们首先来看通用强化学习的流程，理解 agent 和 env 交互循环，然后梳理 MotrixLab 中交互循环的具体实现，着重关注 env 的调用逻辑。

```python
# 通用强化学习流程
env = create_env()               # 由任务环境实现
agent = create_agent()            # 由 rl 算法实现
obs, extra_info = env.reset()     # 由任务环境实现
for i in range(total_timesteps):
    action = agent.policy(obs)    # 由 rl 算法实现
    new_obs, reward, truncated, terminated, extra_info = env.step(action)  # 由任务环境实现
    if terminated.any() or truncated.any():
        obs, extra_info = env.reset()
    when need_update_policy:
        agent.update_policy()     # 由 rl 算法实现

# 环境被反复调用的方法：reset, step

# reset
# 输入：无        输出：obs, extra_info
# 该方法内部将仿真环境重置到初始状态，并进行一定的域随机化

# step
# 输入：action    输出：new_obs, reward, truncated, terminated, extra_info
# 该方法内：
#   1. 执行输入的 action 以更改仿真的状态
#   2. 获取更新后的仿真状态以拿到 obs
#   3. 计算这一步的 reward
#   4. 计算是否 truncated, terminated
```

分析 MotrixLab 的运行流程可以发现，Env 包装类被实例化进行 agent 和 env 的交互循环，reset 和 step 是环境需要具备的方法。

**(2) MotrixLab 的 Env 基类与包装类**

| 类 | 作用 |
|:-:|:----:|
| NpEnv | - 各具体任务的基类<br>- 定义了 apply_action(), update_state(), reset() 三个抽象方法要求具体任务进行实现<br>- 使用 NpState 类封装 obs、reward、terminated、truncated、info 的单步交互信息<br>- 通过 step()、_reset_done_envs() 定义与实现单步交互和环境重置 |
| 包装类 | - 封装 NpEnv<br>- 内部调用 NpEnv 的 init_state 和 step 方法对外提供 reset, step 接口 |

**(3) 具体任务环境的实现**

MotrixLab 中各个任务环境的实现，均是继承 NpEnv，在运行中被实例化为 NpEnv 的子类。各个任务均实现 NpEnv 定义的 apply_action, update_state, reset 三个抽象方法，并在构造方法 `__init__()` 中定义相关环境信息。

| 通用接口 | 具体环境需实现的方法 | 说明 | 备注 |
|:-------:|:------------------:|:----:|:----:|
| 创建环境 | `__init__()` | 定义观测空间、动作空间维度，定义初始状态，仿真句柄等信息 | 基类 NpEnv.__init__() 实现了加载 xml 文件，创建仿真环境。子类需要补充其它信息的定义 |
| step(action) | apply_action(action) | 执行动作，改变仿真的状态 | - 超时截断由框架在 NpEnv.step() 实现<br>- terminated 是失败终止<br>- 成功终止不做结束，将一直保持成功状态，直至超时截断 |
| | update_state() | 获取执行动作后仿真的状态，这里计算 obs, reward, terminated | |
| reset() | reset() | 重置环境并进行域随机化 | |

MotrixLab 的运行不同的 demo 的流程是相同的，不同是根据 demo 的名称加载不同具体的环境实现。而各个 demo 环境实现均以上述方法的形式实现了强化学习各要素。分析 demo 代码时，我们需要将各要素与具体的代码进行一一对应，做到心中有数。

**要素与代码对应关系**

| 要素 | 代码查看方向 |
|:---:|:-----------:|
| 环境与 agent | - xml 定义<br>- env.__init__() |
| 观测 | - env.__init__()<br>- env.observation_space<br>- env.update_state() |
| 动作 | - env.__init__()<br>- env.action_space<br>- env.apply_action(action) |
| 奖励 | - env.update_state() |
| 初始状态与终止状态/条件 | - env.__init__()<br>- env.reset()<br>- env.update_state() |
| 域随机化 | - env.reset() |

**反过来看：**

| 代码查看方向 | 要素 |
|:-----------:|:----:|
| xml 定义 | 环境与 agent（组成场景） |
| env.__init__() | 观测、动作、初始状态 |
| env.reset() | 初始状态、域随机化 |
| env.apply_action() | 动作 |
| env.update_state() | 观测、奖励、终止条件 |
| env.observation_space | 观测 |
| env.action_space | 动作 |

---

## 二、如何从 demo 中提炼可复用的设计思路

motrixlab 仓库中已经给出了各个 demo 任务的完整环境、可视化、强化学习的训练与推理代码。通过学习这些 demo 的具体实现，我们不仅可以了解已有的 demo 的实现方法，更能进一步提炼出可复用的设计思路，为在 motrixlab 中举一反三搭建并解决新的强化学习任务提供基础。

| 提炼方向 | 细分内容 |
|:-------:|:--------:|
| 仿真场景搭建 | mjcf 的基本使用 |
| | 场景中各元素的组合方法 |
| 状态获取与修改 | 如何获取机器人关节的角度、速度；获取目标物体的坐标 |
| | 如何修改机器人的关节角度 |
| 常见机器人观测空间、动作空间 | 机械臂通常有 6 个关节 + 一个夹爪，动作空间可以是关节空间也可以是末端笛卡尔空间 |
| | 机器狗通常有 4×3 个关节，动作空间通常是关节空间 |
| 常见任务的奖励函数 | reach 任务的奖励函数 |
| | grasp 任务的奖励函数等 |
| 新环境的通用设计结构 | 确定机器人的观测空间、动作空间和初始状态、终止状态 |
| | 搭建新环境需要实现的要素 |
| 新环境的集成 | 环境的注册与可视化 |
| | 集成 rl 算法库进行训练、推理 |
