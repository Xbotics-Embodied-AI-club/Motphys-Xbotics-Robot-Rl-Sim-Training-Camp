---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
hero:
  name: "谋先飞机器人实训"
  text: "机器人理论与仿真实操训练营"
  tagline: 从传统机器人学到前沿具身智能的完整闭环，涵盖 IsaacLab 与 MotrixLab 实战。
  image:
    src: /xbotics-banner.svg
    alt: Xbotics logo style banner
  actions:
    - theme: brand
      text: 立即开始
      link: /第一期/
    - theme: alt
      text: 查看结营作业
      link: /结营作业/

features:
  - title: 开源共建
    details: 训练营资料、案例与作业持续迭代，欢迎社区成员一起补充、优化与共建。
  - title: 理论 + 实操
    details: 从坐标系变换、轨迹规划，到深度强化学习与仿真任务迁移，一步步打通完整链路。
  - title: 双平台实战
    details: 聚焦 IsaacLab 与 MotrixLab，围绕真实工程中的任务配置、迁移与复现展开。
  - title: 结营可落地
    details: 以四足机器人导航任务为主线，完成从学习到实践的闭环训练。

---

## 推荐入口

<div class="home-cards">
  <a class="home-card" href="https://github.com/Xbotics-Embodied-AI-club/Motphys-Xbotics-Robot-Rl-Sim-Training-Camp" target="_blank" rel="noreferrer">
    <div class="home-card__eyebrow">官方文档站点</div>
    <div class="home-card__title">GitHub 仓库</div>
    <div class="home-card__text">查看源码、文档结构与最新更新。</div>
  </a>

  <a class="home-card" href="https://motrixlab.readthedocs.io/zh-cn/latest/user_guide/tutorial/basic_frame.html" target="_blank" rel="noreferrer">
    <div class="home-card__eyebrow">平台教程</div>
    <div class="home-card__title">MotrixLab 基础框架</div>
    <div class="home-card__text">快速了解仿真平台的核心使用方式。</div>
  </a>

  <a class="home-card" href="/第一期/">
    <div class="home-card__eyebrow">学习路径</div>
    <div class="home-card__title">第一期训练营</div>
    <div class="home-card__text">从理论基础到仿真实操，按月推进学习。</div>
  </a>
</div>

## 训练营亮点

<div class="home-highlights">
  <div class="home-highlight">
    <span>01</span>
    <h3>系统化路线</h3>
    <p>适合从入门到进阶的学习者，按阶段拆解知识与任务。</p>
  </div>
  <div class="home-highlight">
    <span>02</span>
    <h3>工程化实践</h3>
    <p>围绕真实仿真任务展开，强调可复现、可迁移、可落地。</p>
  </div>
  <div class="home-highlight">
    <span>03</span>
    <h3>社区共建</h3>
    <p>鼓励通过 Issue / PR 持续完善课程内容与案例沉淀。</p>
  </div>
</div>

## 你可以从这里开始

- 先看 [第一期总览](/第一期/) 了解整期训练营结构
- 再看 [第一个月：理论基础](/第一期/month1/) 打牢机器人学和强化学习基础
- 接着看 [第二个月：仿真实操](/第一期/month2/) 进入平台实战
- 最后查看 [结营作业总览](/结营作业/) 了解最终任务成果

<style>
.home-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin: 1rem 0 2rem;
}
.home-card {
  display: block;
  padding: 1.1rem 1.2rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  background: linear-gradient(180deg, var(--vp-c-bg-soft), transparent);
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}
.home-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0,0,0,.08);
  border-color: var(--vp-c-brand-1);
}
.home-card__eyebrow {
  font-size: .78rem;
  color: var(--vp-c-text-2);
  margin-bottom: .35rem;
}
.home-card__title {
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: .4rem;
}
.home-card__text {
  color: var(--vp-c-text-2);
  line-height: 1.6;
}
.home-highlights {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin: 1rem 0 2rem;
}
.home-highlight {
  padding: 1rem 1.1rem;
  border-radius: 16px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}
.home-highlight span {
  display: inline-flex;
  width: 2rem;
  height: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-weight: 700;
  margin-bottom: .75rem;
}
.home-highlight h3 {
  margin: 0 0 .45rem;
  font-size: 1rem;
}
.home-highlight p {
  margin: 0;
  color: var(--vp-c-text-2);
  line-height: 1.65;
}
</style>
