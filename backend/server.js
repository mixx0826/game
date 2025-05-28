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
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // 支持ZIP文件和图片文件
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
    fileSize: 50 * 1024 * 1024 // 50MB限制
  }
});

// 数据库初始化
const db = new sqlite3.Database('./game_platform.db');

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
});

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// 静态文件服务
app.use('/static', express.static(path.join(__dirname, '../static')));
app.use('/games', express.static(path.join(__dirname, '../games')));
app.use('/', express.static(path.join(__dirname, '../frontend')));

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

// 管理员 - 更新游戏状态
app.put('/api/admin/games/:id', authenticateToken, (req, res) => {
  const gameId = req.params.id;
  const { is_active } = req.body;
  
  db.run(
    'UPDATE games SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [is_active ? 1 : 0, gameId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '更新失败' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: '游戏不存在' });
      }
      
      res.json({ success: true, message: '状态更新成功' });
    }
  );
});

// 管理员 - 删除游戏
app.delete('/api/admin/games/:id', authenticateToken, (req, res) => {
  const gameId = req.params.id;
  
  // 先获取游戏信息，用于删除文件
  db.get('SELECT * FROM games WHERE id = ?', [gameId], (err, game) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (!game) {
      return res.status(404).json({ error: '游戏不存在' });
    }
    
    // 删除数据库记录
    db.run('DELETE FROM games WHERE id = ?', [gameId], function(err) {
      if (err) {
        return res.status(500).json({ error: '删除失败' });
      }
      
      // 删除游戏文件夹
      if (game.game_path) {
        const gamePath = path.join(__dirname, '../', game.game_path);
        if (fs.existsSync(gamePath)) {
          try {
            fs.rmSync(gamePath, { recursive: true, force: true });
          } catch (error) {
            console.error('删除游戏文件失败:', error);
          }
        }
      }
      
      res.json({ success: true, message: '删除成功' });
    });
  });
});

