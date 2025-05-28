const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const unzipper = require('unzipper');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// 使用内存数据库（适合无服务器环境）
const db = new sqlite3.Database(':memory:');

// 配置文件上传 - 简化版本适合无服务器环境
const upload = multer({ 
  storage: multer.memoryStorage(), // 使用内存存储
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'gameFile') {
      if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
        cb(null, true);
      } else {
        cb(new Error('游戏文件只支持ZIP格式'));
      }
    } else if (file.fieldname === 'thumbnail') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('缩略图只支持图片格式'));
      }
    } else {
      cb(new Error('不支持的文件字段'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制（无服务器环境限制）
  }
});

// 初始化数据库表
db.serialize(() => {
  // 管理员表
  db.run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 游戏表
  db.run(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail TEXT,
    game_path TEXT NOT NULL,
    category TEXT DEFAULT 'casual',
    is_active BOOLEAN DEFAULT 1,
    play_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 广告配置表
  db.run(`CREATE TABLE IF NOT EXISTS ad_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    position TEXT NOT NULL,
    ad_code TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 创建默认管理员账户
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.run('INSERT OR IGNORE INTO admins (username, password) VALUES (?, ?)', ['admin', hashedPassword]);

  // 添加一些示例游戏数据
  const sampleGames = [
    {
      title: '2048',
      description: '经典数字合成游戏，合并相同数字达到2048！',
      thumbnail: '/static/images/default-game.svg',
      game_path: '/games/2048',
      category: 'puzzle'
    },
    {
      title: '贪吃蛇',
      description: '经典贪吃蛇游戏，控制蛇吃食物成长！',
      thumbnail: '/static/images/default-game.svg',
      game_path: '/games/snake',
      category: 'arcade'
    }
  ];

  sampleGames.forEach(game => {
    db.run('INSERT OR IGNORE INTO games (title, description, thumbnail, game_path, category) VALUES (?, ?, ?, ?, ?)', 
      [game.title, game.description, game.thumbnail, game.game_path, game.category]);
  });
});

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 简化的session配置
app.use(session({
  secret: JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// 静态文件服务 - 简化路径
app.use('/static', express.static(path.join(__dirname, '../static')));
app.use('/games', express.static(path.join(__dirname, '../games')));

// 认证中间件
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.session.token;
  
  if (!token) {
    return res.status(401).json({ error: '未授权访问' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '令牌无效' });
    }
    req.user = user;
    next();
  });
};

// API 路由

// 根路由 - 返回主页
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>乐玩小游戏</title>
        <style>
            body { font-family: Arial, sans-serif; text-align: center; margin: 50px; }
            .container { max-width: 800px; margin: 0 auto; }
            .game-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 30px; }
            .game-card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; background: #f9f9f9; }
            .btn { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎮 乐玩小游戏平台</h1>
            <p>欢迎来到我们的休闲游戏聚合平台！</p>
            <div>
                <a href="/admin.html" class="btn">管理后台</a>
                <a href="/api/games" class="btn">游戏列表API</a>
            </div>
            <div class="game-grid">
                <div class="game-card">
                    <h3>🧩 2048</h3>
                    <p>经典数字合成游戏</p>
                </div>
                <div class="game-card">
                    <h3>🐍 贪吃蛇</h3>
                    <p>经典街机游戏</p>
                </div>
            </div>
            <p style="margin-top: 40px; color: #666;">
                平台状态：✅ 正常运行<br>
                部署环境：Vercel 无服务器
            </p>
        </div>
    </body>
    </html>
  `);
});

// 管理员登录
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get('SELECT * FROM admins WHERE username = ?', [username], (err, admin) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '24h' });
    req.session.token = token;
    
    res.json({ success: true, token, user: { id: admin.id, username: admin.username } });
  });
});

// 获取所有游戏 (公开接口)
app.get('/api/games', (req, res) => {
  const { category, search } = req.query;
  let query = 'SELECT * FROM games WHERE is_active = 1';
  const params = [];
  
  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }
  
  if (search) {
    query += ' AND title LIKE ?';
    params.push(`%${search}%`);
  }
  
  query += ' ORDER BY created_at DESC';
  
  db.all(query, params, (err, games) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    res.json(games);
  });
});

// 获取单个游戏信息
app.get('/api/games/:id', (req, res) => {
  const gameId = req.params.id;
  
  db.get('SELECT * FROM games WHERE id = ? AND is_active = 1', [gameId], (err, game) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (!game) {
      return res.status(404).json({ error: '游戏不存在' });
    }
    
    // 增加游玩次数
    db.run('UPDATE games SET play_count = play_count + 1 WHERE id = ?', [gameId]);
    
    res.json(game);
  });
});

// 管理员 - 获取所有游戏
app.get('/api/admin/games', authenticateToken, (req, res) => {
  db.all('SELECT * FROM games ORDER BY created_at DESC', (err, games) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    res.json(games);
  });
});

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: 'Vercel Serverless',
    message: '乐玩小游戏平台运行正常'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : '请稍后重试'
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 导出为Vercel函数
module.exports = app;
