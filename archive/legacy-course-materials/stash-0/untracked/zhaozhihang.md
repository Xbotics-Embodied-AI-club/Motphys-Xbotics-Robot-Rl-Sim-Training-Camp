EnvCfg与RLCcfg的分工 
EnvCfg：环境与仿真
EnvCfg 在 motrix_envs 里，描述物理仿真与任务本身，和用哪种 RL 算法无关。
见MotrixLab\motrix_envs\src\motrix_envs\base.py
@dataclass
class EnvCfg:
    """
    Config for the environment

    """

    model_file: str = None                      //模型文件路径（如机器人URDF/MJCF文件）
    sim_dt: float = 0.01                         //仿真步长（物理引擎更新间隔），默认0.01秒
    max_episode_seconds: float = None  //每个episode的最大时长（秒），None表示无限制
    ctrl_dt: float = 0.01                         //每个episode的最大时长（秒），None表示无限制
    render_spacing: float = 1.0              //渲染间隔，默认1.0
    ...

典型内容：模型文件、仿真/控制步长、单局时长（或步数推导）、渲染间隔；各环境子类还会加任务专属字段（初始姿态、奖励相关几何、域随机化等）。
注册方式：@envcfg("cartpole") 等，把环境名 → EnvCfg 类型放进 motrix_envs.registry，再挂上具体 ABEnv 实现。

---
RLCfg（BaseRLCfg / PPOCfg）：训练与算法
在 motrix_rl 里，描述怎么训：并行环境数、总步数、存盘间隔、随机种子，以及 PPO 的网络结构、学习率、rollout、clip 等。
见MotrixLab\motrix_rl\src\motrix_rl\base.py
@dataclasses.dataclass
class BaseRLCfg:
    """
    Config for the reinforcement learning algorithm
    """
    # Basic training parameters
    seed: Optional[int] = None              //随机种子，默认为 None
    num_envs: int = 2048                     //并行运行的环境数量（训练时）
    play_num_envs: int = 16                 //并行运行的环境数量（评估/演示时）
    max_env_steps: int = 20480000       //整个训练过程的最大环境步数（所有环境的总交互次数）
    check_point_interval: int = 1000       //每 1000 步训练 保存一次模型检查点
    ...
PPOCfg 在 BaseRLCfg 上继续加策略/价值网络、PPO 超参、奖励缩放等（见 motrix_rl/skrl/cfg.py）。
@dataclass
class PPOCfg(BaseRLCfg):
    """PPO configuration .

    This class provides all the parameters needed to configure a PPO agent
    in SKRL
    """

    # Model architecture settings（模型结构设置）                   
    policy_hidden_layer_sizes: tuple[int, ...] = (256, 128, 64)  //策略网络的隐藏层尺寸
    value_hidden_layer_sizes: tuple[int, ...] = (256, 128, 64)   //价值网络的隐藏层尺寸
    # Whether to share feature extraction layers between policy and value networks. only works if:
    # 1. both networks have the same architecture
    # 2. the backend is torch
    share_policy_value_features: bool = True                         //共享特征提取层

    # Agent settings（智能体设置）
    rollouts: int = 32                                                           //轨迹收集数量
    learning_epochs: int = 2                                                //学习轮数
    mini_batches: int = 32                                                   //小批量数量
    discount_factor: float = 0.99                                           //折扣因子
    lambda_param: float = 0.95                                            //GAE 参数

    # Learning rate settings（学习率设置）
    learning_rate: float = 1e-3                                             //学习率
    learning_rate_scheduler_kl_threshold: float = 0.008          //学习率调度器的 KL 阈值

    # Training settings（训练设置）
    random_timesteps: int = 0                                             //随机时间步
    learning_starts: int = 0                                                  //学习开始时间
    grad_norm_clip: float = 1.0                                            //梯度范数裁剪

    time_limit_bootstrap: bool = True                                   //时间限制自举

    # PPO clipping settings（PPO裁剪设置）
    ratio_clip: float = 0.2                                                     //概率比率裁剪范围（策略）
    value_clip: float = 0.2                                                    //概率比率裁剪范围（价值）
    clip_predicted_values: bool = True                                  //裁剪预测值

    # Loss setting(Loss设置)
    entropy_lossfloat = 0.2                                                  //熵损失系数
    value_loss_scale: float = 2.0                                           //价值损失系数
    kl_threshold: float = 0                                                    //KL 散度阈值

    # Reward shaping（奖励重塑）
    rewards_shaper_scale: float = 1.0                                   //奖励重塑缩放系数