// 管理员 - 上传游戏
app.post('/api/admin/games/upload', authenticateToken, upload.fields([
  { name: 'gameFile', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const gameFile = req.files && req.files.gameFile ? req.files.gameFile[0] : null;
    const thumbnailFile = req.files && req.files.thumbnail ? req.files.thumbnail[0] : null;
    
    if (!gameFile) {
      return res.status(400).json({ error: '请选择游戏文件' });
    }
    
    if (!title) {
      return res.status(400).json({ error: '请输入游戏名称' });
    }
    
    // 创建游戏目录
    const gameDir = `games/${Date.now()}-${title.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const gamePath = path.join(__dirname, '../', gameDir);
    
    if (!fs.existsSync(gamePath)) {
      fs.mkdirSync(gamePath, { recursive: true });
    }
    
    // 解压ZIP文件
    await new Promise((resolve, reject) => {
      fs.createReadStream(gameFile.path)
        .pipe(unzipper.Extract({ path: gamePath }))
        .on('close', resolve)
        .on('error', reject);
    });
    
    // 智能检测index.html文件
    function findIndexFile(dir) {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      
      // 首先在当前目录查找index.html (大小写不敏感)
      for (const file of files) {
        if (file.isFile() && file.name.toLowerCase() === 'index.html') {
          return path.join(dir, file.name);
        }
      }
      
      // 如果当前目录没有，递归查找子目录
      for (const file of files) {
        if (file.isDirectory()) {
          const subDir = path.join(dir, file.name);
          const indexPath = findIndexFile(subDir);
          if (indexPath) {
            return indexPath;
          }
        }
      }
      
      return null;
    }
    
    const indexPath = findIndexFile(gamePath);
    if (!indexPath) {
      // 清理文件
      fs.rmSync(gamePath, { recursive: true, force: true });
      fs.unlinkSync(gameFile.path);
      if (thumbnailFile) fs.unlinkSync(thumbnailFile.path);
      return res.status(400).json({ error: 'ZIP文件中必须包含index.html文件' });
    }
    
    // 如果index.html在子目录中，需要调整游戏路径
    const relativePath = path.relative(gamePath, indexPath);
    const gameIndexPath = `${gameDir}/${relativePath.replace(/\\/g, '/')}`;
    
    // 处理缩略图
    let thumbnail = null;
    if (thumbnailFile) {
      // 使用上传的缩略图
      const thumbnailExt = path.extname(thumbnailFile.originalname);
      const thumbnailName = `thumbnail${thumbnailExt}`;
      const thumbnailDestPath = path.join(gamePath, thumbnailName);
      fs.copyFileSync(thumbnailFile.path, thumbnailDestPath);
      fs.unlinkSync(thumbnailFile.path);
      thumbnail = `/${gameDir}/${thumbnailName}`;
    } else {
      // 查找ZIP中的缩略图
      const thumbnailFiles = ['thumbnail.png', 'thumbnail.jpg', 'thumbnail.jpeg', 'icon.png', 'icon.jpg'];
      for (const thumbFile of thumbnailFiles) {
        const thumbPath = path.join(gamePath, thumbFile);
        if (fs.existsSync(thumbPath)) {
          thumbnail = `/${gameDir}/${thumbFile}`;
          break;
        }
      }
    }
    
    // 保存到数据库
    db.run(
      'INSERT INTO games (title, description, thumbnail, game_path, category) VALUES (?, ?, ?, ?, ?)',
      [title, description || '', thumbnail, gameIndexPath, category || 'casual'],
      function(err) {
        if (err) {
          console.error('保存游戏到数据库失败:', err);
          // 清理文件
          fs.rmSync(gamePath, { recursive: true, force: true });
          fs.unlinkSync(gameFile.path);
          return res.status(500).json({ error: '保存游戏失败' });
        }
        
        // 删除上传的ZIP文件
        fs.unlinkSync(gameFile.path);
        
        res.json({ 
          success: true, 
          message: '游戏上传成功',
          gameId: this.lastID
        });
      }
    );
    
  } catch (error) {
    console.error('上传游戏失败:', error);
    
    // 清理文件
    if (req.files) {
      if (req.files.gameFile) {
        try { fs.unlinkSync(req.files.gameFile[0].path); } catch (e) {}
      }
      if (req.files.thumbnail) {
        try { fs.unlinkSync(req.files.thumbnail[0].path); } catch (e) {}
      }
    }
    
    res.status(500).json({ error: '上传失败: ' + error.message });
  }
});

// 管理员 - 获取仪表盘数据
app.get('/api/admin/dashboard', authenticateToken, (req, res) => {
  db.all(`
    SELECT 
      (SELECT COUNT(*) FROM games) as total_games,
      (SELECT COUNT(*) FROM games WHERE is_active = 1) as active_games,
      (SELECT SUM(play_count) FROM games) as total_plays
  `, [], (err, stats) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    db.all('SELECT title, play_count FROM games WHERE is_active = 1 ORDER BY play_count DESC LIMIT 10', (err, popularGames) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      
      res.json({
        stats: stats[0] || { total_games: 0, active_games: 0, total_plays: 0 },
        popularGames: popularGames || []
      });
    });
  });
});

// 广告配置相关接口
app.get('/api/ad-configs', (req, res) => {
  db.all('SELECT * FROM ad_configs WHERE is_active = 1', (err, configs) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    res.json(configs);
  });
});

app.post('/api/admin/ad-configs', authenticateToken, (req, res) => {
  const { position, ad_code } = req.body;
  
  db.run(
    'INSERT OR REPLACE INTO ad_configs (position, ad_code, is_active) VALUES (?, ?, 1)',
    [position, ad_code],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '保存失败' });
      }
      res.json({ success: true, message: '广告配置保存成功' });
    }
  );
});

// 游戏播放页面路由
app.get('/game/:id', (req, res) => {
  const gameId = req.params.id;
  
  db.get('SELECT * FROM games WHERE id = ? AND is_active = 1', [gameId], (err, game) => {
    if (err) {
      console.error('数据库错误:', err);
      return res.status(500).send('内部服务器错误');
    }
    
    if (!game) {
      return res.status(404).send('游戏不存在');
    }
    
    // 返回游戏页面HTML
    const gamePageHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${game.title} - Fun Games</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #1a1a1a;
            overflow: hidden;
        }
        .game-container {
            position: relative;
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .game-header {
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 1000;
        }
        .game-frame {
            flex: 1;
            border: none;
            width: 100%;
            height: calc(100vh - 60px);
        }
        .back-btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        .back-btn:hover {
            background: #0056b3;
            color: white;
            text-decoration: none;
        }
        .game-info {
            display: flex;
            align-items: center;
            gap: 15px;
        }
    </style>
</head>
<body>
    <div class="game-container">
        <div class="game-header">
            <div class="game-info">
                <a href="/" class="back-btn">
                    <i class="fas fa-arrow-left"></i>
                    返回游戏列表
                </a>
                <h4 class="mb-0">${game.title}</h4>
            </div>
            <div class="game-stats">
                <small><i class="fas fa-eye"></i> ${game.play_count || 0} 次游玩</small>
            </div>
        </div>
        <iframe src="/${game.game_path}" class="game-frame" allowfullscreen></iframe>
    </div>
    
    <script>
        // 增加游戏播放次数
        fetch('/api/games/${gameId}/play', {
            method: 'POST'
        }).catch(error => console.error('Error updating play count:', error));
        
        // 键盘快捷键
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                window.close();
            }
        });
    </script>
</body>
</html>`;
    
    res.send(gamePageHtml);
  });
});

// 增加游戏播放次数的API
app.post('/api/games/:id/play', (req, res) => {
  const gameId = req.params.id;
  
  db.run('UPDATE games SET play_count = play_count + 1 WHERE id = ? AND is_active = 1', [gameId], function(err) {
    if (err) {
      console.error('更新播放次数失败:', err);
      return res.status(500).json({ error: '更新失败' });
    }
    
    res.json({ success: true, playCount: this.changes });
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log('默认管理员账户: admin / admin123');
});

module.exports = app;
