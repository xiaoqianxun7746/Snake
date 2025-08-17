class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        this.gameMode = 'single'; // 'single' or 'multi'
        this.gameRunning = false;
        this.gamePaused = false;
        
        // 游戏状态
        this.player1 = this.createPlayer('#4169e1', '#8a2be2', 5, 5); // 蓝到紫渐变
        this.player2 = this.createPlayer('#ff1493', '#ff6347', 25, 15); // 粉到橙渐变
        this.food = [];
        this.reviveFood = []; // 复活食物
        this.gameSpeed = 150;
        
        this.initializeEventListeners();
        this.generateFood();
    }
    
    createPlayer(colorStart, colorEnd, startX, startY) {
        return {
            snake: [{x: startX, y: startY}],
            direction: {x: 0, y: 0},
            nextDirection: {x: 0, y: 0},
            colorStart: colorStart,
            colorEnd: colorEnd,
            score: 0,
            alive: true
        };
    }
    
    initializeEventListeners() {
        // 菜单按钮
        document.getElementById('singlePlayer').addEventListener('click', () => {
            this.startGame('single');
        });
        
        document.getElementById('multiPlayer').addEventListener('click', () => {
            this.startGame('multi');
        });
        
        // 游戏控制按钮
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('backToMenu').addEventListener('click', () => {
            this.backToMenu();
        });
        
        document.getElementById('playAgain').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('backToMenuFromGameOver').addEventListener('click', () => {
            this.backToMenu();
        });
        
        // 键盘控制
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
    }
    
    handleKeyPress(e) {
        if (!this.gameRunning) return;
        
        // 暂停/继续
        if (e.code === 'Space') {
            e.preventDefault();
            this.togglePause();
            return;
        }
        
        if (this.gamePaused) return;
        
        // 玩家1控制 (WASD)
        if (this.gameMode === 'multi') {
            switch(e.code) {
                case 'KeyW':
                    if (this.player1.direction.y === 0) {
                        this.player1.nextDirection = {x: 0, y: -1};
                    }
                    break;
                case 'KeyS':
                    if (this.player1.direction.y === 0) {
                        this.player1.nextDirection = {x: 0, y: 1};
                    }
                    break;
                case 'KeyA':
                    if (this.player1.direction.x === 0) {
                        this.player1.nextDirection = {x: -1, y: 0};
                    }
                    break;
                case 'KeyD':
                    if (this.player1.direction.x === 0) {
                        this.player1.nextDirection = {x: 1, y: 0};
                    }
                    break;
            }
        }
        
        // 玩家2控制 (方向键) 或单人模式
        const player = this.gameMode === 'single' ? this.player1 : this.player2;
        switch(e.code) {
            case 'ArrowUp':
                if (player.direction.y === 0) {
                    player.nextDirection = {x: 0, y: -1};
                }
                break;
            case 'ArrowDown':
                if (player.direction.y === 0) {
                    player.nextDirection = {x: 0, y: 1};
                }
                break;
            case 'ArrowLeft':
                if (player.direction.x === 0) {
                    player.nextDirection = {x: -1, y: 0};
                }
                break;
            case 'ArrowRight':
                if (player.direction.x === 0) {
                    player.nextDirection = {x: 1, y: 0};
                }
                break;
        }
    }
    
    startGame(mode) {
        this.gameMode = mode;
        this.gameRunning = true;
        this.gamePaused = false;
        
        // 重置游戏状态
        this.resetGameState();
        
        // 显示/隐藏界面元素
        document.getElementById('menu').classList.add('hidden');
        document.getElementById('gameArea').classList.remove('hidden');
        document.getElementById('gameOver').classList.add('hidden');
        
        if (mode === 'multi') {
            document.getElementById('player2Score').classList.remove('hidden');
        } else {
            document.getElementById('player2Score').classList.add('hidden');
        }
        
        this.updateScore();
        this.gameLoop();
    }
    
    resetGameState() {
        // 重置玩家1
        this.player1 = this.createPlayer('#4169e1', '#8a2be2', 5, 5);
        this.player1.direction = {x: 1, y: 0};
        this.player1.nextDirection = {x: 1, y: 0};
        
        // 重置玩家2
        this.player2 = this.createPlayer('#ff1493', '#ff6347', 25, 15);
        this.player2.direction = {x: -1, y: 0};
        this.player2.nextDirection = {x: -1, y: 0};
        
        this.food = [];
        this.reviveFood = [];
        this.generateFood();
    }
    
    generateFood() {
        let newFood;
        let validPosition = false;
        
        while (!validPosition) {
            newFood = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * (this.canvas.height / this.gridSize)),
                type: this.getRandomFoodType()
            };
            
            validPosition = true;
            
            // 检查是否与蛇身重叠
            if (this.isPositionOccupied(newFood.x, newFood.y)) {
                validPosition = false;
            }
        }
        
        this.food.push(newFood);
    }
    
    getRandomFoodType() {
        const rand = Math.random();
        if (rand < 0.5) {
            return { color: '#ffd700', score: 10, name: '普通食物' }; // 金色，10分
        } else if (rand < 0.8) {
            return { color: '#ff4500', score: 20, name: '高级食物' }; // 橙红色，20分
        } else {
            return { color: '#9400d3', score: 50, name: '稀有食物' }; // 紫色，50分
        }
    }
    
    generateReviveFood(x, y) {
        if (this.gameMode !== 'multi') return;
        
        const reviveFood = {
            x: x,
            y: y,
            type: { color: '#00ff00', score: 0, name: '复活食物' }, // 绿色复活食物
            timer: 100 // 10秒后消失 (100 * 100ms)
        };
        
        this.reviveFood.push(reviveFood);
    }
    
    isPositionOccupied(x, y) {
        // 检查玩家1的蛇
        for (let segment of this.player1.snake) {
            if (segment.x === x && segment.y === y) {
                return true;
            }
        }
        
        // 检查玩家2的蛇（如果是双人模式）
        if (this.gameMode === 'multi') {
            for (let segment of this.player2.snake) {
                if (segment.x === x && segment.y === y) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    gameLoop() {
        if (!this.gameRunning || this.gamePaused) {
            if (this.gameRunning) {
                setTimeout(() => this.gameLoop(), this.gameSpeed);
            }
            return;
        }
        
        this.update();
        this.draw();
        
        if (this.gameRunning) {
            setTimeout(() => this.gameLoop(), this.gameSpeed);
        }
    }
    
    update() {
        // 更新玩家1
        this.updatePlayer(this.player1);
        
        // 更新玩家2（如果是双人模式）
        if (this.gameMode === 'multi') {
            this.updatePlayer(this.player2);
        }
        
        // 更新复活食物计时器
        this.updateReviveFood();
        
        // 检查是否需要生成复活食物
        this.checkReviveFoodGeneration();
        
        // 检查游戏结束条件
        this.checkGameOver();
        
        // 生成新食物
        if (this.food.length === 0) {
            this.generateFood();
        }
    }
    
    updatePlayer(player) {
        if (!player.alive) return;
        
        // 更新方向
        player.direction = {...player.nextDirection};
        
        // 移动蛇头
        const head = {...player.snake[0]};
        head.x += player.direction.x;
        head.y += player.direction.y;
        
        // 边界穿越（从对侧出现）
        if (head.x < 0) {
            head.x = this.tileCount - 1;
        } else if (head.x >= this.tileCount) {
            head.x = 0;
        }
        
        if (head.y < 0) {
            head.y = Math.floor(this.canvas.height / this.gridSize) - 1;
        } else if (head.y >= this.canvas.height / this.gridSize) {
            head.y = 0;
        }
        
        // 检查自身碰撞
        for (let segment of player.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                player.alive = false;
                return;
            }
        }
        
        // 检查与对方蛇的碰撞（双人模式）
        if (this.gameMode === 'multi') {
            const otherPlayer = player === this.player1 ? this.player2 : this.player1;
            for (let segment of otherPlayer.snake) {
                if (head.x === segment.x && head.y === segment.y) {
                    player.alive = false;
                    return;
                }
            }
        }
        
        player.snake.unshift(head);
        
        // 检查普通食物碰撞
        let ateFood = false;
        for (let i = this.food.length - 1; i >= 0; i--) {
            if (head.x === this.food[i].x && head.y === this.food[i].y) {
                player.score += this.food[i].type.score;
                this.food.splice(i, 1);
                ateFood = true;
                break;
            }
        }
        
        // 检查复活食物碰撞
        if (this.gameMode === 'multi') {
            for (let i = this.reviveFood.length - 1; i >= 0; i--) {
                if (head.x === this.reviveFood[i].x && head.y === this.reviveFood[i].y) {
                    // 复活队友
                    const otherPlayer = player === this.player1 ? this.player2 : this.player1;
                    if (!otherPlayer.alive) {
                        this.revivePlayer(otherPlayer);
                    }
                    this.reviveFood.splice(i, 1);
                    break;
                }
            }
        }
        
        // 如果没有吃到食物，移除尾部
        if (!ateFood) {
            player.snake.pop();
        }
        
        this.updateScore();
    }
    
    revivePlayer(player) {
        // 在安全位置复活玩家
        let reviveX, reviveY;
        let attempts = 0;
        
        do {
            reviveX = Math.floor(Math.random() * this.tileCount);
            reviveY = Math.floor(Math.random() * (this.canvas.height / this.gridSize));
            attempts++;
        } while (this.isPositionOccupied(reviveX, reviveY) && attempts < 50);
        
        player.alive = true;
        player.snake = [{x: reviveX, y: reviveY}];
        player.direction = {x: 1, y: 0};
        player.nextDirection = {x: 1, y: 0};
    }
    
    updateReviveFood() {
        for (let i = this.reviveFood.length - 1; i >= 0; i--) {
            this.reviveFood[i].timer--;
            if (this.reviveFood[i].timer <= 0) {
                this.reviveFood.splice(i, 1);
            }
        }
    }
    
    checkReviveFoodGeneration() {
        if (this.gameMode !== 'multi') return;
        
        // 如果有玩家死亡且没有复活食物，随机生成复活食物
        const hasDeadPlayer = !this.player1.alive || !this.player2.alive;
        if (hasDeadPlayer && this.reviveFood.length === 0 && Math.random() < 0.02) {
            let x, y;
            let attempts = 0;
            
            do {
                x = Math.floor(Math.random() * this.tileCount);
                y = Math.floor(Math.random() * (this.canvas.height / this.gridSize));
                attempts++;
            } while (this.isPositionOccupied(x, y) && attempts < 50);
            
            this.generateReviveFood(x, y);
        }
    }
    
    checkGameOver() {
        if (this.gameMode === 'single') {
            if (!this.player1.alive) {
                this.endGame();
            }
        } else {
            // 双人模式：只有当两个玩家都死亡时才结束游戏
            if (!this.player1.alive && !this.player2.alive) {
                this.endGame();
            }
        }
    }
    
    draw() {
        // 完全清空画布（去掉拖影效果）
        this.ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格（可选）
        this.drawGrid();
        
        // 绘制食物
        this.drawFood();
        
        // 绘制复活食物
        this.drawReviveFood();
        
        // 绘制玩家1的蛇
        this.drawSnake(this.player1);
        
        // 绘制玩家2的蛇（如果是双人模式）
        if (this.gameMode === 'multi') {
            this.drawSnake(this.player2);
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let i = 0; i <= this.canvas.height / this.gridSize; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
    }
    
    drawFood() {
        for (let food of this.food) {
            this.ctx.fillStyle = food.type.color;
            this.ctx.beginPath();
            this.ctx.arc(
                food.x * this.gridSize + this.gridSize / 2,
                food.y * this.gridSize + this.gridSize / 2,
                this.gridSize / 2 - 2,
                0,
                2 * Math.PI
            );
            this.ctx.fill();
            
            // 添加光晕效果
            this.ctx.shadowColor = food.type.color;
            this.ctx.shadowBlur = 8;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            
            // 绘制分数文字
            this.ctx.fillStyle = 'white';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                food.type.score.toString(),
                food.x * this.gridSize + this.gridSize / 2,
                food.y * this.gridSize + this.gridSize / 2 + 3
            );
        }
    }
    
    drawReviveFood() {
        for (let food of this.reviveFood) {
            // 闪烁效果
            const alpha = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
            this.ctx.globalAlpha = alpha;
            
            this.ctx.fillStyle = food.type.color;
            this.ctx.beginPath();
            this.ctx.arc(
                food.x * this.gridSize + this.gridSize / 2,
                food.y * this.gridSize + this.gridSize / 2,
                this.gridSize / 2 - 1,
                0,
                2 * Math.PI
            );
            this.ctx.fill();
            
            // 添加强烈的光晕效果
            this.ctx.shadowColor = food.type.color;
            this.ctx.shadowBlur = 15;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            
            // 绘制十字标记
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            const centerX = food.x * this.gridSize + this.gridSize / 2;
            const centerY = food.y * this.gridSize + this.gridSize / 2;
            
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - 5, centerY);
            this.ctx.lineTo(centerX + 5, centerY);
            this.ctx.moveTo(centerX, centerY - 5);
            this.ctx.lineTo(centerX, centerY + 5);
            this.ctx.stroke();
            
            this.ctx.globalAlpha = 1;
        }
    }
    
    drawSnake(player) {
        if (!player.alive) {
            this.ctx.globalAlpha = 0.5;
        }
        
        player.snake.forEach((segment, index) => {
            // 根据蛇身位置计算颜色渐变比例（从头到尾）
            const ratio = index / Math.max(player.snake.length - 1, 1);
            
            // 使用线性插值计算当前段的颜色
            const color = this.interpolateColor(player.colorStart, player.colorEnd, ratio);
            this.ctx.fillStyle = color;
            
            // 蛇头稍微大一些
            const size = index === 0 ? this.gridSize - 2 : this.gridSize - 4;
            const offset = index === 0 ? 1 : 2;
            
            // 绘制圆角矩形
            this.drawRoundedRect(
                segment.x * this.gridSize + offset,
                segment.y * this.gridSize + offset,
                size,
                size,
                4
            );
            
            // 蛇头添加眼睛
            if (index === 0 && player.alive) {
                this.ctx.fillStyle = 'white';
                const eyeSize = 3;
                this.ctx.beginPath();
                this.ctx.arc(
                    segment.x * this.gridSize + 7,
                    segment.y * this.gridSize + 7,
                    eyeSize / 2,
                    0,
                    2 * Math.PI
                );
                this.ctx.fill();
                
                this.ctx.beginPath();
                this.ctx.arc(
                    segment.x * this.gridSize + 13,
                    segment.y * this.gridSize + 7,
                    eyeSize / 2,
                    0,
                    2 * Math.PI
                );
                this.ctx.fill();
                
                // 眼珠
                this.ctx.fillStyle = 'black';
                this.ctx.beginPath();
                this.ctx.arc(
                    segment.x * this.gridSize + 7,
                    segment.y * this.gridSize + 7,
                    1,
                    0,
                    2 * Math.PI
                );
                this.ctx.fill();
                
                this.ctx.beginPath();
                this.ctx.arc(
                    segment.x * this.gridSize + 13,
                    segment.y * this.gridSize + 7,
                    1,
                    0,
                    2 * Math.PI
                );
                this.ctx.fill();
            }
        });
        
        this.ctx.globalAlpha = 1;
    }
    
    // 颜色插值函数
    interpolateColor(color1, color2, ratio) {
        // 将十六进制颜色转换为RGB
        const hex1 = color1.replace('#', '');
        const hex2 = color2.replace('#', '');
        
        const r1 = parseInt(hex1.substr(0, 2), 16);
        const g1 = parseInt(hex1.substr(2, 2), 16);
        const b1 = parseInt(hex1.substr(4, 2), 16);
        
        const r2 = parseInt(hex2.substr(0, 2), 16);
        const g2 = parseInt(hex2.substr(2, 2), 16);
        const b2 = parseInt(hex2.substr(4, 2), 16);
        
        // 线性插值
        const r = Math.round(r1 + (r2 - r1) * ratio);
        const g = Math.round(g1 + (g2 - g1) * ratio);
        const b = Math.round(b1 + (b2 - b1) * ratio);
        
        // 转换回十六进制
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    drawRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    updateScore() {
        document.querySelector('#player1Score .score-value').textContent = this.player1.score;
        if (this.gameMode === 'multi') {
            document.querySelector('#player2Score .score-value').textContent = this.player2.score;
        }
    }
    
    togglePause() {
        this.gamePaused = !this.gamePaused;
        const pauseBtn = document.getElementById('pauseBtn');
        pauseBtn.textContent = this.gamePaused ? '继续' : '暂停';
        
        const status = document.getElementById('gameStatus');
        status.textContent = this.gamePaused ? '游戏已暂停' : '';
        
        if (!this.gamePaused) {
            this.gameLoop();
        }
    }
    
    restartGame() {
        this.startGame(this.gameMode);
    }
    
    backToMenu() {
        this.gameRunning = false;
        document.getElementById('menu').classList.remove('hidden');
        document.getElementById('gameArea').classList.add('hidden');
        document.getElementById('gameOver').classList.add('hidden');
    }
    
    endGame() {
        this.gameRunning = false;
        
        // 显示游戏结束界面
        document.getElementById('gameArea').classList.add('hidden');
        document.getElementById('gameOver').classList.remove('hidden');
        
        // 显示最终分数
        const finalScoreDiv = document.getElementById('finalScore');
        if (this.gameMode === 'single') {
            finalScoreDiv.innerHTML = `最终分数: ${this.player1.score}`;
        } else {
            let winner = '';
            if (this.player1.alive && !this.player2.alive) {
                winner = '玩家1获胜！';
            } else if (!this.player1.alive && this.player2.alive) {
                winner = '玩家2获胜！';
            } else if (this.player1.score > this.player2.score) {
                winner = '玩家1获胜！';
            } else if (this.player2.score > this.player1.score) {
                winner = '玩家2获胜！';
            } else {
                winner = '平局！';
            }
            
            finalScoreDiv.innerHTML = `
                ${winner}<br>
                玩家1: ${this.player1.score} 分<br>
                玩家2: ${this.player2.score} 分
            `;
        }
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});