注册方式：@rlcfg("cartpole") 把同一环境名下、框架（如 skrl）+ 后端（jax/torch） 对应的配置类登记到 motrix_rl.registry；default_rl_cfg 按环境名和 backend 取出实例。

---
二者关系
暂时无法在飞书文档外展示此内容
- 环境配置 (EnvCfg)：控制物理仿真和任务行为，包括仿真参数、重置噪声、时间限制等
- 训练配置 (RLCfg)：控制强化学习算法，包括网络结构、学习率、批次大小、训练步数等
参数继承、覆盖与管理方式
继承：用 @dataclass 子类叠默认值
环境 EnvCfg：在 EnvCfg 上继续派生，子类只改差异字段；复杂任务常用嵌套 dataclass（field(default_factory=...)）成组管理。（以go1-flat-terrain-walk举例）
见MotrixLab\motrix_envs\src\motrix_envs\locomotion\go1\cfg.py
@registry.envcfg("go1-flat-terrain-walk")
@dataclass
class Go1WalkNpEnvCfg(EnvCfg):
    max_episode_seconds: float = 20.0
    model_file: str = os.path.dirname(file) + "/xmls/scene_motor_actuator.xml"
    noise_config: NoiseConfig = field(default_factory=NoiseConfig)
    control_config: ControlConfig = field(default_factory=ControlConfig)
    reward_config: RewardConfig = field(default_factory=RewardConfig)
    init_state: InitState = field(default_factory=InitState)
    commands: Commands = field(default_factory=Commands)
    normalization: Normalization = field(default_factory=Normalization)
    asset: Asset = field(default_factory=Asset)
    sensor: Sensor = field(default_factory=Sensor)
    sim_dt: float = 0.01
    ctrl_dt: float = 0.01
训练 RLCfg：PPOCfg 继承 BaseRLCfg；各任务在 motrix_rl/cfgs.py 里再继承 PPOCfg，用类体默认值覆盖 PPO/训练字段。
见MotrixLab\motrix_rl\src\motrix_rl\cfgs.py
class basic:
    @rlcfg("cartpole")
    @dataclass
    class CartPolePPO(PPOCfg):
        max_env_steps: int = 10_000_000
        check_point_interval: int = 500
        # Override PPO configuration
        policy_hidden_layer_sizes: tuple[int, ...] = (32, 32)
        value_hidden_layer_sizes: tuple[int, ...] = (32, 32)
        rollouts: int = 32
        ...

---
注册时覆盖
EnvCfg：motrix_envs.registry.make 先用注册的 env_cfg_cls() 得到默认实例，再用字典逐项 setattr：
    env_cfg = meta.env_cfg_cls()
    if env_cfg_override is not None:
        for key, value in env_cfg_override.items():
            if hasattr(env_cfg, key):
                setattr(env_cfg, key, value)
            else:
                raise ValueError(f"Config class '{env_cfg.class.name}' has no attribute '{key}'")
