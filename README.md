# 🎮 乐玩小游戏平台

一个轻量级、易用的在线休闲游戏聚合平台，专为碎片化娱乐而设计。

## ✨ 特性

- 🎯 **游戏聚合**: 支持HTML5游戏上传和管理
- 🎨 **现代界面**: 响应式设计，支持移动端
- ⚡ **快速部署**: 基于Node.js + Express.js
- 🔐 **管理后台**: 完整的游戏管理和数据统计
- 📊 **数据分析**: 游戏播放统计和用户行为分析

## 🚀 快速开始

### 本地运行

1. 克隆项目
```bash
git clone https://github.com/your-username/game-platform.git
cd game-platform
```

2. 安装依赖
```bash
npm install
```

3. 启动服务器
```bash
npm start
```

4. 访问应用
- 前台地址: http://localhost:3000
- 管理后台: http://localhost:3000/admin.html
- 默认管理员: admin / admin123

### 在线体验

访问部署地址: [https://your-domain.vercel.app](https://your-domain.vercel.app)

## 📁 项目结构

```
game-platform/
├── backend/           # 后端服务
│   └── server.js     # Express服务器
├── frontend/          # 前端页面
│   ├── index.html    # 主页
│   └── admin.html    # 管理后台
├── static/           # 静态资源
│   ├── css/         # 样式文件
│   ├── js/          # JavaScript文件
│   └── images/      # 图片资源
├── games/           # 游戏文件存储
└── uploads/         # 上传临时目录
```

## 🎮 游戏上传

1. 准备HTML5游戏ZIP包，确保包含index.html文件
2. 登录管理后台
3. 进入"游戏管理"页面
4. 点击"上传游戏"，填写游戏信息
5. 上传ZIP文件和缩略图
6. 发布游戏

## 🛠️ 技术栈

- **后端**: Node.js, Express.js
- **数据库**: SQLite3
- **前端**: HTML5, CSS3, JavaScript, Bootstrap 5
- **认证**: JWT + bcrypt
- **文件处理**: Multer, Unzipper

## 📝 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

如有问题，请通过以下方式联系：
- GitHub Issues
- Email: your-email@example.com 