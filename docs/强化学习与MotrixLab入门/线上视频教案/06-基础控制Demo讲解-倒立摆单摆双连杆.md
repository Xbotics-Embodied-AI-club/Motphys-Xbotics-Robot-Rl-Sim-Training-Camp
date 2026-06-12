# 基础控制 Demo 讲解：倒立摆 / 单摆 / 双连杆

> 本节内容讲解基础控制任务：倒立摆 / 单摆 / 双连杆，剖析强化学习中"小规模状态空间与动作空间"的典型设计思路。

在强化学习与机器人控制领域，无论是机器狗灵活运动，还是灵巧手复杂操作，其底层的物理交互逻辑皆根植于经典力学。在迈向高维复杂系统之前，我们先回归基础任务，研究**倒立摆**（CartPole）、**单摆**（Pendulum）和**双连杆**（Acrobot）三个经典的入门案例。它们凭借"低维度、高效率"的特点，使我们很容易的理解强化学习的各个基础要素，梳理清楚 MotrixLab 强化学习的运行过程。

## 一、基础控制任务的特点

基础控制任务不涉及复杂的视觉信息（如 RGB 图像、点云）与复杂的机械结构，仅包含最简单的物理结构与纯粹的刚体动力学，初学者可以很容易理解这些系统的运行逻辑和任务目标，为后续研究更加复杂的机器人系统提供了很好的铺垫。整体来讲，作为强化学习与机器人领域的入门任务，基础控制任务具有低维度、高效率的特点。

## 二、任务环境详解

### 倒立摆 (CartPole)

#### 1. 了解任务

**任务描述**：一根杆子通过铰链连接在小车上。智能体需要通过给小车施加左右方向的力，让杆子保持直立不倒。

预期训练结果：
- 杆子角度大部分时间保持在 ±5 度以内
- Episode 时长接近或超过 10 秒
- 小车在合理范围内移动以保持平衡

倒立摆任务可被称为 RL 界的 "Hello World"，是几乎所有强化学习研究人员接触的第一个环境。由于它的状态维度低、动力学极其简单且奖励机制非常密集，可以在极短的时间完成训练和测试。

#### 2. 分解要素

| 要素 | 说明 |
|:---:|:----:|
| 环境 | 一根紫色横杆作为小车的轨道，一根杆子通过铰链连接在小车上 |
| agent | agent 输出一个浮点数，代表施加在小车水平方向上的力 |
| 观测 | **(4D 连续)**：`Box(-inf, inf, (4,))`。包含：小车位置、杆子角度、小车速度、杆子角速度 |
| 动作 | **(1D 连续)**：`Box(-3.0, 3.0, (1,))`。智能体输出一个浮点数，代表施加在小车水平方向上的力（最小值 -3.0，最大值 3.0） |
| 奖励 | 每坚持 1 步不倒下，获得固定奖励 `+1.0`（存活奖励） |
| 初始状态与终止条件 | **初始状态**：小车初始位置 0.0 米（中心位置），杆子初始角度 0.0 弧度（直立），初始速度均为 0。<br>**提前终止**：杆子角度超过 ±0.2 弧度（约 ±11.5 度），小车位置超出 [-0.8, 0.8] 米范围，杆子角度出现 NaN 值<br>**时长限制**：Episode 最大时长 10 秒，控制频率 100hz，共 1000 步 |
| 域随机化 | 在初始状态上添加小幅随机噪声（`reset_noise_scale = 0.01`） |

#### 3. 代码分析

**环境与 agent**：使用 Motrixsim 自带的交互式查看器 `uv run python -m motrixsim.interactive_viewer` 将 xml 拖入界面中查看。

**Agent**：关节总数 2，执行器数目 1
```python
# cfg.py
model_file = os.path.dirname(__file__) + "/cartpole.xml"
@registry.envcfg("cartpole")
class CartPoleEnvCfg(EnvCfg):
    model_file: str = model_file

# cartpole_np.py
@registry.env("cartpole", "np")
class CartPoleEnv(NpEnv):
    def __init__(self, cfg: CartPoleEnvCfg, num_envs: int = 1):
        super().__init__(cfg, num_envs=num_envs)
        self._num_dof_pos = self._model.num_dof_pos  # 关节总数：2
        self._num_dof_vel = self._model.num_dof_vel  # 执行器数目：1
```

