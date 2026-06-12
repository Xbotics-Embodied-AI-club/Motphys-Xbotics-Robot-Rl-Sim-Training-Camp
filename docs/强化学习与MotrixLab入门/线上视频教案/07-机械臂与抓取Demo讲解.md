# 机械臂与抓取 Demo 讲解

> 在掌握了基础控制任务（如倒立摆、单摆）后，我们将进入强化学习在机器人领域的重要应用场景——**机械臂控制**。

---

## 一、机械臂控制任务

### （1）机械臂与控制任务

机械臂是一种模拟人类手臂动作的机械装置，通常由多个连杆和关节串联组成，并在最末端配备**末端执行器**（End-effector，如夹爪、吸盘）。

以经典的科研级机械臂 Franka Emika Panda 为例，这是一个典型的 7 自由度（7-DoF）冗余机械臂系统：

| 组成部分 | 说明 |
|:-------:|:----:|
| 基座（Base） | 固定在地面或工作台上的基准原点 |
| 7 个旋转关节（Joint 1-7） | Joint 1~4：构成肩部和臂部，负责大范围的空间移动；Joint 5~7：构成手腕部，负责末端姿态的精细调整 |
| 夹爪（Gripper） | 双指平行夹爪，包含左、右两个平移关节（finger_joint1/2）；TCP 工具中心点位于夹爪的中心位置 |

Motrixlab 提供了从简单到复杂、涵盖不同机械臂本体和物理交互形式的任务环境：

| 任务名 | 目标 | 机器人 | 任务特点 |
|:-----:|:----:|:------:|:--------:|
| 双关节到达 | 控制机械臂末端精确到达并停留在指定的空间坐标点 | 双关节机械臂 | 最基础的机械臂任务，仅涉及二维平面内的运动，无物理接触 |
| 乒乓球颠球 | 使用球拍将乒乓球连续向上击打，保持球在空中不落地 | 配天 AIR4-560 6自由度工业机械臂 | 强调高动态响应与速度/时序控制 |
| 抓取立方体 | 移动至方块上方，闭合夹爪抓取方块，并将其举起到指定高度 | Franka 7轴机械臂 | 典型的刚体接触任务，包含到达、抓取、举起多个阶段 |
| 开抽屉 | 准确勾住或抓住抽屉把手，向外施力拉开抽屉至指定深度 | RM65 六轴机械臂 | 运动轨迹必须符合抽屉的物理滑轨约束 |

### （2）机械臂控制任务的 RL 核心难点

#### 庞大的状态空间

**状态空间**：观测必须包含本体特征（各关节角度、角速度）、末端特征（TCP 位置、姿态）、目标物体特征（方块的位置、姿态）以及它们之间的相对几何关系。

**初始状态敏感性**：不同的初始位姿会对任务成功率产生巨大影响，训练中往往需要引入域随机化来提升策略鲁棒性。

#### 多样的动作设计

机械臂任务通常需要同时控制 6-8 个维度的动作。动作维度的增加会导致探索空间呈指数级膨胀。

**机械臂本体的三个控制维度：**

| 控制维度 | 内容 | 说明 |
|:-------:|:----:|:----:|
| 关节空间 vs 笛卡尔空间 | 关节控制 | agent 直接输出对每个具体关节的控制指令，最贴近底层物理硬件 |
| | 末端控制 | Agent 输出末端 TCP 在三维空间中的 6 维位姿，通过逆运动学（IK）解算为各关节指令，更符合人类操作直觉 |
| 位置、速度 vs 力矩 | 位置控制 | 直接指定目标位置，底层 PD 控制器负责计算力矩，在强化学习中最常用、最容易收敛 |
| | 速度控制 | 指定各关节或末端的运动速度，适用于连续且平滑的轨迹跟踪 |
| | 力矩控制 | 直接输出电机力矩，难度最高，但能实现最柔顺的接触力控制 |
| 绝对控制 vs 增量控制 | 绝对控制 | 每次输出一个全局坐标或绝对角度 |
| | 增量控制 | 每次输出相对于当前状态的微小偏移量。在强化学习中往往表现更好，能有效缩小探索范围，大幅降低学习难度 |

**本体与末端执行器的异构控制：**
- 关节类型不同：机械臂本体是旋转关节，夹爪是平移关节
- 动作映射逻辑不同：本体和夹爪需要完全不同的控制逻辑（如本体用笛卡尔增量控制，夹爪用二元开闭控制）

