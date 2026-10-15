# 📚 课程概述

## 学习目标
学完本课程后，你将能够：
1. 理解训练环境「三位一体」的核心概念
2. 掌握 EnvCfg、Env、Reward 的职责划分
3. 学会阅读 MotrixLab 环境代码的正确方法
4. 能够独立排查训练中的常见问题

## 前置知识
- Python 基础（类、继承、装饰器）
- 强化学习基本概念（agent、environment、reward）
- 了解 PPO 算法（不需要深入）

---

## 第一章：训练环境的「三位一体」

### 1.1 核心概念
在机器人强化学习任务中，训练环境由**三个模块**组成：

```
┌─────────────────────────────────────────────────────┐
│                    训练环境                          │
├─────────────────────────────────────────────────────┤
│  EnvCfg  │  定义环境参数                             │
│  Env     │  执行环境流程                             │
│  Reward  │  计算学习信号                             │
└─────────────────────────────────────────────────────┘
```

### 1.2 一句话总结
> **EnvCfg 管参数，Env 管流程，Reward 管目标。**

### 1.3 为什么需要分离？
很多初学者会把所有逻辑写在一个大文件里，导致：
- ❌ 改参数要改代码
- ❌ 不同实验难以对比
- ❌ 代码难以复用和测试

分离的好处：
- ✅ 参数和逻辑分离，实验更灵活
- ✅ 同一环境，不同配置
- ✅ 方便调试和测试

---

## 第二章：EnvCfg——环境参数配置

### 2.1 什么是 EnvCfg？
`EnvCfg` 是环境配置类，描述**环境运行需要哪些参数**，以及这些参数的默认值。

### 2.2 EnvCfg 的典型内容
```python
from dataclasses import dataclass

@dataclass
class CartpoleCfg:
    # 模型配置
    model_file: str = "cartpole.xml"  # 机器人模型文件
    
    # 仿真参数
    sim_dt: float = 0.005  # 物理仿真步长（秒）
    ctrl_dt: float = 0.02   # 控制步长（秒）
    
    # 任务参数
    max_episode_seconds: int = 20      # 单个 episode 最大时长
    max_episode_steps: int = 1000      # 单个 episode 最大步数
    
    # 奖励配置
    reward_config: RewardConfig = None  # 奖励权重配置
    
    # 域随机化
    domain_rand_config: DomainRandCfg = None  # 随机化参数
    
    # 观测配置
    observation_config: ObsCfg = None  # 观测维度或开关
```

### 2.3 EnvCfg 的四大作用

**1. 配置集中化**
```python
# ❌ 硬编码
def step(self, action):
    max_steps = 1000
    if self.current_step > max_steps:
        ...

# ✅ 使用配置
def step(self, action):
    max_steps = self.cfg.max_episode_steps
    if self.current_step > max_steps:
        ...
```

**2. 实验可复现**
```python
# 同一配置 = 同一组实验条件
@dataclass
class CartpoleHighGravityCfg(CartpoleCfg):
    gravity: float = 20.0  # 高重力版本
```

**3. 便于运行时覆盖**
```bash
# 命令行覆盖参数
python train.py --env_cfg_override max_episode_steps=500
```

**4. 便于注册**
```python
from motrix_envs.registry import envcfg

@envcfg("cartpole")
@dataclass
class CartpoleCfg:
    model_file: str = "cartpole.xml"
    # ...
```

---

## 第三章：Env——环境执行流程

### 3.1 Env 的职责
`Env` 是环境主体，负责把**配置、动作、仿真、观测、奖励、终止条件**串起来。

### 3.2 Env 的典型职责
```python
class CartpoleEnv:
    def __init__(self, cfg: CartpoleCfg):
        self.cfg = cfg
        # 1. 读取 EnvCfg
        # 2. 加载模型
        # 3. 创建仿真后端
        # 4. 初始化状态
        
    def reset(self):
        # 1. 生成初始状态
        # 2. 添加随机性
        # 3. 返回初始 observation
        
    def step(self, action):
        # 1. 接收策略 action
        # 2. 处理动作（clip/scale/mapping）
        # 3. 写入控制接口
        # 4. 推进物理仿真
        # 5. 读取机器人状态
        # 6. 构造 observation
        # 7. 调用 Reward 计算奖励
        # 8. 判断 terminated/truncated
        # 9. 返回 (obs, reward, done, info)
```

### 3.3 强化学习交互核心
```
policy 输出 action
    ↓
Env 执行 action
    ↓
仿真推进状态
    ↓
Env 返回 observation / reward / done / info
    ↓
算法用这些数据更新 policy
```

### 3.4 阅读 Env 代码的正确顺序
很多同学喜欢从头看到尾，这是**错误的方法**！正确的顺序是：

```
1. __init__              → 保存了哪些 cfg，创建了哪些对象
2. reset                  → 初始状态如何生成，随机性在哪里
3. step                   → 动作如何进入环境
4. action 处理            → 动作含义、缩放、裁剪、映射
5. simulation step        → 仿真推进频率和调用位置
6. observation            → 策略到底看到了什么
7. reward                 → reward 由谁计算，用了哪些状态
8. termination            → 什么时候 done，什么时候 timeout
```

### 3.5 重点检查清单
阅读 Env 代码时，务必确认：
- [ ] `action` 维度是否和策略输出一致
- [ ] `action` 含义是否和控制器一致
- [ ] `observation` 是否包含完成任务所需信息
- [ ] `reward` 是否使用了正确状态
- [ ] `done` 条件是否会过早重置
- [ ] `reset` 后状态是否和 `observation`/`reward` 假设一致
