// 游戏主类
class TankBattleGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameOver', 'instructions'
        this.gameMode = 'single'; // 'single', 'multi'
        
        // 游戏对象
        this.players = [];
        this.enemies = [];
        this.bullets = [];
        this.walls = [];
        this.explosions = [];
        this.powerUps = [];
        
        // 游戏设置
        this.settings = {
            canvasWidth: 800,
            canvasHeight: 600,
            tankSize: 30,
            bulletSpeed: 8,
            tankSpeed: 3,
            maxEnemies: 3,
            lives: 3,
            targetScore: 10
        };
        
        // 分数系统
        this.scores = {
            player1: 0,
            player2: 0,
            lives: this.settings.lives
        };
        
        // 输入处理
        this.keys = {};
        this.mobileControls = {
            direction: null,
            fire: false
        };
        
        // 游戏时间和难度
        this.gameTime = 0;
        this.lastEnemySpawn = 0;
        this.enemySpawnInterval = 3000; // 3 seconds
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.createWalls();
        this.updateUI();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.handleKeyPress(e);
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // 菜单按钮事件
        document.getElementById('startSingleBtn').addEventListener('click', () => {
            this.startGame('single');
        });
        
        document.getElementById('startMultiBtn').addEventListener('click', () => {
            this.startGame('multi');
        });
        
        document.getElementById('instructionsBtn').addEventListener('click', () => {
            this.showInstructions();
        });
        
        document.getElementById('backFromInstructionsBtn').addEventListener('click', () => {
            this.showMenu();
        });
        
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.pauseGame();
        });
        
        document.getElementById('resumeBtn').addEventListener('click', () => {
            this.resumeGame();
        });
        
        document.getElementById('pauseToMenuBtn').addEventListener('click', () => {
            this.backToMenu();
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('backToMenuBtn').addEventListener('click', () => {
            this.backToMenu();
        });
        
        // 移动端控制
        this.setupMobileControls();
    }
    
    setupMobileControls() {
        const dpadButtons = document.querySelectorAll('.dpad-btn');
        const fireButton = document.getElementById('mobileFireBtn');
        
        dpadButtons.forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.mobileControls.direction = btn.dataset.direction;
            });
            
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.mobileControls.direction = null;
            });
        });
        
        fireButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.mobileControls.fire = true;
        });
        
        fireButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.mobileControls.fire = false;
        });
    }
    
    handleKeyPress(e) {
        if (e.code === 'Escape') {
            if (this.gameState === 'playing') {
                this.pauseGame();
            } else if (this.gameState === 'paused') {
                this.resumeGame();
            }
        }
    }
    
    startGame(mode) {
        this.gameMode = mode;
        this.gameState = 'playing';
        this.resetGame();
        this.showGameArea();
    }
    
    resetGame() {
        // 重置分数
        this.scores = {
            player1: 0,
            player2: 0,
            lives: this.settings.lives
        };
        
        // 清空游戏对象
        this.players = [];
        this.enemies = [];
        this.bullets = [];
        this.explosions = [];
        this.powerUps = [];
        
        // 创建玩家
        this.createPlayers();
        
        // 重置时间
        this.gameTime = 0;
        this.lastEnemySpawn = 0;
        
        this.updateUI();
    }
    
    createPlayers() {
        // 玩家1
        const player1 = new Tank(100, 500, 0, 'player1', '#00ff00');
        player1.controls = {
            up: 'KeyW',
            down: 'KeyS',
            left: 'KeyA',
            right: 'KeyD',
            fire: 'Space'
        };
        this.players.push(player1);
        
        // 玩家2 (仅在双人模式下)
        if (this.gameMode === 'multi') {
            const player2 = new Tank(700, 500, 0, 'player2', '#0088ff');
            player2.controls = {
                up: 'ArrowUp',
                down: 'ArrowDown',
                left: 'ArrowLeft',
                right: 'ArrowRight',
                fire: 'Enter'
            };
            this.players.push(player2);
        }
    }
    
    createWalls() {
        this.walls = [];
        
        // 创建墙壁布局
        const wallPattern = [
            // 外围墙壁
            {x: 0, y: 0, width: this.settings.canvasWidth, height: 20},
            {x: 0, y: this.settings.canvasHeight - 20, width: this.settings.canvasWidth, height: 20},
            {x: 0, y: 0, width: 20, height: this.settings.canvasHeight},
            {x: this.settings.canvasWidth - 20, y: 0, width: 20, height: this.settings.canvasHeight},
            
            // 内部障碍物
            {x: 200, y: 150, width: 80, height: 20},
            {x: 520, y: 150, width: 80, height: 20},
            {x: 360, y: 250, width: 80, height: 80},
            {x: 150, y: 350, width: 20, height: 100},
            {x: 630, y: 350, width: 20, height: 100},
            {x: 300, y: 450, width: 200, height: 20}
        ];
        
        wallPattern.forEach(wall => {
            this.walls.push(new Wall(wall.x, wall.y, wall.width, wall.height));
        });
    }
    
    spawnEnemy() {
        if (this.enemies.length >= this.settings.maxEnemies) return;
        
        const spawnPoints = [
            {x: 50, y: 50},
            {x: 750, y: 50},
            {x: 400, y: 50}
        ];
        
        const spawnPoint = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
        const enemy = new Tank(spawnPoint.x, spawnPoint.y, Math.PI, 'enemy', '#ff4444');
        enemy.isEnemy = true;
        enemy.aiTarget = this.players[0]; // 主要攻击玩家1
        
        this.enemies.push(enemy);
    }
    
    gameLoop() {
        if (this.gameState === 'playing') {
            this.update();
        }
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        this.gameTime += 16; // 假设60FPS
        
        // 生成敌人
        if (this.gameTime - this.lastEnemySpawn > this.enemySpawnInterval) {
            this.spawnEnemy();
            this.lastEnemySpawn = this.gameTime;
        }
        
        // 更新玩家
        this.players.forEach(player => {
            if (player.isAlive) {
                this.updateTank(player);
            }
        });
        
        // 更新敌人
        this.enemies.forEach(enemy => {
            if (enemy.isAlive) {
                this.updateEnemyAI(enemy);
                this.updateTank(enemy);
            }
        });
        
        // 更新子弹
        this.bullets.forEach((bullet, index) => {
            bullet.update();
            
            // 检查边界
            if (bullet.x < 0 || bullet.x > this.settings.canvasWidth || 
                bullet.y < 0 || bullet.y > this.settings.canvasHeight) {
                this.bullets.splice(index, 1);
                return;
            }
            
            // 检查碰撞
            this.checkBulletCollisions(bullet, index);
        });
        
        // 更新爆炸效果
        this.explosions.forEach((explosion, index) => {
            explosion.update();
            if (explosion.isFinished) {
                this.explosions.splice(index, 1);
            }
        });
        
        // 清理死亡的敌人
        this.enemies = this.enemies.filter(enemy => enemy.isAlive);
        
        // 检查游戏结束条件
        this.checkGameOver();
        
        this.updateUI();
    }
    
    updateTank(tank) {
        if (tank.type === 'player1') {
            this.handlePlayerInput(tank, tank.controls);
        } else if (tank.type === 'player2') {
            this.handlePlayerInput(tank, tank.controls);
        }
        
        tank.update();
        
        // 检查墙壁碰撞
        this.checkWallCollisions(tank);
    }
    
    handlePlayerInput(tank, controls) {
        let moving = false;
        
        // 键盘控制
        if (this.keys[controls.up]) {
            tank.moveForward();
            moving = true;
        }
        if (this.keys[controls.down]) {
            tank.moveBackward();
            moving = true;
        }
        if (this.keys[controls.left]) {
            tank.turnLeft();
        }
        if (this.keys[controls.right]) {
            tank.turnRight();
        }
        
        // 移动端控制 (仅对玩家1)
        if (tank.type === 'player1' && this.mobileControls.direction) {
            switch (this.mobileControls.direction) {
                case 'up':
                    tank.moveForward();
                    moving = true;
                    break;
                case 'down':
                    tank.moveBackward();
                    moving = true;
                    break;
                case 'left':
                    tank.turnLeft();
                    break;
                case 'right':
                    tank.turnRight();
                    break;
            }
        }
        
        // 射击
        if (this.keys[controls.fire] || (tank.type === 'player1' && this.mobileControls.fire)) {
            if (tank.canFire()) {
                this.fireBullet(tank);
            }
        }
    }
    
    updateEnemyAI(enemy) {
        if (!enemy.aiTarget || !enemy.aiTarget.isAlive) {
            enemy.aiTarget = this.players.find(p => p.isAlive);
        }
        
        if (!enemy.aiTarget) return;
        
        const target = enemy.aiTarget;
        const dx = target.x - enemy.x;
        const dy = target.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const targetAngle = Math.atan2(dy, dx);
        
        // 简单AI：面向玩家并移动/射击
        const angleDiff = this.normalizeAngle(targetAngle - enemy.angle);
        
        if (Math.abs(angleDiff) > 0.1) {
            if (angleDiff > 0) {
                enemy.turnRight();
            } else {
                enemy.turnLeft();
            }
        } else {
            if (distance > 150) {
                enemy.moveForward();
            }
            
            // 射击
            if (enemy.canFire() && distance < 300) {
                this.fireBullet(enemy);
            }
        }
    }
    
    normalizeAngle(angle) {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    }
    
    fireBullet(tank) {
        const bullet = new Bullet(
            tank.x + Math.cos(tank.angle) * tank.size,
            tank.y + Math.sin(tank.angle) * tank.size,
            tank.angle,
            tank.type
        );
        this.bullets.push(bullet);
        tank.lastFireTime = this.gameTime;
    }
    
    checkBulletCollisions(bullet, bulletIndex) {
        // 检查与墙壁的碰撞
        for (let wall of this.walls) {
            if (this.checkCollision(bullet, wall)) {
                this.bullets.splice(bulletIndex, 1);
                this.createExplosion(bullet.x, bullet.y, 'small');
                return;
            }
        }
        
        // 检查与坦克的碰撞
        const allTanks = [...this.players, ...this.enemies];
        for (let tank of allTanks) {
            if (tank.isAlive && bullet.owner !== tank.type && 
                this.checkCollision(bullet, tank)) {
                this.bullets.splice(bulletIndex, 1);
                this.hitTank(tank, bullet);
                return;
            }
        }
    }
    
    hitTank(tank, bullet) {
        this.createExplosion(tank.x, tank.y, 'large');
        tank.isAlive = false;
        
        if (tank.type.startsWith('player')) {
            this.scores.lives--;
            if (this.scores.lives > 0) {
                // 重生玩家
                setTimeout(() => {
                    tank.isAlive = true;
                    tank.x = tank.type === 'player1' ? 100 : 700;
                    tank.y = 500;
                    tank.angle = 0;
                }, 2000);
            }
        } else if (tank.type === 'enemy') {
            // 给击杀敌人的玩家加分
            if (bullet.owner === 'player1') {
                this.scores.player1 += 10;
            } else if (bullet.owner === 'player2') {
                this.scores.player2 += 10;
            }
        }
    }
    
    checkWallCollisions(tank) {
        for (let wall of this.walls) {
            if (this.checkCollision(tank, wall)) {
                // 简单的推回处理
                tank.x = tank.prevX;
                tank.y = tank.prevY;
                break;
            }
        }
    }
    
    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.size > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.size > obj2.y;
    }
    
    createExplosion(x, y, size) {
        this.explosions.push(new Explosion(x, y, size));
    }
    
    checkGameOver() {
        if (this.scores.lives <= 0 && !this.players.some(p => p.isAlive)) {
            this.gameState = 'gameOver';
            this.showGameOver('Game Over!', 'Final Score: ' + this.scores.player1);
        } else if (this.gameMode === 'multi') {
            if (this.scores.player1 >= this.settings.targetScore) {
                this.gameState = 'gameOver';
                this.showGameOver('Player 1 Wins!', 'Score: ' + this.scores.player1);
            } else if (this.scores.player2 >= this.settings.targetScore) {
                this.gameState = 'gameOver';
                this.showGameOver('Player 2 Wins!', 'Score: ' + this.scores.player2);
            }
        }
    }
    
    render() {
        // 清除画布
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.settings.canvasWidth, this.settings.canvasHeight);
        
        if (this.gameState === 'playing' || this.gameState === 'paused') {
            // 绘制墙壁
            this.walls.forEach(wall => wall.render(this.ctx));
            
            // 绘制坦克
            this.players.forEach(player => {
                if (player.isAlive) player.render(this.ctx);
            });
            this.enemies.forEach(enemy => {
                if (enemy.isAlive) enemy.render(this.ctx);
            });
            
            // 绘制子弹
            this.bullets.forEach(bullet => bullet.render(this.ctx));
            
            // 绘制爆炸效果
            this.explosions.forEach(explosion => explosion.render(this.ctx));
            
            // 绘制暂停覆盖
            if (this.gameState === 'paused') {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.fillRect(0, 0, this.settings.canvasWidth, this.settings.canvasHeight);
                
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '48px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('PAUSED', this.settings.canvasWidth / 2, this.settings.canvasHeight / 2);
            }
        }
    }
    
    updateUI() {
        document.getElementById('player1Score').textContent = this.scores.player1;
        document.getElementById('player2Score').textContent = this.scores.player2;
        document.getElementById('livesCount').textContent = this.scores.lives;
    }
    
    showMenu() {
        this.gameState = 'menu';
        document.getElementById('startMenu').classList.remove('hidden');
        document.getElementById('gameOverMenu').classList.add('hidden');
        document.getElementById('instructionsMenu').classList.add('hidden');
        document.getElementById('pauseMenu').classList.add('hidden');
    }
    
    showGameArea() {
        document.getElementById('startMenu').classList.add('hidden');
        document.getElementById('gameOverMenu').classList.add('hidden');
        document.getElementById('instructionsMenu').classList.add('hidden');
        document.getElementById('pauseMenu').classList.add('hidden');
    }
    
    showInstructions() {
        this.gameState = 'instructions';
        document.getElementById('startMenu').classList.add('hidden');
        document.getElementById('instructionsMenu').classList.remove('hidden');
    }
    
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('pauseMenu').classList.remove('hidden');
        }
    }
    
    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            document.getElementById('pauseMenu').classList.add('hidden');
        }
    }
    
    showGameOver(title, message) {
        document.getElementById('gameOverMessage').textContent = title;
        document.getElementById('finalScore').textContent = message;
        document.getElementById('gameOverMenu').classList.remove('hidden');
    }
    
    restartGame() {
        this.startGame(this.gameMode);
    }
    
    backToMenu() {
        this.showMenu();
    }
}