#### 多阶段奖励调优

机械臂任务通常包含多个存在因果依赖的阶段：

- **稀疏奖励失效**：只有当方块被举起时才给奖励，Agent 极难在随机探索中偶然完成一连串正确动作
- **多阶段奖励复杂平衡**：必须为每个阶段设计连续稠密奖励，阶段转换往往是训练的瓶颈（"卡点"）
- **防止奖励作弊**：如果"接近"奖励太高而"抓取"奖励太小，Agent 可能学到一直悬停在方块正上方蹭接近奖励

---

## 二、抓取 Demo 讲解（Franka Lift Cube）

### 了解任务

Franka 抓取立方体任务环境基于 Franka 7 自由度机械臂构建，旨在训练机器人在桌面上抓取立方体并将其提升到指定目标位置。

机器人需要完成以下操作目标：
- **接近目标**：从初始位置移动到立方体位置
- **抓取立方体**：闭合夹爪抓取立方体
- **提升立方体**：将立方体提升到目标高度
- **精确定位**：将立方体移动到指定的目标位置（XYZ 三维坐标）

### 分解要素

| 要素 | 说明 |
|:---:|:----:|
| 环境 | 棕色工作台上放置一个立方体和机械臂 |
| agent | franka 机械臂 |
| 观测 | 1. 关节角度（9 维）<br>2. 关节速度（9 维）<br>3. 立方体当前位姿（9 维）<br>4. 目标位置命令（7 维）<br>5. 上一时刻动作（8 维） |
| 动作 | - 本体 7 维旋转关节使用位置控制模式：目标关节角度 = 当前关节角度 + 动作值<br>- 夹爪使用二元开闭控制：Sigmoid 映射 + 伯努利采样 |
| 奖励 | 1. 接近奖励（权重：1.5）<br>2. 提升奖励（权重：30）<br>3. 目标跟踪奖励（粗跟踪、精细跟踪、接近奖励等多项）<br>4. 动作变化率惩罚<br>5. 关节速度平方和惩罚 |
| 初始状态与终止条件 | **初始状态**：机器人位置和速度初始化，立方体位置初始化<br>**提前终止**：方块从桌子上掉落，机械臂关节速度过大，方块的速度过大 |
| 域随机化 | - 机械臂每个关节角度在 [-0.125, 0.125] 弧度范围内添加均匀随机噪声<br>- 立方体在桌面上的位置随机采样<br>- 目标位置在以下范围内随机采样 |

### 深入代码

**Agent 与环境**：
```python
# cfg.py
model_file = os.path.dirname(__file__) + "/xmls/mjx_scene.xml"

@registry.envcfg("franka-lift-cube")
class FrankaLiftCubeEnvCfg(EnvCfg):
    model_file: str = model_file

# franka_lift_cube_np.py
@registry.env("franka-lift-cube", "np")
class FrankaLiftCubeEnv(NpEnv):
    _cfg: FrankaLiftCubeEnvCfg

    def __init__(self, cfg: FrankaLiftCubeEnvCfg, num_envs: int = 1):
        super().__init__(cfg, num_envs=num_envs)
        self._num_dof_pos = 9
        self._num_dof_vel = 9
        self._cube = self._model.get_geom("cube")
        self._body = self._model.get_body("link0")
        self.hand = self._model.get_site("gripper")
```

**观测**（36 维）：
```python
def _compute_observation(self, data: mtx.SceneData, info: dict):
    dof_pos_rel = self._get_joint_pos_rel(data.dof_pos)     # 9D
    dof_vel_rel = self._get_joint_vel_rel(data.dof_vel)     # 9D
    object_pick_pose = self._cube.get_pose(data)             # 9D
    object_lift_pos = info["commands"]                       # 7D
    last_actions = info["current_actions"]                   # 8D
    obs = np.concatenate([dof_pos_rel, dof_vel_rel,
                          object_pick_pose, object_lift_pos, last_actions], axis=-1)
```