**观测**：
```python
def __init__(self, cfg: CartPoleEnvCfg, num_envs: int = 1):
    self._observation_space = gym.spaces.Box(-np.inf, np.inf, (4,), dtype=np.float32)

def update_state(self, state: NpEnvState):
    data = state.data
    dof_pos = data.dof_pos  # 小车位置, 杆子角度
    dof_vel = data.dof_vel  # 小车速度, 杆子角速度
    obs = np.concatenate([dof_pos, dof_vel], axis=-1)  # 4维向量
```

**动作**：
```python
def __init__(self, cfg: CartPoleEnvCfg, num_envs: int = 1):
    self._action_space = gym.spaces.Box(-3.0, 3.0, (1,), dtype=np.float32)

def apply_action(self, actions: np.ndarray, state: NpEnvState):
    state.data.actuator_ctrls = actions  # 1维向量(水平方向的力)
    return state
```

**奖励**：
```python
def update_state(self, state: NpEnvState):
    reward = np.ones((self._num_envs,), dtype=np.float32)
    # 每坚持 1 步不倒下，获得固定奖励 +1.0（存活奖励）
```

**初始状态**：
```python
def reset(self, data: mtx.SceneData):
    dof_pos = np.tile(self._init_dof_pos, (*data.shape, 1)) + noise_pos
    dof_vel = np.tile(self._init_dof_vel, (*data.shape, 1)) + noise_vel
    data.reset(self._model)
    data.set_dof_vel(dof_vel)
    data.set_dof_pos(dof_pos, self._model)
    obs = np.concatenate([dof_pos, dof_vel], axis=-1)
    return obs, {}
```

**终止条件**：
```python
def update_state(self, state: NpEnvState):
    cart_pos = dof_pos[:, 0]
    angle = dof_pos[:, 1]
    terminated = np.logical_or(np.isnan(angle), np.abs(angle) > 0.2)
    terminated = np.logical_or(cart_pos < -0.8, terminated)
    terminated = np.logical_or(cart_pos > 0.8, terminated)
```

**域随机化**：
```python
@registry.envcfg("cartpole")
@dataclass
class CartPoleEnvCfg(EnvCfg):
    reset_noise_scale: float = 0.01

# cartpole_np.py
class CartPoleEnv(NpEnv):
    def reset(self, data: mtx.SceneData):
        cfg: CartPoleEnvCfg = self._cfg
        noise_pos = np.random.uniform(-cfg.reset_noise_scale, cfg.reset_noise_scale,
                                       (*data.shape, self._num_dof_pos))
        noise_vel = np.random.uniform(-cfg.reset_noise_scale, cfg.reset_noise_scale,
                                       (*data.shape, self._num_dof_vel))
        dof_pos = np.tile(self._init_dof_pos, (*data.shape, 1)) + noise_pos
        dof_vel = np.tile(self._init_dof_vel, (*data.shape, 1)) + noise_vel
```

---

### 单摆 (Pendulum)

#### 1. 了解任务

单关节摆起并倒立保持任务，单摆由一段杆体和一个铰接关节组成，关节由单个电机驱动。目标是用一个电机扭矩把摆甩起并稳定在倒立位置。

预期训练结果：
- 摆能主动摆起并停留在倒立附近
- 倒立处的震荡由角速度与控制变化惩罚抑制

#### 2. 分解要素

| 要素 | 说明 |
|:---:|:----:|
| 环境 | 一段杆体和一个铰接关节组成单摆 |
| agent | 铰链的驱动电机 |
| 观测 | **(3D 连续)**：`Box(-inf, inf, (3,))`。包含：角度的 cos(θ)、sin(θ)、角速度。（因为原始角度在 π 和 π+2kπ 之间存在数值突变，使用三角函数可以保证状态空间的连续性） |
| 动作 | **(1D 连续)**：`Box(-1.0, 1.0, (1,))`。代表电机施加的扭矩 |
| 奖励 | - 倒立奖励：鼓励角度倒立<br>- 能量 shaping：能量接近倒立位置<br>- 惩罚：角速度²、ctrl²、(ctrl - prev_ctrl)²，抑制震荡与过猛动作 |
| 初始状态与终止条件 | **初始状态**：角度随机于 [-π, π]，控制历史 prev_ctrl 初始化为 0<br>**提前终止**：仅 NaN 检查<br>**时长限制**：Episode 长度由 max_episode_seconds 限制 |
| 域随机化 | 角度随机于 [-π, π]，在初始状态上对角速度添加小噪声 |

#### 3. 代码分析

