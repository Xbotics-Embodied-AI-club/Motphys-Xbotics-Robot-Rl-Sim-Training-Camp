# 训练流程：从 train.py 到模型保存

## 命令行启动训练

典型命令：
```bash
uv run scripts/train.py --env cartpole
uv run scripts/train.py --env cartpole --render --num-envs
```

### 入口与参数

`train.py` 用 absl.flags 定义 CLI 参数，包括 --env、--train-backend、--sim-backend、--num-envs、--seed、--render 等。

---

## 配置解析、环境创建、训练执行

### 配置解析（双层注册表）

MotrixLab 有**环境配置**和**RL 训练配置**两套注册机制。

#### 环境侧（`motrix_envs`）
- `@registry.envcfg("cartpole")`：注册环境仿真配置类（如 `CartPoleEnvCfg`）
- `@registry.env("cartpole", "np")`：注册具体环境实现（如 `CartPoleEnv`）

#### RL 侧（`motrix_rl`）
- `motrix_rl/init.py` 导入 `cfgs` 时，各 `@rlcfg("cartpole")` 装饰器把 PPO 超参注册进 `_rlcfgs`
- 结构：`{env_name: {skrl: {jax: CartPolePPO, torch: CartPolePPO}}}`

以 cartpole 为例：
```python
# cfgs.py
class basic:
    @rlcfg("cartpole")
    @dataclass
    class CartPolePPO(PPOCfg):
        max_env_steps: int = 10_000_000
        check_point_interval: int = 500
        policy_hidden_layer_sizes: tuple[int, ...] = (32, 32)
        value_hidden_layer_sizes: tuple[int, ...] = (32, 32)
        rollouts: int = 32
        learning_epochs: int = 5
        mini_batches: int = 4
        learning_rate: float = 3e-4
```

`Trainer.init` 加载配置：
```python
def init(self, env_name, sim_backend=None, enable_render=False, cfg_override=None):
    rlcfg = registry.default_rl_cfg(env_name, "skrl", backend="jax")
    if cfg_override is not None:
        rlcfg = rlcfg.replace(**cfg_override)
    # ...
```

`PPOCfg` 继承 `BaseRLCfg`，包含训练步数、并行数、checkpoint 间隔等。`max_batch_env_steps` 会把 `max_env_steps` / `num_envs` 之后对齐到 `check_point_interval` 的整数倍。

```python
@property
def max_batch_env_steps(self) -> int:
    n = int(self.max_env_steps / self.num_envs)
    return (int)(n / self.check_point_interval) * self.check_point_interval
```

#### 转为 SKRL 内部配置
`_get_cfg()` 把 `PPOCfg` 映射到 SKRL 的 `PPO_DEFAULT_CONFIG`（学习率、GAE、clip、网络预处理器等），并设置实验目录与日志间隔。

---

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
`wrap_env()` 按环境类型进行包装；NumPy 仿真环境走 `SkrlNpWrapper`，把 MotrixSim 的 `NpEnv` 适配成 SKRL 的 `reset/step` 接口，并在 `--render` 时挂上 `NpRenderer`。

---

### 训练执行（SKRL PPO 循环）

组件组装后，训练逻辑（由 SKRL 内部驱动，MotrixLab 不手写）：
1. 并行 `num_envs` 个环境 `step`
2. 收集 `rollouts` 步经验写入 `memory`
3. 做 `learning_epochs` 轮 mini-batch 更新（PPO clip、value loss、entropy 等）
4. 重复直到 `timesteps == max_batch_env_steps`

自定义指标：环境若在 `info` 里提供 `"Reward"` 或 `"metrics"`，MotrixLab 的 `PPO.record_transition` 会在每步把这些数据写入 `tracking_data`，供 TensorBoard 使用。

---

## 模型保存、日志记录与结果输出

### 输出目录结构

日志根目录由 `get_log_dir(env_name)` 决定：
```python
LOG_DIR_PREFIX = "runs"

def get_log_dir(env_name: str) -> str:
    return f"{LOG_DIR_PREFIX}/{env_name}"
```

训练时 `_get_cfg` 把 SKRL experiment 指到该目录：
```python
if log_dir:
    cfg["experiment"]["write_interval"] = rlcfg.check_point_interval
    cfg["experiment"]["checkpoint_interval"] = rlcfg.check_point_interval
    cfg["experiment"]["directory"] = log_dir
```

典型目录布局（由 SKRL 在每次训练时自动创建带时间戳的子目录）：
```
runs/
└── cartpole/
    └── 26-05-17_14-30-00-_12345_PPO/     # 时间戳 + 随机后缀
        ├── checkpoints/
        │   ├── agent_500.pickle          # JAX
        │   ├── agent_1000.pickle
        │   ├── best_agent.pickle         # 最优策略
        │   └── ...
        └── events.out.tfevents.*         # TensorBoard
```

- JAX：`.pickle`
- PyTorch：`.pt`
- `check_point_interval`：每 N 个 timestep（环境步，非 epoch）写一次 checkpoint 和 TensorBoard

### TensorBoard
```bash
uv run tensorboard --logdir runs/cartpole
```

可查看 SKRL 默认指标（loss、reward 等），以及 MotrixLab 扩展的 `Reward Instant / ...`、`metrics / ...` 等曲线。

### 推理与加载（`play.py`）

训练结束后可用：
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

| 层 | 职责 | 关键类/文件 |
|:--:|:----:|:----------:|
| 启动层 | CLI 参数解析、注册表查询、入口调用 | train.py / play.py / view.py |
| 组装层 | 配置解析、环境包装、组件拼装 | PPO.py、registry |
| 执行层 | 训练循环、日志记录、检查点保存 | SKRL SequentialTrainer |