**动作**（8 维）：
```python
def apply_action(self, actions: np.ndarray, state: NpEnvState):
    # 机械臂本体：增量位置控制
    old_joint_pos = self.get_dof_pos(state.data)[:, : self._action_dim - 1]
    new_joint_pos = actions[:, : self._action_dim - 1] + old_joint_pos  # action as offset

    # 夹爪：Sigmoid + 伯努利采样
    probabilities = 1 / (1 + np.exp(-actions[:, -1]))
    sampled_gripper_action = np.where(
        probabilities > np.random.rand(*probabilities.shape), 0, 0.04
    )[:, None]  # Close 0, Open 0.04

    new_pos = np.concatenate([new_joint_pos, sampled_gripper_action], axis=-1)
    cliped_new_pos = np.clip(new_pos, self.joint_pos_min_limit, self.joint_pos_max_limit)
    state.data.actuator_ctrls = cliped_new_pos
    return state
```

**奖励（修改后版本，含进度奖励和静止奖励）**：
```python
def _compute_reward(self, state: NpEnvState, truncated: np.ndarray):
    hand_pos = self.hand.get_pose(state.data)[:, :3]
    cube_pos = self._cube.get_pose(state.data)[:, :3]
    hand_cube_distance = np.linalg.norm(cube_pos - hand_pos, axis=-1)

    # 接近奖励
    reach_reward = 1 - np.tanh(hand_cube_distance / 0.1)

    # 提升奖励
    lift_height = cube_pos[:, 2]
    lifted = lift_height > 0.04

    # 目标跟踪
    object_command_dist = np.linalg.norm(cube_pos - state.info["commands"], axis=-1)
    command_progress = object_command_dist / state.info["command_cube_max_length"]
    command_progress_reward = (1 - np.tanh(command_progress / 0.4))
    command_tracking_reward = (1 - np.tanh(object_command_dist / 0.3)) * lifted * (hand_cube_distance < 0.02)
    command_reaching_reward = (1 - np.tanh(object_command_dist / 0.05)) * (object_command_dist < 0.3) * (hand_cube_distance < 0.02)

    # 惩罚项
    action_diff_sq = np.sum(np.square(state.info["current_actions"] - state.info["last_actions"]), axis=-1)
    joint_vel_sq = np.sum(np.square(self.get_dof_vel(state.data)[:, :self._num_dof_vel]), axis=1)

    # 到达目标后静止奖励
    end_still_reward = (1 - np.tanh(joint_vel_sq / 0.4)) * (object_command_dist < 0.04)

    # 奖励权重
    reward = (
        1.0 * reach_reward
        + 10 * lifted * (hand_cube_distance < 0.05)
        + 100 * command_progress_reward * lifted
        + 20 * command_tracking_reward
        + 220 * command_reaching_reward
        - action_penalty_weight * action_diff_sq
        - joint_vel_penalty_weight * joint_vel_sq
        - 1e-2 * joint_dof_sq
        + 50 * end_still_reward
    )
```

**初始状态与域随机化**：
```python
def reset(self, data: mtx.SceneData):
    # 机械臂初始关节角度噪声
    noise_pos = np.random.uniform(-0.125, 0.125, self._num_dof_pos)
    robot_dof_pos = self._init_dof_pos + noise_pos

    # 立方体位置域随机化
    pos_x = np.random.uniform(-0.1, 0.1)
    pos_y = np.random.uniform(-0.25, 0.25)
    cube_pos = np.array([0.5 + pos_x, 0 + pos_y, 0.02])

    # 目标位置域随机化
    command = self._generated_commands(num_reset)

    data.reset(self._model)
    data.set_dof_pos(scene_dof_pos, self._model)
    data.set_dof_vel(scene_dof_vel)
```

**终止条件**：
```python
def _check_termination(self, state: NpEnvState):
    cube_height = self._cube.get_pose(state.data)[:, 2]
    truncated = cube_height < -0.05  # 方块掉落

    joint_vel = self.get_dof_vel(state.data)
    truncated = np.logical_or(truncated, np.abs(joint_vel).max(axis=-1) > 10)  # 关节速度过大

    cube_vel = self._cube.get_linear_velocity(state.data)
    truncated = np.logical_or(truncated, np.abs(cube_vel).max(axis=-1) > 10)  # 方块速度过大
```

### 奖励函数设计总结

| 任务类型 | 奖励函数设计逻辑 |
|:-------:|:---------------:|
| reach | 使用距离，距离越小，奖励越大，可以使用 tanh 进行拉伸 |
| grasp/lifted | 当 TCP 中心和目标物体的距离远时，鼓励张开夹爪，距离近时鼓励闭合 |
