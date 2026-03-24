# 轻食记 Diet Tracker

一款移动端饮食管理应用，基于 Vue3 + Supabase 构建。

## 功能特性
- 📱 **注册/登录** - 邮箱密码认证
- 🍽️ **三餐记录** - 记录早中晚餐及加餐，支持外卖/自己做/在外就餐
- 🔍 **食物搜索** - 内置 30+ 常见食物卡路里数据库
- 📊 **卡路里统计** - 折线趋势图、餐次分布、饮食来源分析
- 💡 **身材建议** - BMI 分析、个性化饮食建议、目标达成预测
- 👤 **个人资料** - 身高体重、目标体重、活动量设置

## 技术栈
- **前端**：Vue 3 + Pinia + Vue Router + Chart.js
- **后端**：Supabase（PostgreSQL + Auth）
- **构建**：Vite

## 快速开始

### 1. 初始化数据库
在 Supabase Dashboard > SQL Editor 中执行 `supabase_init.sql`

### 2. 安装依赖
\`\`\`bash
npm install
\`\`\`

### 3. 启动开发服务器
\`\`\`bash
npm run dev
\`\`\`

### 4. 构建生产版本
\`\`\`bash
npm run build
\`\`\`

## 项目结构
\`\`\`
src/
├── assets/          # 全局样式
├── components/      # 公共组件（TabBar）
├── router/          # 路由配置
├── stores/          # Pinia 状态管理
│   ├── auth.js      # 用户认证
│   └── diet.js      # 饮食记录
├── utils/           # 工具函数（食物库、BMI计算等）
├── views/           # 页面组件
│   ├── LoginView.vue        # 登录/注册
│   ├── ProfileSetupView.vue # 新用户信息完善
│   ├── HomeView.vue         # 首页/饮食记录
│   ├── StatsView.vue        # 统计分析
│   ├── AdviceView.vue       # 身材建议
│   └── ProfileView.vue      # 个人资料
├── App.vue
├── main.js
└── supabase.js      # Supabase 客户端
\`\`\`
