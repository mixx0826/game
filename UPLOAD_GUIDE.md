# 游戏上传指南 / Game Upload Guide

## 中文版

### 支持的游戏格式

我们的平台支持基于HTML5的浏览器游戏，游戏文件需要打包为ZIP格式上传。

### 文件结构要求

上传的ZIP文件必须包含以下结构：

```
game-name.zip
├── index.html          # 主游戏文件（必需）
├── css/               # 样式文件目录（可选）
│   └── style.css
├── js/                # JavaScript文件目录（可选）
│   └── game.js
├── images/            # 图片资源目录（可选）
│   ├── sprites/
│   └── backgrounds/
├── sounds/            # 音频文件目录（可选）
│   ├── effects/
│   └── music/
├── fonts/             # 字体文件目录（可选）
└── assets/            # 其他资源文件（可选）
```

### 关键要求

1. **入口文件**: 必须包含 `index.html` 作为游戏的入口点
2. **自包含**: 游戏应该是完全自包含的，不依赖外部CDN或网络资源
3. **相对路径**: 所有资源引用必须使用相对路径
4. **文件大小**: 单个ZIP文件大小不超过50MB
5. **兼容性**: 游戏应该在现代浏览器中正常运行

### index.html 示例结构

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Game Title</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div id="gameContainer">
        <!-- 游戏内容 -->
    </div>
    
    <script src="js/game.js"></script>
</body>
</html>
```

### 游戏信息配置

上传时需要提供以下信息：
- **游戏标题**: 简洁明了的游戏名称
- **游戏描述**: 100字以内的游戏介绍
- **游戏分类**: casual（休闲）、puzzle（益智）、action（动作）、arcade（街机）
- **缩略图**: 可选，推荐尺寸 300x200 像素

### 技术建议

1. **响应式设计**: 游戏应该适配不同屏幕尺寸
2. **性能优化**: 优化图片和音频文件大小
3. **错误处理**: 添加适当的错误处理机制
4. **用户体验**: 提供清晰的游戏说明和控制方式

### 常见问题

**Q: 可以使用外部字体库吗？**
A: 建议将字体文件打包到游戏中，避免依赖外部CDN。

**Q: 游戏可以保存数据吗？**
A: 可以使用localStorage保存游戏数据。

**Q: 支持音频文件吗？**
A: 支持，建议使用MP3或OGG格式，文件大小适中。

---

## English Version

### Supported Game Formats

Our platform supports HTML5-based browser games. Game files must be packaged as ZIP files for upload.

### File Structure Requirements

The uploaded ZIP file must contain the following structure:

```
game-name.zip
├── index.html          # Main game file (required)
├── css/               # Stylesheet directory (optional)
│   └── style.css
├── js/                # JavaScript directory (optional)
│   └── game.js
├── images/            # Image assets directory (optional)
│   ├── sprites/
│   └── backgrounds/
├── sounds/            # Audio files directory (optional)
│   ├── effects/
│   └── music/
├── fonts/             # Font files directory (optional)
└── assets/            # Other resource files (optional)
```

### Key Requirements

1. **Entry Point**: Must include `index.html` as the game entry point
2. **Self-contained**: Game should be completely self-contained, not relying on external CDNs or network resources
3. **Relative Paths**: All resource references must use relative paths
4. **File Size**: Single ZIP file size should not exceed 50MB
5. **Compatibility**: Game should run properly in modern browsers

### Sample index.html Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Game Title</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div id="gameContainer">
        <!-- Game content -->
    </div>
    
    <script src="js/game.js"></script>
</body>
</html>
```

### Game Information Configuration

When uploading, you need to provide:
- **Game Title**: Concise game name
- **Game Description**: Game introduction within 100 words
- **Game Category**: casual, puzzle, action, arcade
- **Thumbnail**: Optional, recommended size 300x200 pixels

### Technical Recommendations

1. **Responsive Design**: Game should adapt to different screen sizes
2. **Performance Optimization**: Optimize image and audio file sizes
3. **Error Handling**: Add appropriate error handling mechanisms
4. **User Experience**: Provide clear game instructions and controls

### Common Questions

**Q: Can I use external font libraries?**
A: It's recommended to package font files within the game to avoid dependency on external CDNs.

**Q: Can games save data?**
A: Yes, you can use localStorage to save game data.

**Q: Are audio files supported?**
A: Yes, MP3 or OGG formats are recommended with moderate file sizes. 