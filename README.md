<div align="center">
  <img src="./%E7%A4%BE%E5%8C%BALogo.jpg" alt="Xbotics 社区 Logo" width="140" />
</div>

# 谋先飞机器人强化学习与仿真实训营

面向机器人学、强化学习与具身智能爱好者的开源训练营，聚焦真实仿真任务，帮助你从理论基础走到 MotrixLab 落地实践；学习链路覆盖 `IsaacLab -> MotrixLab` 任务迁移。

[![GitHub Repo](https://img.shields.io/badge/GitHub-Open%20Source-blue?logo=github)](https://github.com/Xbotics-Embodied-AI-club/Motphys-Xbotics-Robot-Rl-Sim-Training-Camp)
[![Docs](https://img.shields.io/badge/Docs-Read%20Now-orange)](https://motrixlab.readthedocs.io/zh-cn/latest/user_guide/tutorial/basic_frame.html)
[![License](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

> [!NOTE]
> 这是训练营的文档与宣传仓库，适合第一次了解项目的同学快速查看课程路线、结营作业、相关资料与官方文档入口。

## 项目简介

- 学习周期：`2 个月`，分为理论基础与仿真实操两个阶段
- 落地平台：以 `MotrixLab` 为主，学习链路覆盖 `IsaacLab -> MotrixLab` 迁移
- 主线任务：围绕四足机器人导航与行走任务展开，强调可复现、可迁移、可落地
- 仓库定位：沉淀训练营文档、学习路线、结营作业入口与社区共建信息

## 关键词

`机器人学` `强化学习` `仿真` `MotrixLab` `IsaacLab` `VitePress` `训练营`

## 目录

- [快速开始](#快速开始)
- [学习路线](#学习路线)
- [结营作业](#结营作业)
- [社区共建](#社区共建)
- [许可证](#许可证)

## 快速开始

> 推荐使用 `Node.js 24`，与仓库当前 GitHub Actions 构建环境保持一致。

### 1. 安装依赖

```bash
npm ci
```

### 2. 本地启动文档站

```bash
npm run docs:dev
```

### 3. 构建静态站点

```bash
npm run docs:build
```

### 4. 本地预览构建结果

```bash
npm run docs:preview
```

### 5. 快速阅读入口

- 官方平台教程：[MotrixLab 基础框架教程](https://motrixlab.readthedocs.io/zh-cn/latest/user_guide/tutorial/basic_frame.html)
- 第一期总览：[第一期训练营](./docs/第一期/index.md)
- 第一个月内容：[理论基础](./docs/第一期/month1/index.md)
- 第二个月内容：[仿真实操](./docs/第一期/month2/index.md)
- 作业归档入口：[结营作业总览](./docs/结营作业/index.md)

## 学习路线

### 第一期：机器人仿真实训

- 第一个月：理论基础，覆盖坐标系变换、轨迹规划、FK/IK、深度强化学习 `PPO/A3C`
- 第二个月：仿真实操，聚焦 `IsaacLab -> MotrixLab` 的任务理解、迁移与复现
- 结营阶段：提交迁移代码、周报和结果分析，沉淀可复用的实践经验

### 适合谁

- 想系统学习机器人学与强化学习的同学
- 想进入 MotrixLab 仿真实战的学习者
- 想理解四足机器人任务迁移流程的工程实践者
- 想通过 Issue / PR 参与社区共建的贡献者

### 你将获得

- 坐标系变换与位姿表达能力
- 轨迹规划与机器人正逆运动学基础
- 深度强化学习入门与训练流程认知
- 仿真平台环境配置、奖励设计与任务迁移经验
- 面向真实任务的代码阅读、调试与复现能力

## 结营作业

### 第一期

- 学员：张恒
- 任务：Unitree Go2 平地行走任务迁移（`Isaac-Velocity-Flat-Unitree-Go2-v0` -> `MotrixLab`）
- 代码仓库：[cotton365/MotrixLab-go2](https://github.com/cotton365/MotrixLab-go2)
- 查看解析：[张恒结营作业说明](./docs/结营作业/第一期/张恒/index.md)

## 社区共建

欢迎通过以下方式参与社区建设：

- 提交 Issue 反馈问题、建议或勘误
- 提交 Pull Request 完善文档、案例或排版
- 补充学习笔记、踩坑总结与实验结果
- 一起维护训练营的课程内容与教学体验

## 许可证

本项目采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 进行许可。
