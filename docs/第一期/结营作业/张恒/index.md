# 张恒 — Unitree Go2 平地行走任务实践

> **原始仓库**：[cotton365/MotrixLab-go2](https://github.com/cotton365/MotrixLab-go2)  
> **任务**：基于 MotrixLab 平台完成 Unitree Go2 平地行走任务实践与调试

## 📁 代码结构

```
张恒/
  IsaacLab_go2/          ← 历史参考配置目录
    flat_env_cfg.py      ← 平地行走环境配置
    rough_env_cfg.py     ← 粗糙地形环境配置
    __init__.py
    agents/
      rsl_rl_ppo_cfg.py
      skrl_flat_ppo_cfg.yaml
      skrl_rough_ppo_cfg.yaml
  修改前的/              ← MotrixLab 任务初版（含 action space 错误）
    cfg.py
    walk_np.py
    __init__.py
  修改后的/              ← MotrixLab 任务修正版（action space 对齐）
    cfg.py
    walk_np.py
    __init__.py
  go2flat任务周报.docx   ← 完整实践过程周报
```

## 📋 实践摘要

详细分析与周报见 `go2flat任务周报.docx`，核心修正点如下：

### 关键问题：action space 定义错误（已修正）

**问题根源**：原版 Motrix 以 `actuator_ctrl_limits`（物理限位）作为动作空间边界，配合 `action_scale=0.05`，是配套设计。后续调参时将 `action_scale` 改为 `0.25`，但未同步修改动作空间边界。

```python
# 修改前（错误）
gym.spaces.Box(actuator_ctrl_limits[0], actuator_ctrl_limits[1], ...)

# 修改后（正确，对齐归一化动作空间范围）
gym.spaces.Box(-np.ones(n), np.ones(n), ...)
```

### 训练结果

修正后训练可正常达成平地行走任务，机器人能够跟踪线速度和角速度指令，步态稳定。