要点：
- 只认 EnvCfg 实例的顶层属性名（和 dataclasses.replace 能接受的字段一样必须是已声明字段）。
- 原地修改同一个 env_cfg 对象，不是拷贝后再改。
- 不会做嵌套 dict 的 deep merge；要改 reward_config 之类，一般要整个换成新对象，或在外部先拼好再塞进 env_cfg_override。
谁在调用时传 env_cfg_override，需要自己在业务代码里搜 make(；默认的 train/play 路径里常见的是只传 num_envs，不一定动 EnvCfg。
RLCfg：Trainer 先按环境名 + backend 从 registry 实例化默认的 PPOCfg（或子类），再用 cfg_override 做不可变式覆盖：
        rlcfg = registry.default_rl_cfg(env_name, "skrl", backend="jax")
        if cfg_override is not None:
            rlcfg = rlcfg.replace(**cfg_override)
        self._rlcfg = rlcfg
replace 来自 BaseRLCfg，内部是 dataclasses.replace：
    def replace(self, **updates) -> "BaseRLCfg":
        return dataclasses.replace(self, **updates)
与 Env 侧对比：RL 是新对象，只改 **updates 里出现的字段，其余字段从原 rlcfg 拷贝过来。

---
运行时覆盖：
Env：env_registry.make 里对默认 meta.env_cfg_cls() 做 setattr 按 key 覆盖；key 必须是该 EnvCfg 上存在的属性，否则报错。
    env_cfg = meta.env_cfg_cls()
    if env_cfg_override is not None:
        for key, value in env_cfg_override.items():
            if hasattr(env_cfg, key):
                setattr(env_cfg, key, value)
            else:
                raise ValueError(f"Config class '{env_cfg.class.name}' has no attribute '{key}'")
    # Validate config
    env_cfg.validate()
当前 ppo.Trainer.train 里 make 未传入 env_cfg_override，所以环境侧运行时 patch 主要靠在调用 make 时自己传；训练脚本默认只动 RL 侧。
RL：Trainer 里先 default_rl_cfg(...) 得到默认实例，再对 cfg_override 调用 replace。
        rlcfg = registry.default_rl_cfg(env_name, "skrl", backend="jax")
        if cfg_override is not None:
            rlcfg = rlcfg.replace(**cfg_override)
        self._rlcfg = rlcfg
scripts/train.py 只把少量 flag 写进 rl_override（例如 --num-envs、--seed / --rand-seed），再传给 Trainer(..., cfg_override=rl_override)。

---
管理方式
管理大量实验方式，实质仍是：默认值放在 EnvCfg/RLCfg 子类 → 差异用不同 @envcfg/@rlcfg 环境名或 backend 类 → 少量动态项用 cfg_override / env_cfg_override。
如何通过配置灵活控制实验行为
不改代码
训练（scripts/train.py）可直接影响实验：
- --env：换环境名即换一套 EnvCfg 注册类 + RL 注册类（任务与默认超参一起变）。
- --train-backend jax|torch：走不同后端时，default_rl_cfg 会优先选 @rlcfg(..., backend="jax/torch") 的类（见 motrix_rl/registry.py）。
- --sim-backend：选仿真后端（当前以 np 为主）。
- --num-envs：经 rl_override 写入 PPOCfg.num_envs，影响并行规模与 rollout 形状。
- --seed / --rand-seed：控制 rlcfg.seed。
- --render：是否可视化训练。
评估（scripts/play.py）：--num-envs 映射到 play_num_envs，--seed / --rand-seed 同理；--policy 指定权重。
可视化（scripts/view.py）：--env、--sim-backend、--num-envs，不做 RL。
灵活度：换 env 名 + 后端 + 规模 + 随机性，适合「同一套已注册任务」下的 A/B。

---
改配置类、少改逻辑
- 任务 / 物理 / 奖励形状：为不同实验注册不同 环境名 与 EnvCfg 子类（继承改默认值，或像 go1-flat / go1-rough 拆成多个 @envcfg）。训练时只改 --env。
- 算法与算力：在 motrix_rl/cfgs.py（或你自己的模块）里用 @rlcfg("env-name") / @rlcfg(..., backend="torch") 挂不同 PPOCfg 子类，用类默认值表达「该任务推荐 batch、网络、学习率」等。
- Jax vs Torch 差异：同一 env 注册两个 backend 专用类（仓库里 walker/cheetah 已有范例），由 --train-backend 自动选型，无需在实验脚本里写 if。
这样实验行为主要由「选哪个 env + 哪个后端」决定，日志目录仍按 get_log_dir(env_name) 等与 env 名绑定。

---
程序里动态改
环境：registry.make(..., env_cfg_override={...}) 在默认 EnvCfg() 上对顶层属性做 setattr；键必须是 dataclass 上存在的字段，否则报错。
env = registry.make(
    name="my-custom-env",
    sim_backend="np",
    num_envs=256,
    env_cfg_override={
        "custom_param_1": 2.0,
        "reset_noise_scale": 0.02
    }
)
嵌套字段（如整块 noise_config）可以传一个新的 dataclass 实例赋给同名属性，只要 EnvCfg 上有该字段。
训练：构造 ppo.Trainer(..., cfg_override={...})，内部会对 default_rl_cfg 得到的实例做 rlcfg.replace(**cfg_override)（与 BaseRLCfg.replace 一致）。train.py 目前只把少数 flag 放进 rl_override；要更细的控制，可以自写入口脚本，把学习率、max_env_steps、rollouts 等任意 PPOCfg 字段放进 cfg_override。