**Agent**：关节总数 1，执行器数目 1

**观测**：
```python
def update_state(self, state: NpEnvState):
    dof_pos = data.dof_pos  # 关节角度
    dof_vel = data.dof_vel  # 关节角速度
    angle = dof_pos[:, 0]
    ang_vel = dof_vel[:, 0]
    obs = np.stack([np.cos(angle), np.sin(angle), ang_vel], axis=-1)
```

**动作**：
```python
def apply_action(self, actions: np.ndarray, state: NpEnvState):
    actions = np.clip(actions, -1.0, 1.0)
    scaled = self._action_low + (actions + 1.0) * 0.5 * (self._action_high - self._action_low)
    state.data.actuator_ctrls = scaled
    return state
```

**奖励**（精心设计的加权和）：
```python
def update_state(self, state: NpEnvState):
    # 角度标准化 (Angle Wrapping)
    angle_wrapped = (angle + np.pi) % (2 * np.pi) - np.pi

    upright = (1.0 + np.cos(angle_wrapped)) * 0.5  # 直立奖励
    ctrl = data.actuator_ctrls[:, 0]                # 当前动作
    prev_ctrl = state.info.get("prev_ctrl", np.zeros_like(ctrl))
    ctrl_delta = ctrl - prev_ctrl                   # 平滑度
    vel_penalty = 0.2 * (ang_vel**2)                # 速度惩罚

    # 能量奖励
    energy = 0.5 * ang_vel**2 + (1.0 + np.cos(angle_wrapped))
    energy_target = 2.0
    energy_reward = reward_utils.tolerance(
        energy, bounds=(energy_target, energy_target), margin=2.0,
        value_at_margin=0.1, sigmoid="gaussian",
    )

    reward = (3.0 * upright + energy_reward - vel_penalty
              - 0.001 * ctrl**2 - 0.001 * ctrl_delta**2).astype(np.float32)
```

最终奖励各部分：
- **3.0 * upright**：姿态分（权重最大，引导身体保持垂直）
- **energy_reward**：能量分（引导系统将能量维持在直立所需的水平）
- **vel_penalty**：速度惩罚（防止高速转动）
- **0.001 * ctrl²**：能耗惩罚（鼓励用最小的力气完成任务）
- **0.001 * ctrl_delta²**：平滑度惩罚（惩罚高频震荡）

**tolerance 容差函数**：它将物理世界中各种连续状态（距离、角度、能量等），转化为位于 [0, 1] 之间的平滑奖励信号。相比二元稀疏奖励（只有刚好命中目标才给分），tolarence 函数用高斯函数建模，把一个"硬性"的目标区间变成平滑过渡的"软性"奖励山峰。

---

### 双连杆（Acrobot）

#### 1. 了解任务

Acrobot（杂技机器人）是模拟体操运动员在单杠上的动作的任务。这是一个欠驱动系统，有两个可以运动的关节，包含上下两段手臂，但**只有肘关节配置了电机**（肩关节是被动的）。智能体需要通过单独控制肘部电机的扭矩，把原本下垂的双臂甩起，使得末端到空中的目标区域。

期望效果：
- Acrobot 能够摆动双臂到达目标位置
- 末端能够稳定地停留在目标区域内
- 过高的震荡通过速度惩罚得到减少
- 策略能够以平滑的动作高效地接近目标

#### 2. 分解要素

| 要素 | 说明 |
|:---:|:----:|
| 环境 | 两端杆体，一个杆体一端固定于一个铰链（可旋转但无动力），另一端的铰链有动力并连接第二个杆体 |
| agent | 安装在肘关节处的电机 |
| 观测 | **(6D 连续)**：`Box(-inf, inf, (6,))`。包含：上臂与下臂的水平投影（2个）、上臂与下臂的垂直投影（2个）、肩关节角速度、肘关节角速度 |
| 动作 | **(1D 连续)**：`Box(-1.0, 1.0, (1,))`。仅控制肘关节的扭矩 |
| 奖励 | - 基础稀疏奖励：鼓励末端进入目标区域（半径 = 0.2）<br>- 持续奖励：在目标区域内每步提供 0.1 的奖励<br>- 距离奖励：0.3 × (1.0 - clip(distance / 2.0, 0, 1.0)) 鼓励向目标移动<br>- 速度惩罚：0.01 × max(0, velocity_magnitude - 2.0) 惩罚过高的速度 |
| 初始状态与终止条件 | **初始状态**：肩关节角度随机于 [-π, π]，肘关节角度随机于 [-π, π]，角速度初始化为零<br>**提前终止**：仅 NaN 检查<br>**时长限制**：Episode 长度由 max_episode_seconds 限制 |
| 域随机化 | 肩关节角度随机于 [-π, π]，肘关节角度随机于 [-π, π] |

