# 03 训练环境：EnvCfg、Env、Reward 的分工

训练环境不是单个函数，也不是单个文件。在机器人强化学习任务中，环境通常由 `EnvCfg`、`Env`、`Reward` 共同组成。

基本分工：

- `EnvCfg`：定义环境参数
- `Env`：执行环境流程
- `Reward`：计算学习信号

> 一句话：`EnvCfg` 管参数，`Env` 管流程，`Reward` 管目标。

## EnvCfg：环境参数

`EnvCfg` 是环境配置类，描述环境运行需要哪些参数，以及这些参数的默认值。

典型内容：

- `model_file`：机器人或场景模型文件
- `sim_dt`：物理仿真步长
- `ctrl_dt`：控制步长
- `max_episode_seconds`：单个 episode 最大时长
- `render_spacing`：渲染间隔
- `action_scale`：动作缩放
- observation 相关维度或开关
- `reset_noise`：重置随机性
- `goal` / `target`：任务目标参数
- `reward_config`：奖励权重或奖励子配置
- `domain_randomization`：域随机化参数

`EnvCfg` 适合放“可调参数”，不适合放复杂流程逻辑。

判断标准：

- 如果这个字段回答的是“环境应该用什么参数”，通常放 `EnvCfg`。
- 如果这个逻辑回答的是“环境每一步怎么运行”，通常放 `Env`。

例子：

- episode 长度从 20 秒改成 30 秒，属于 `EnvCfg`。
- 动作如何转换成关节控制，属于 `Env`。
- 某个 reward 项权重从 `1.0` 改成 `0.2`，通常属于 `EnvCfg` 或 `reward_config`。
- 某个 reward 项如何根据状态计算，属于 `Reward`。

## EnvCfg 的作用

### 配置集中化

把模型路径、时间步长、奖励权重、重置范围等参数集中管理。

### 实验可复现

同一个配置类代表一组默认实验条件。不同任务或实验可以通过继承 `EnvCfg` 改默认值。

### 减少硬编码

不需要在 `Env` 的 `step`、`reset`、`reward` 逻辑里到处写固定数值。

### 便于注册

通过 `@envcfg("env-name")` 这类机制，把环境名和 `EnvCfg` 类型绑定。

### 便于覆盖

运行时可以通过 `env_cfg_override` 之类的机制覆盖部分顶层参数。

注意：

- 运行时覆盖通常只改顶层字段。
- 如果字段是嵌套 dataclass，例如 `reward_config`、`noise_config`，一般需要传入新的配置对象，不能默认指望 deep merge。

## Env：环境运行流程

`Env` 是环境主体，负责把配置、动作、仿真、观测、奖励、终止条件串起来。

典型职责：

- 初始化环境
- 读取 `EnvCfg`
- 加载模型
- 创建或连接仿真后端
- 接收策略 `action`
- 对 `action` 做 `clip` / `scale` / `mapping`
- 将 `action` 写入控制接口
- 推进物理仿真
- 读取机器人状态
- 构造 `observation`
- 调用 `Reward` 或内部奖励函数
- 判断 `terminated` / `truncated`
- `reset` 环境
- 返回 RL 框架需要的数据

强化学习交互核心：

```text
policy 输出 action
-> Env 执行 action
-> 仿真推进状态
-> Env 返回 observation / reward / done / info
-> 算法用这些数据更新 policy
```

## Env 阅读顺序

不要从文件第一行一直读到最后。按环境生命周期读。

推荐顺序：

1. `__init__`：保存了哪些 cfg，创建了哪些对象
2. `reset`：初始状态如何生成，随机性在哪里
3. `step`：动作如何进入环境
4. `action` 处理：动作含义、缩放、裁剪、映射
5. simulation step：仿真推进频率和调用位置
6. `observation`：策略到底看到了什么
7. `reward`：reward 由谁计算，用了哪些状态
8. `termination`：什么时候 done，什么时候 timeout
9. `info` / logging：额外指标如何返回

重点检查：

- `action` 维度是否和策略输出一致
- `action` 含义是否和控制器一致
- `observation` 是否包含完成任务所需信息
- `reward` 是否使用了正确状态
- `done` 条件是否会过早重置
- `reset` 后状态是否和 `observation` / `reward` 假设一致

## Reward：学习信号

`Reward` 负责把任务目标转成数值信号。强化学习算法不会理解“真实目标”，只会优化 `reward`。

`Reward` 通常依赖：

- 当前状态
- 上一步或当前 `action`
- 任务目标
- 接触信息
- 姿态、速度、关节状态
- `EnvCfg` 中的 reward 权重

常见形式：

- 目标接近奖励
- 成功奖励
- 姿态稳定奖励
- 动作平滑惩罚
- 能耗惩罚
- 碰撞惩罚
- 摔倒或越界惩罚
- 超时处理

`Reward` 和 `Env` 的关系：

```text
Env 提供状态
EnvCfg 提供参数和权重
Reward 计算分数
```

如果 `Reward` 写在 `Env` 内部，也要按这个逻辑理解：`Env` 是流程，`Reward` 是目标表达，不要混成一团。

## 三者关系

| 模块 | 职责 |
| --- | --- |
| `EnvCfg` | 说明环境用什么参数 |
| `Env` | 根据参数运行任务 |
| `Reward` | 根据任务状态生成训练信号 |

关系链：

```text
EnvCfg -> Env 初始化和运行
Env -> 读取仿真状态与动作结果
Env + EnvCfg -> Reward 输入
Reward -> 返回 reward 给算法
算法 -> 根据 reward 更新策略
```

## 常见修改位置

| 修改目标 | 优先位置 |
| --- | --- |
| 改 episode 长度 | `EnvCfg`，例如 `max_episode_seconds` 或 `max_episode_steps` |
| 改机器人模型 | `EnvCfg.model_file` 和模型加载路径 |
| 改动作幅度 | 先看 `EnvCfg` 中是否有 `action_scale`，再看 `Env` 的 action mapping |
| 改观测内容 | `Env` 的 observation 构造函数或相关状态拼接逻辑 |
| 改奖励权重 | `EnvCfg` / `reward_config` |
| 改奖励公式 | `Reward` 类或 `Env` 内部 reward 计算函数 |
| 改 reset 随机性 | `EnvCfg` 的 noise / init_state 配置，再看 `Env.reset` |
| 改终止条件 | `Env` 中 terminated / timeout / reset buffer 的计算 |

## 训练失败时的环境侧排查

### 完全学不会

- reward 是否过于稀疏
- observation 是否缺任务目标
- action 是否没有真正作用到机器人
- done 是否过早触发

### 学到奇怪行为

- reward 是否存在漏洞
- 某个辅助奖励是否主导总奖励
- action 惩罚是否太弱
- 终止条件是否放过了异常状态

### 训练不稳定

- reset 状态是否随机过大
- `sim_dt` / `ctrl_dt` 是否合理
- action scale 是否过大
- reward 量级是否剧烈波动
- 物理仿真是否本身不稳定

### reward 曲线上升但任务失败

- 总 reward 是否被辅助项刷高
- success rate 是否同步提升
- reward 分项是否合理
- 行为视频是否符合任务目标

## 基本原则

- `EnvCfg` 不写复杂流程。
- `Env` 不硬编码大量实验参数。
- `Reward` 不脱离任务目标。

读环境时不要只看类名，要追踪 `action`、`state`、`observation`、`reward`、`done` 这五条线。

> 如果这五条线能讲清楚，一个环境基本就读懂了。
