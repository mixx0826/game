#!/bin/bash

# 乐玩小游戏平台启动脚本

echo "🎮 欢迎使用乐玩小游戏平台！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未找到Node.js，请先安装Node.js 16.0或更高版本"
    exit 1
fi

# 显示Node.js版本
echo "📦 Node.js版本: $(node --version)"

# 进入后端目录
cd backend

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📥 正在安装依赖包..."
    npm install
fi

# 启动服务器
echo "🚀 正在启动服务器..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 前台地址: http://localhost:3000"
echo "🛠️ 管理后台: http://localhost:3000/admin.html"
echo "👤 默认管理员: admin / admin123"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "按 Ctrl+C 停止服务器"
echo ""

node server.js 