#### 3. 代码分析

**观测**：
```python
def _get_obs(self, data: mtx.SceneData) -> np.ndarray:
    dof_pos = data.dof_pos
    shoulder_angle = dof_pos[:, 0]
    elbow_angle = dof_pos[:, 1]

    upper_arm_horizontal = np.cos(shoulder_angle)
    upper_arm_vertical = np.sin(shoulder_angle)
    total_angle = shoulder_angle + elbow_angle
    lower_arm_horizontal = np.cos(total_angle)
    lower_arm_vertical = np.sin(total_angle)
    dof_vel = data.dof_vel

    obs = np.concatenate([
        upper_arm_horizontal.reshape(-1, 1),
        lower_arm_horizontal.reshape(-1, 1),
        upper_arm_vertical.reshape(-1, 1),
        lower_arm_vertical.reshape(-1, 1),
        dof_vel,
    ], axis=-1)
    return obs
```

**奖励**（稀疏 + 稠密混合）：
```python
def update_state(self, state: NpEnvState):
    tip_pos = self._tip.get_pose(data)
    target_pos = self._target.get_pose(data)
    dist_to_target = np.linalg.norm(tip_pos[:, :3] - target_pos[:, :3], axis=-1)

    # 基础稀疏奖励（margin=0 → 阶跃函数，没进圈=0分，进了圈=1分）
    base_rwd = reward.tolerance(dist_to_target, bounds=(0, self._target_radius),
                                margin=0, value_at_margin=0.0, sigmoid="linear")

    in_target = dist_to_target < self._target_radius
    continuous_reward = 0.1 * in_target

    # 连续引导性奖励
    distance_reward = 0.3 * (1.0 - np.clip(dist_to_target / 2.0, 0, 1.0))

    # 速度惩罚
    dof_vel = data.dof_vel
    vel_magnitude = np.mean(np.abs(dof_vel), axis=-1)
    velocity_penalty = 0.01 * np.maximum(0, vel_magnitude - 2.0)

    rwd = base_rwd + continuous_reward + distance_reward - velocity_penalty
```

用 distance_reward 牵引方向，用 base_rwd 确认成功，用 velocity_penalty 规范行为。单步奖励最大为 1.4。

---

## 三、小规模状态空间与动作空间分析

尽管倒立摆、单摆和双连杆都属于极低维度的基础任务，但它们绝不是简单的重复。这三个环境层层递进，不仅涵盖了机器人控制中的真实问题，更为我们展现了在强化学习中设计状态（State）与动作（Action）空间的典型思路。

### 三大任务的控制难点与异同点剖析

**共同面临的真实控制难点：**
- **开环不稳定性**：系统在缺乏持续且精准的外部控制时，会迅速偏离目标状态
- **欠驱动特性**：系统的控制输入维度少于其自由度（倒立摆 2 个自由度 1 个输入，双连杆 2 个自由度 1 个输入）
- **非线性动力学**：包含旋转关节的系统，其运动涉及非线性耦合

### 小规模状态空间的设计总结

- **必须包含"位置"与"速度"**：仅有位置/角度是不够的，为了让智能体判断系统未来的运动趋势，状态空间中必须同时包含位置信息和速度信息
- **连续周期量的几何编码**：当关节可以在 [-π, π] 之间连续旋转时，直接输入角度会有数值跳变（从 π 跳到 -π），典型做法是将标量角度 θ 拆解为 cos(θ) 和 sin(θ) 两个维度

### 小规模动作空间的设计总结

- **归一化与裁剪**：策略通常输出处于 [-1.0, 1.0] 的标准区间，在环境内部通过线性映射转换为真实的物理控制量
- **连续动作 vs 离散动作**：连续控制允许输出更平滑、微小的调节力矩，在机器人底层运动控制中不可或缺

> 基础控制任务虽然结构极简，但其对于状态变量的选择、数值跳变的处理、以及动作的归一化映射，完全可以直接套用在数十个自由度的四足机器狗或人形机器人身上。理解了这三个任务，就相当于掌握了机器人强化学习环境搭建的通用范式。
