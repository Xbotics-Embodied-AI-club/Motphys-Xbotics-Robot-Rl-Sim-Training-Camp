# 训练流程

## 命令行启动训练

典型命令：
```bash
uv run scripts/train.py --env cartpole
uv run scripts/train.py --env cartpole --render --num-envs
```

### 入口与参数
`train.py` 用 `absl.flags` 定义 CLI 参数，主要包括：
- `--env`：环境名称（必填）
- `--train-backend`：训练后端（jax / torch）
- `--sim-backend`：仿真后端（默认 np）
- `--num-envs`：并行环境数
- `--seed` / `--rand-seed`：随机种子
- `--render`：是否可视化训练

---

## 配置解析、环境创建、训练执行

### 配置解析（双层注册表）

MotrixLab 有**环境配置**和**RL 训练配置**两套注册机制。

#### 环境侧（`motrix_envs`）
- `@registry.envcfg("cartpole")`：注册环境仿真配置类（如 `CartPoleEnvCfg`）
- `@registry.env("cartpole", "np")`：注册具体环境实现（如 `CartPoleEnv`）

#### RL 侧（`motrix_rl`）
- `motrix_rl/__init__.py` 导入 `cfgs` 时，各 `@rlcfg("cartpole")` 装饰器把 PPO 超参注册进 `_rlcfgs`
- 结构：`{env_name: {skrl: {jax: CartPolePPO, torch: CartPolePPO}}}`

以 cartpole 为例：
```python
class basic:
    @rlcfg("cartpole")
    @dataclass
    class CartPolePPO(PPOCfg):
        max_env_steps: int = 10_000_000
        check_point_interval: int = 500
        policy_hidden_layer_sizes: tuple[int, ...] = (32, 32)
        ...
```

`Trainer.__init__` 加载配置：
```python
def __init__(self, env_name, sim_backend=None, enable_render=False, cfg_override=None):
    rlcfg = registry.default_rl_cfg(env_name, "skrl", backend="jax")
    if cfg_override is not None:
        rlcfg = rlcfg.replace(**cfg_override)
    ...
```

### 环境创建

```python
def train(self) -> None:
    rlcfg = self._rlcfg
    env = env_registry.make(self._env_name, sim_backend=self._sim_backend, num_envs=rlcfg.num_envs)
    set_seed(rlcfg.seed)
    skrl_env = wrap_env(env, self._enable_render)
    models = self._make_model(skrl_env, rlcfg)
    ppo_cfg = _get_cfg(rlcfg, skrl_env, log_dir=get_log_dir(self._env_name))
    agent = self._make_agent(models, skrl_env, ppo_cfg)
    cfg_trainer = {
        "timesteps": rlcfg.max_batch_env_steps,
        "headless": not self._enable_render,
    }
    trainer = SequentialTrainer(cfg=cfg_trainer, env=skrl_env, agents=agent)
    trainer.train()
```

`env_registry.make()` 流程：
1. 查 `_envs` 注册表
2. 实例化 `env_cfg_cls()`，可选 `override`，`validate()`
3. 选 `sim_backend`（默认第一个，目前是 `np`）
4. 构造环境类，传入 `num_envs`

#### SKRL 包装层
`wrap_env()` 按环境类型进行包装；NumPy 仿真环境走 `SkrlNpWrapper`，把 MotrixSim 的 `NpEnv` 适配成 SKRL 的 `reset/step` 接口。

### 训练执行（SKRL PPO 循环）

单步训练逻辑（由 SKRL 内部驱动）：
1. 并行 `num_envs` 个环境 `step`
2. 收集 `rollouts` 步经验写入 memory
3. 做 `learning_epochs` 轮 mini-batch 更新（PPO clip、value loss、entropy 等）
4. 重复直到 `timesteps == max_batch_env_steps`

---

## 模型保存、日志记录与结果输出

### 输出目录结构

日志根目录由 `get_log_dir(env_name)` 决定：
```python
LOG_DIR_PREFIX = "runs"
def get_log_dir(env_name: str) -> str:
    return f"{LOG_DIR_PREFIX}/{env_name}"
```

典型目录布局：
```
runs/
└── cartpole/
    └── 26-05-17_14-30-00-_12345_PPO/
        ├── checkpoints/
        │   ├── agent_500.pickle
        │   ├── agent_1000.pickle
        │   ├── best_agent.pickle
        │   └── ...
        └── events.out.tfevents.*  # TensorBoard
```

- JAX：`.pickle`，PyTorch：`.pt`
- `check_point_interval`：每 N 个 timestep 写一次 checkpoint 和 TensorBoard

### TensorBoard
```bash
uv run tensorboard --logdir runs/cartpole
```

可查看 SKRL 默认指标（loss、reward 等）以及 MotrixLab 扩展的 `Reward Instant / ...`、`metrics / ...` 等曲线。

### 推理与加载（`play.py`）

```bash
uv run scripts/play.py --env cartpole
uv run scripts/play.py --env cartpole --policy runs/cartpole/.../checkpoints/best_agent.pickle
```

`play.py` 的 `find_best_policy()` 会：
1. 在 `runs/{env}/` 下找最新训练 run
2. 优先用 `checkpoints/best_agent.*`
3. 否则取 `agent_{timestep}.*` 中 timestep 最大的文件

按扩展名自动选 JAX / Torch 后端，调用 `Trainer.play(policy_path)` 加载权重并循环 `act → step → render`。

---

## 小结：三层职责划分

| 层次 | 职责 | 关键文件 |
|------|------|----------|
| 用户接口层 | 命令行解析、启动流程 | `scripts/train.py`, `play.py`, `view.py` |
| 训练算法层 | 策略学习、参数更新 | `motrix_rl/skrl/`, `motrix_rl/rslrl/` |
| 环境实现层 | 任务定义、观测/动作/奖励 | `motrix_envs/` |