// 坦克类
class Tank {
    constructor(x, y, angle, type, color) {
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
        this.angle = angle;
        this.type = type;
        this.color = color;
        this.size = 30;
        this.speed = 3;
        this.turnSpeed = 0.1;
        this.isAlive = true;
        this.lastFireTime = 0;
        this.fireRate = 500; // 毫秒
        this.controls = null;
        this.isEnemy = false;
        this.aiTarget = null;
    }
    
    update() {
        this.prevX = this.x;
        this.prevY = this.y;
    }
    
    moveForward() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    }
    
    moveBackward() {
        this.x -= Math.cos(this.angle) * this.speed;
        this.y -= Math.sin(this.angle) * this.speed;
    }
    
    turnLeft() {
        this.angle -= this.turnSpeed;
    }
    
    turnRight() {
        this.angle += this.turnSpeed;
    }
    
    canFire() {
        return Date.now() - this.lastFireTime > this.fireRate;
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
        ctx.rotate(this.angle);
        
        // 绘制坦克身体
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        
        // 绘制炮管
        ctx.fillStyle = '#888';
        ctx.fillRect(0, -3, this.size / 2, 6);
        
        // 绘制中心
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// 子弹类
class Bullet {
    constructor(x, y, angle, owner) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.owner = owner;
        this.size = 5;
        this.speed = 8;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
    }
    
    render(ctx) {
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 墙壁类
class Wall {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    
    render(ctx) {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 绘制砖块纹理
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        for (let i = 0; i < this.width; i += 20) {
            for (let j = 0; j < this.height; j += 10) {
                ctx.strokeRect(this.x + i, this.y + j, 20, 10);
            }
        }
    }
}

// 爆炸效果类
class Explosion {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size === 'large' ? 40 : 20;
        this.particles = [];
        this.duration = 30;
        this.age = 0;
        this.isFinished = false;
        
        // 创建粒子
        const particleCount = size === 'large' ? 15 : 8;
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: this.duration,
                color: `hsl(${Math.random() * 60}, 100%, 50%)` // 红-黄色调
            });
        }
    }
    
    update() {
        this.age++;
        
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vx *= 0.95; // 摩擦力
            particle.vy *= 0.95;
            particle.life--;
        });
        
        this.particles = this.particles.filter(p => p.life > 0);
        
        if (this.age > this.duration || this.particles.length === 0) {
            this.isFinished = true;
        }
    }
    
    render(ctx) {
        this.particles.forEach(particle => {
            const alpha = particle.life / this.duration;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }
}

// 启动游戏
window.addEventListener('load', () => {
    new TankBattleGame();
}); 