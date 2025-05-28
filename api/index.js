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
    tag TEXT DEFAULT NULL,
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
      title: '2048经典版',
      description: '经典数字合成游戏，合并相同数字达到2048！挑战你的逻辑思维！',
      thumbnail: '/static/images/default-game.svg',
      game_path: '/games/2048',
      category: 'puzzle',
      tag: 'hot'
    },
    {
      title: '贪吃蛇大作战',
      description: '经典贪吃蛇游戏，控制蛇吃食物成长！越长越有挑战性！',
      thumbnail: '/static/images/default-game.svg',
      game_path: '/games/snake',
      category: 'arcade',
      tag: 'hot'
    },
    {
      title: '俄罗斯方块',
      description: '经典俄罗斯方块游戏，排列方块获得高分，永恒的经典！',
      thumbnail: '/static/images/default-game.svg',
      game_path: '/games/tetris',
      category: 'puzzle',
      tag: 'new'
    },
    {
      title: '太空射击',
      description: '激烈的太空射击游戏，消灭外星人保卫地球！',
      thumbnail: '/static/images/default-game.svg',
      game_path: '/games/space-shooter',
      category: 'action',
      tag: 'new'
    },
    {
      title: '消除泡泡',
      description: '有趣的泡泡消除游戏，三个相同颜色就能消除！',
      thumbnail: '/static/images/default-game.svg',
      game_path: '/games/bubble-shooter',
      category: 'casual',
      tag: null
    },
    {
      title: '跳跃小鸟',
      description: '控制小鸟飞跃障碍物，考验你的反应能力！',
      thumbnail: '/static/images/default-game.svg',
      game_path: '/games/flappy-bird',
      category: 'casual',
      tag: 'top'
    }
  ];

  sampleGames.forEach(game => {
    db.run('INSERT OR IGNORE INTO games (title, description, thumbnail, game_path, category, tag) VALUES (?, ?, ?, ?, ?, ?)', 
      [game.title, game.description, game.thumbnail, game.game_path, game.category, game.tag]);
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

// 管理员后台页面
app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

// 根路由 - 返回主页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 游戏页面路由
app.get('/game/:id', (req, res) => {
  const gameId = req.params.id;
  
  // 简单的游戏页面HTML
  res.send(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>游戏 - 乐玩小游戏平台</title>
        <style>
            body {
                margin: 0;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .game-header {
                background: rgba(255, 255, 255, 0.95);
                border-radius: 15px;
                padding: 20px;
                margin-bottom: 20px;
                text-align: center;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                width: 100%;
                max-width: 1024px;
            }
            .game-container {
                background: white;
                border-radius: 15px;
                padding: 20px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                width: 100%;
                max-width: 1024px;
                min-height: 600px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .game-placeholder {
                text-align: center;
                color: #666;
                padding: 50px;
            }
            .back-btn {
                background: linear-gradient(45deg, #667eea, #764ba2);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 20px;
                text-decoration: none;
                display: inline-block;
                margin-right: 10px;
                transition: all 0.3s ease;
            }
            .back-btn:hover {
                transform: translateY(-2px);
                color: white;
            }
        </style>
    </head>
    <body>
        <div class="game-header">
            <h2>🎮 正在加载游戏 #${gameId}</h2>
            <a href="/" class="back-btn">
                <i class="fas fa-arrow-left"></i> 返回首页
            </a>
        </div>
        
        <div class="game-container">
            <div class="game-placeholder">
                <h3>🎯 游戏开发中</h3>
                <p>由于 Vercel 无服务器环境限制，游戏文件暂时无法正常加载。</p>
                <p>在完整的部署环境中，这里会显示实际的游戏内容。</p>
                <br>
                <a href="/" class="back-btn">返回游戏列表</a>
            </div>
        </div>
        
        <script>
            // 记录游戏访问
            fetch(\`/api/games/${gameId}\`)
                .then(response => response.json())
                .then(game => {
                    if (game.title) {
                        document.title = game.title + ' - 乐玩小游戏平台';
                        document.querySelector('.game-header h2').textContent = '🎮 ' + game.title;
                    }
                })
                .catch(error => console.error('Error loading game info:', error));
        </script>
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
