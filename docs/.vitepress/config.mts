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
      { text: '第一个月：理论基础', link: '/month1/' },
      { text: '第二个月：仿真实操', link: '/month2/' }
    ],

    // 网站左侧的侧边栏目录
    sidebar: [
      {
        text: '第一个月：理论基础',
        collapsed: false, // false 表示默认展开
        items: [
          { text: '📍 学习大纲与目标', link: '/month1/' },
          // 下面这些是预留的空位，等你以后建了具体的 md 文件，链接就生效了
          { text: '第一周：坐标系与位姿变换', link: '/month1/week1' },
          { text: '第二周：轨迹规划', link: '/month1/week2' },
          { text: '第三周：机器人运动学', link: '/month1/week3' },
          { text: '第四周：深度强化学习', link: '/month1/week4' }
        ]
      },
      {
        text: '第二个月：仿真实操',
        collapsed: false,
        items: [
          { text: '📍 学习大纲与目标', link: '/month2/' },
          { text: '第一周：熟悉平台', link: '/month2/week1' },
          { text: '第二周：深入 Navigation 任务', link: '/month2/week2' },
          { text: '第三周：开始迁移', link: '/month2/week3' },
          { text: '第四周：完整迁移 & 复现结果', link: '/month2/week4' }
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
