/**
 * Game.js —— 游戏主控与状态机
 * 维护游戏状态（idle/running/paused/over），驱动 requestAnimationFrame 主循环，
 * 采用"固定时间步长 + 帧插值"保证不同帧率下移动速度一致且视觉平滑：
 * 逻辑按 interval 毫秒推进一步，渲染时用 accumulator/interval 作为插值系数。
 * 负责协调输入、蛇、食物、碰撞检测、计分、提速与渲染。
 */
(function (SnakeGame) {
  'use strict';

  const { CONFIG, utils } = SnakeGame;

  const STATE = { IDLE: 'idle', RUNNING: 'running', PAUSED: 'paused', OVER: 'over' };

  class Game {
    constructor(deps) {
      this.renderer = deps.renderer;
      this.hud = deps.hud;
      this.input = deps.input;
      this.audio = deps.audio;
      this.storage = deps.storage;

      this.snake = new SnakeGame.Snake();
      this.food = new SnakeGame.Food();

      this.state = STATE.IDLE;
      this.score = 0;
      this.foodEaten = 0;
      this.highScore = this.storage.getHighScore();
      this.difficulty = this.storage.getDifficulty();
      this.muted = this.storage.getMuted();

      this.interval = CONFIG.difficulties[this.difficulty].baseInterval;
      this.accumulator = 0;
      this.renderAlpha = 1;
      this.lastTime = 0;

      this._wireInput();
      this._initUI();

      this._loop = this._loop.bind(this);
      requestAnimationFrame(this._loop);
    }

    _initUI() {
      this.audio.setMuted(this.muted);
      this.hud.setMuted(this.muted);
      this.hud.setDifficulty(this.difficulty);
      this.hud.setHighScore(this.highScore);
      this.hud.setScore(0);
      this.hud.setSpeed(this._speedLevel());
      this.food.spawn(this.snake); // 起始画面也显示一个食物
      this.hud.showOverlay(
        '贪吃蛇',
        '方向键 / WASD 移动 · 空格 暂停<br/>收集食物，挑战最高分！',
        '开始游戏',
        'start'
      );
    }

    _wireInput() {
      this.input
        .on('direction', (dir) => {
          if (this.state === STATE.RUNNING && this.snake.setDirection(dir)) this.audio.playTurn();
        })
        .on('togglePause', () => this.togglePause())
        .on('primary', () => this.primary());

      this.hud
        .on('primary', () => { this.audio.unlock(); this.audio.playClick(); this.primary(); })
        .on('togglePause', () => { this.audio.playClick(); this.togglePause(); })
        .on('restart', () => { this.audio.unlock(); this.audio.playClick(); this.restart(); })
        .on('toggleMute', () => this.toggleMute())
        .on('difficulty', (name) => this.setDifficulty(name));
    }

    // 主操作按钮/回车：按当前状态决定开始、继续或重开
    primary() {
      if (this.state === STATE.IDLE) this.start();
      else if (this.state === STATE.OVER) this.restart();
      else if (this.state === STATE.PAUSED) this.resume();
    }

    start() {
      this.audio.unlock();
      this._resetRound();
      this.state = STATE.RUNNING;
      this.hud.hideOverlay();
      this.hud.setPaused(false);
      this.audio.playStart();
      this.lastTime = performance.now();
      this.accumulator = 0;
    }

    restart() { this.start(); }

    _resetRound() {
      this.snake.reset();
      this.score = 0;
      this.foodEaten = 0;
      this.interval = CONFIG.difficulties[this.difficulty].baseInterval;
      this.food.spawn(this.snake);
      this.hud.setScore(0);
      this.hud.setSpeed(this._speedLevel());
    }

    pause() {
      if (this.state !== STATE.RUNNING) return;
      this.state = STATE.PAUSED;
      this.hud.setPaused(true);
      this.hud.showOverlay('已暂停', '按 空格 或 点击 继续 恢复游戏', '继续', 'pause');
    }

    resume() {
      if (this.state !== STATE.PAUSED) return;
      this.state = STATE.RUNNING;
      this.hud.setPaused(false);
      this.hud.hideOverlay();
      this.lastTime = performance.now();
    }

    togglePause() {
      if (this.state === STATE.RUNNING) this.pause();
      else if (this.state === STATE.PAUSED) this.resume();
    }

    gameOver() {
      this.state = STATE.OVER;
      this.audio.playGameOver();
      this.hud.flashGameOver();

      let isRecord = false;
      if (this.score > this.highScore) {
        this.highScore = this.score;
        this.storage.setHighScore(this.highScore);
        this.hud.setHighScore(this.highScore);
        isRecord = true;
      }
      const msg = isRecord
        ? '🏆 新纪录！本局得分 <b>' + this.score + '</b>'
        : '本局得分 <b>' + this.score + '</b> · 最高 ' + this.highScore;
      this.hud.showOverlay('游戏结束', msg, '再来一局', 'over');
    }

    setDifficulty(name) {
      if (!CONFIG.difficulties[name]) return;
      this.difficulty = name;
      this.storage.setDifficulty(name);
      this.hud.setDifficulty(name);
      this.audio.playClick();
      // 仅在非进行中时立即套用新基础速度，避免打断当前对局
      if (this.state !== STATE.RUNNING) {
        this.interval = CONFIG.difficulties[name].baseInterval;
        this.hud.setSpeed(this._speedLevel());
      }
    }

    toggleMute() {
      this.muted = !this.muted;
      this.audio.setMuted(this.muted);
      this.storage.setMuted(this.muted);
      this.hud.setMuted(this.muted);
      if (!this.muted) { this.audio.unlock(); this.audio.playClick(); }
    }

    // 将当前间隔映射为 1~10 的速度等级用于显示
    _speedLevel() {
      const d = CONFIG.difficulties[this.difficulty];
      const span = (d.baseInterval - d.minInterval) || 1;
      const ratio = (d.baseInterval - this.interval) / span;
      return utils.clamp(1 + Math.round(ratio * 9), 1, 10);
    }

    // 随进食数缩短步进间隔（提速），并设下限
    _recomputeInterval() {
      const d = CONFIG.difficulties[this.difficulty];
      this.interval = Math.max(d.minInterval, d.baseInterval - this.foodEaten * d.speedStep);
    }

    // 推进一步逻辑：碰撞检测 -> 进食判定 -> 移动
    _fixedStep() {
      const snake = this.snake;
      const next = snake.peekNextHead();
      const { cols, rows } = CONFIG.grid;

      // 边界（墙体）碰撞
      if (next.x < 0 || next.y < 0 || next.x >= cols || next.y >= rows) {
        this.gameOver();
        return;
      }

      const willGrow = (next.x === this.food.position.x && next.y === this.food.position.y);

      // 自身碰撞（若本步不增长，蛇尾会移开，忽略最后一节）
      if (snake.occupies(next.x, next.y, !willGrow)) {
        this.gameOver();
        return;
      }

      snake.step(willGrow);

      if (willGrow) {
        this.score += CONFIG.scorePerFood;
        this.foodEaten += 1;
        this.hud.setScore(this.score);
        this._recomputeInterval();
        this.hud.setSpeed(this._speedLevel());
        this.audio.playEat();
        if (!this.food.spawn(snake)) { this.gameOver(); return; } // 棋盘填满，通关结束
      }
    }

    _loop(ts) {
      if (this.state === STATE.RUNNING) {
        let dt = ts - this.lastTime;
        this.lastTime = ts;
        // 切换标签页后 dt 可能极大，钳制避免"瞬移"
        if (dt > 250) dt = this.interval;
        this.accumulator += dt;

        let steps = 0;
        while (this.accumulator >= this.interval && steps < 5) {
          this.accumulator -= this.interval;
          this._fixedStep();
          steps++;
          if (this.state !== STATE.RUNNING) break;
        }
        this.renderAlpha = utils.clamp(this.accumulator / this.interval, 0, 1);
      } else {
        this.lastTime = ts;
        // 暂停时冻结插值系数；空闲/结束时对齐到格子
        if (this.state !== STATE.PAUSED) this.renderAlpha = 1;
      }

      this.renderer.render(
        { snake: this.snake, food: this.food.position, alpha: this.renderAlpha },
        ts
      );
      requestAnimationFrame(this._loop);
    }
  }

  SnakeGame.Game = Game;
  SnakeGame.STATE = STATE;
})(window.SnakeGame = window.SnakeGame || {});
