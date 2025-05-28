class Game2048 {
    constructor() {
        this.board = [];
        this.score = 0;
        this.bestScore = localStorage.getItem('2048-best') || 0;
        this.size = 4;
        this.isGameOver = false;
        this.hasWon = false;
        
        this.init();
        this.bindEvents();
        this.updateDisplay();
    }

    init() {
        // 初始化空白棋盘
        this.board = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
        this.score = 0;
        this.isGameOver = false;
        this.hasWon = false;
        
        // 添加两个初始数字
        this.addRandomTile();
        this.addRandomTile();
        
        this.updateDisplay();
        this.hideGameMessage();
    }

    addRandomTile() {
        const emptyCells = [];
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.board[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }
        
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const value = Math.random() < 0.9 ? 2 : 4;
            this.board[randomCell.row][randomCell.col] = value;
            
            // 添加动画效果
            setTimeout(() => {
                const tile = this.getTileElement(randomCell.row, randomCell.col);
                if (tile) {
                    tile.classList.add('tile-new');
                    setTimeout(() => tile.classList.remove('tile-new'), 200);
                }
            }, 50);
        }
    }

    move(direction) {
        if (this.isGameOver) return;
        
        let moved = false;
        const previousBoard = this.board.map(row => [...row]);
        
        switch (direction) {
            case 'up':
                moved = this.moveUp();
                break;
            case 'down':
                moved = this.moveDown();
                break;
            case 'left':
                moved = this.moveLeft();
                break;
            case 'right':
                moved = this.moveRight();
                break;
        }
        
        if (moved) {
            this.addRandomTile();
            this.updateDisplay();
            
            if (this.checkWin() && !this.hasWon) {
                this.hasWon = true;
                this.showWinMessage();
            } else if (this.checkGameOver()) {
                this.isGameOver = true;
                this.showGameOverMessage();
            }
        }
    }

    moveLeft() {
        let moved = false;
        
        for (let row = 0; row < this.size; row++) {
            const line = this.board[row].filter(cell => cell !== 0);
            const merged = [];
            
            for (let i = 0; i < line.length; i++) {
                if (i < line.length - 1 && line[i] === line[i + 1]) {
                    merged.push(line[i] * 2);
                    this.score += line[i] * 2;
                    i++; // 跳过下一个元素
                } else {
                    merged.push(line[i]);
                }
            }
            
            while (merged.length < this.size) {
                merged.push(0);
            }
            
            for (let col = 0; col < this.size; col++) {
                if (this.board[row][col] !== merged[col]) {
                    moved = true;
                }
                this.board[row][col] = merged[col];
            }
        }
        
        return moved;
    }

    moveRight() {
        let moved = false;
        
        for (let row = 0; row < this.size; row++) {
            const line = this.board[row].filter(cell => cell !== 0);
            const merged = [];
            
            for (let i = line.length - 1; i >= 0; i--) {
                if (i > 0 && line[i] === line[i - 1]) {
                    merged.unshift(line[i] * 2);
                    this.score += line[i] * 2;
                    i--; // 跳过下一个元素
                } else {
                    merged.unshift(line[i]);
                }
            }
            
            while (merged.length < this.size) {
                merged.unshift(0);
            }
            
            for (let col = 0; col < this.size; col++) {
                if (this.board[row][col] !== merged[col]) {
                    moved = true;
                }
                this.board[row][col] = merged[col];
            }
        }
        
        return moved;
    }

    moveUp() {
        let moved = false;
        
        for (let col = 0; col < this.size; col++) {
            const line = [];
            for (let row = 0; row < this.size; row++) {
                if (this.board[row][col] !== 0) {
                    line.push(this.board[row][col]);
                }
            }
            
            const merged = [];
            for (let i = 0; i < line.length; i++) {
                if (i < line.length - 1 && line[i] === line[i + 1]) {
                    merged.push(line[i] * 2);
                    this.score += line[i] * 2;
                    i++; // 跳过下一个元素
                } else {
                    merged.push(line[i]);
                }
            }
            
            while (merged.length < this.size) {
                merged.push(0);
            }
            
            for (let row = 0; row < this.size; row++) {
                if (this.board[row][col] !== merged[row]) {
                    moved = true;
                }
                this.board[row][col] = merged[row];
            }
        }
        
        return moved;
    }

    moveDown() {
        let moved = false;
        
        for (let col = 0; col < this.size; col++) {
            const line = [];
            for (let row = 0; row < this.size; row++) {
                if (this.board[row][col] !== 0) {
                    line.push(this.board[row][col]);
                }
            }
            
            const merged = [];
            for (let i = line.length - 1; i >= 0; i--) {
                if (i > 0 && line[i] === line[i - 1]) {
                    merged.unshift(line[i] * 2);
                    this.score += line[i] * 2;
                    i--; // 跳过下一个元素
                } else {
                    merged.unshift(line[i]);
                }
            }
            
            while (merged.length < this.size) {
                merged.unshift(0);
            }
            
            for (let row = 0; row < this.size; row++) {
                if (this.board[row][col] !== merged[row]) {
                    moved = true;
                }
                this.board[row][col] = merged[row];
            }
        }
        
        return moved;
    }

    checkWin() {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.board[row][col] === 2048) {
                    return true;
                }
            }
        }
        return false;
    }

    checkGameOver() {
        // 检查是否还有空格
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.board[row][col] === 0) {
                    return false;
                }
            }
        }
        
        // 检查是否还能合并
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const current = this.board[row][col];
                
                // 检查右边
                if (col < this.size - 1 && this.board[row][col + 1] === current) {
                    return false;
                }
                
                // 检查下面
                if (row < this.size - 1 && this.board[row + 1][col] === current) {
                    return false;
                }
            }
        }
        
        return true;
    }

    updateDisplay() {
        this.updateScore();
        this.updateBoard();
    }

    updateScore() {
        document.getElementById('score').textContent = this.score;
        
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('2048-best', this.bestScore);
        }
        
        document.getElementById('best').textContent = this.bestScore;
    }

    updateBoard() {
        const container = document.getElementById('tile-container');
        container.innerHTML = '';
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const value = this.board[row][col];
                if (value !== 0) {
                    const tile = document.createElement('div');
                    tile.className = `tile tile-${value}${value > 2048 ? ' tile-super' : ''}`;
                    tile.textContent = value;
                    tile.style.left = `${col * 100 + 5}px`;
                    tile.style.top = `${row * 100 + 5}px`;
                    tile.setAttribute('data-row', row);
                    tile.setAttribute('data-col', col);
                    container.appendChild(tile);
                }
            }
        }
    }

    getTileElement(row, col) {
        return document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    showWinMessage() {
        document.getElementById('message-title').textContent = '恭喜获胜！';
        document.getElementById('message-text').textContent = '你达到了2048！继续挑战更高分数吧！';
        document.getElementById('game-message').classList.add('show');
    }

    showGameOverMessage() {
        document.getElementById('message-title').textContent = '游戏结束！';
        document.getElementById('message-text').textContent = `最终得分：${this.score}`;
        document.getElementById('game-message').classList.add('show');
    }

    hideGameMessage() {
        document.getElementById('game-message').classList.remove('show');
    }

    bindEvents() {
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    this.move('up');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.move('down');
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.move('left');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.move('right');
                    break;
            }
        });

        // 触摸事件（移动端支持）
        let startX, startY;
        
        document.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
        });

        document.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;
            
            const touch = e.changedTouches[0];
            const diffX = touch.clientX - startX;
            const diffY = touch.clientY - startY;
            
            const threshold = 50; // 最小滑动距离
            
            if (Math.abs(diffX) > Math.abs(diffY)) {
                // 水平滑动
                if (Math.abs(diffX) > threshold) {
                    if (diffX > 0) {
                        this.move('right');
                    } else {
                        this.move('left');
                    }
                }
            } else {
                // 垂直滑动
                if (Math.abs(diffY) > threshold) {
                    if (diffY > 0) {
                        this.move('down');
                    } else {
                        this.move('up');
                    }
                }
            }
            
            startX = null;
            startY = null;
        });

        // 重新开始按钮
        document.getElementById('restart').addEventListener('click', () => {
            this.init();
        });

        // 再试一次按钮
        document.getElementById('try-again').addEventListener('click', () => {
            this.init();
        });
    }
}

// 游戏启动
document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
}); 