import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "谋先飞机器人实训",
  description: "从传统机器人学到前沿具身智能的系统实训",
  
  // ⚠️ 这里的 base 必须和你的 GitHub 仓库名完全一致，前后都要有斜杠
  base: '/Motphys-Xbotics-Robot-Rl-Sim-Training-Camp/',
  
  // 忽略掉没有链接的 markdown 死链，防止打包报错
  ignoreDeadLinks: true,

  themeConfig: {
    // 网站顶部的导航栏
    nav: [
      { text: '首页', link: '/' },
      { text: '周报标准', link: '/周报评审标准' },
      {
        text: '学习路径',
        items: [
          { text: '第一期', link: '/第一期/' },
          { text: '第二期', link: '/第二期/' },
          { text: '第三期', link: '/第三期/' }
        ]
      },
      {
        text: '课程资料',
        items: [
          { text: '强化学习与MotrixLab入门（第五期）', link: '/强化学习与MotrixLab入门/' },
          { text: '第四期', link: '/第四期/' }
        ]
      },
      {
        text: '项目实践',
        items: [
          { text: '第一期项目实践', link: '/第一期/结营作业/' },
          { text: '张恒 — Go2 平地实践', link: '/第一期/结营作业/张恒/' },
          { text: '第三期结营作业', link: '/第三期/结营作业/' }
        ]
      }
    ],

    // 网站左侧的侧边栏目录
    sidebar: [
      {
        text: '提交与评审',
        collapsed: false,
        items: [
          { text: '优秀周报评审标准', link: '/周报评审标准' }
        ]
      },
      {
        text: '学习路径',
        collapsed: false,
        items: [
          {
            text: '第一期',
            collapsed: false,
            items: [
              { text: '📋 路径总览', link: '/第一期/' },
              { text: '阶段一：理论基础', link: '/第一期/month1/' },
              { text: '阶段二：平台实战', link: '/第一期/month2/' },
              { text: '项目实践', link: '/第一期/结营作业/' }
            ]
          },
          {
            text: '第二期',
            collapsed: false,
            items: [
              { text: '📋 路径总览', link: '/第二期/' },
              { text: '阶段一：理论基础', link: '/第二期/month1/' },
              { text: '阶段二：平台实战', link: '/第二期/month2/' }
            ]
          },
          {
            text: '第三期',
            collapsed: false,
            items: [
              { text: '📋 路径总览', link: '/第三期/' },
              { text: '阶段一：理论基础', link: '/第三期/month1/' },
              { text: '阶段二：平台实战', link: '/第三期/month2/' },
              { text: '🌟 优秀成果', link: '/第三期/优秀成果/' },
              { text: '项目实践', link: '/第三期/结营作业/' }
            ]
          }
        ]
      },
      {
        text: '课程资料',
        collapsed: false,
        items: [
          {
            text: '强化学习与MotrixLab入门（第五期）',
            collapsed: false,
            items: [
              { text: '课程目录', link: '/强化学习与MotrixLab入门/' },
              { text: '强化学习基础课程', link: '/强化学习与MotrixLab入门/强化学习基础课程' },
              { text: 'MotrixLab入门精品课程', link: '/强化学习与MotrixLab入门/MotrixLab入门精品课程' },
              { text: '第一周课程内容', link: '/强化学习与MotrixLab入门/第一周' },
              { text: '第二周课程内容', link: '/强化学习与MotrixLab入门/第二周' },
              { text: '第一周课后作业', link: '/强化学习与MotrixLab入门/课后作业选择题-第一周' },
              { text: '第二周课后作业', link: '/强化学习与MotrixLab入门/课后作业选择题-第二周' },
              { text: '前两周作业完成指标', link: '/强化学习与MotrixLab入门/课程作业完成指标-前两周' }
            ]
          },
          { text: '第四期', link: '/第四期/' }
        ]
      },
      {
        text: '项目实践',
        collapsed: false,
        items: [
          { text: '📦 第一期项目实践', link: '/第一期/结营作业/' },
          { text: '张恒 — Go2 平地实践', link: '/第一期/结营作业/张恒/' },
          { text: '📦 第三期结营作业', link: '/第三期/结营作业/' }
        ]
      }
    ],

    // 右上角的社交链接，指向你们的仓库
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Xbotics-Embodied-AI-club/Motphys-Xbotics-Robot-Rl-Sim-Training-Camp' }
    ],

    // 页脚版权信息
    footer: {
      message: '采用 CC BY-NC-SA 4.0 许可协议发布',
      copyright: 'Copyright © 2026 谋先飞团队'
    },
    
    // 开启本地搜索功能
    search: {
      provider: 'local'
    }
  }
})
