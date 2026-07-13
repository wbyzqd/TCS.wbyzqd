/**
 * 
 * Renderer.js —— Canvas 2D 渲染层
 * 负责按设备像素比初始化画布（高清屏不模糊），并绘制网格背景、
 * 发光食物、带渐变与光晕的蛇身。蛇头/蛇尾使用逐帧插值实现平滑滑动，
 * 而非逐格跳动，从而在固定逻辑步长下获得流畅视觉。
 */
(function (SnakeGame) {
  'use strict';

  const { CONFIG, utils } = SnakeGame;

  class Renderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.cols = CONFIG.grid.cols;
      this.rows = CONFIG.grid.rows;
      this.cell = 20;
      this.size = 400;
      this.food = null;
      this.resize();
    }

    // 依据容器尺寸与 devicePixelRatio 重新设定画布分辨率
    resize() {
      const parent = this.canvas.parentElement;
      const rect = parent.getBoundingClientRect();
      const cssSize = Math.max(200, Math.floor(Math.min(rect.width, rect.height)));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.size = cssSize;
      this.cell = cssSize / this.cols;
      this.canvas.width = Math.floor(cssSize * dpr);
      this.canvas.height = Math.floor(cssSize * dpr);
      this.canvas.style.width = cssSize + 'px';
      this.canvas.style.height = cssSize + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    clear() {
      const c = this.ctx;
      c.fillStyle = CONFIG.colors.background;
      c.fillRect(0, 0, this.size, this.size);
    }

    // 呼吸感网格：整体透明度随时间轻微起伏
    drawGrid(time) {
      const c = this.ctx;
      const breath = 0.5 + 0.5 * Math.sin(time / 1400);
      c.save();
      c.strokeStyle = CONFIG.colors.grid;
      c.globalAlpha = 0.7 + 0.3 * breath;
      c.lineWidth = 1;
      c.beginPath();
      for (let i = 0; i <= this.cols; i++) {
        const p = Math.round(i * this.cell) + 0.5;
        c.moveTo(p, 0); c.lineTo(p, this.size);
        c.moveTo(0, p); c.lineTo(this.size, p);
      }
      c.stroke();
      c.restore();
    }

    _roundRect(x, y, w, h, r) {
      const c = this.ctx;
      r = Math.min(r, w / 2, h / 2);
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    }

    // 脉动发光的食物
    drawFood(time) {
      const f = this.food;
      if (!f || f.x < 0) return;
      const c = this.ctx;
      const s = this.cell;
      const pulse = 0.5 + 0.5 * Math.sin(time / 220);
      const cx = f.x * s + s / 2;
      const cy = f.y * s + s / 2;
      const r = s * 0.30 * (0.85 + 0.2 * pulse);
      c.save();
      c.shadowColor = CONFIG.colors.foodGlow;
      c.shadowBlur = 16 + 12 * pulse;
      c.fillStyle = CONFIG.colors.food;
      c.beginPath();
      c.arc(cx, cy, r, 0, Math.PI * 2);
      c.fill();
      // 高光点
      c.shadowBlur = 0;
      c.fillStyle = 'rgba(255,255,255,0.8)';
      c.beginPath();
      c.arc(cx - r * 0.3, cy - r * 0.3, r * 0.28, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    // 计算第 i 节在插值系数 alpha 下的显示坐标（仅蛇头/蛇尾参与插值）
    _segPos(body, n, i, growing, alpha) {
      if (i === 0) {
        const from = n > 1 ? body[1] : body[0];
        return { x: utils.lerp(from.x, body[0].x, alpha), y: utils.lerp(from.y, body[0].y, alpha) };
      }
      if (i === n - 1 && !growing && n > 1) {
        const to = body[n - 2];
        return { x: utils.lerp(body[i].x, to.x, alpha), y: utils.lerp(body[i].y, to.y, alpha) };
      }
      return { x: body[i].x, y: body[i].y };
    }

    drawSnake(snake, alpha) {
      const c = this.ctx;
      const body = snake.body;
      const n = body.length;
      const s = this.cell;
      const pad = Math.max(1.5, s * 0.1);
      const radius = (s - pad * 2) * 0.34;

      c.save();
      // 从尾到头绘制，使蛇头叠在最上层
      for (let i = n - 1; i >= 0; i--) {
        const t = n === 1 ? 0 : i / (n - 1);
        const p = this._segPos(body, n, i, snake.growing, alpha);
        const x = p.x * s + pad;
        const y = p.y * s + pad;
        const w = s - pad * 2;
        const h = s - pad * 2;
        c.shadowColor = CONFIG.colors.snakeGlow;
        c.shadowBlur = i === 0 ? 22 : 12;
        c.fillStyle = i === 0 ? CONFIG.colors.snakeHead
          : utils.mixColor(CONFIG.colors.snakeBodyStart, CONFIG.colors.snakeBodyEnd, t);
        this._roundRect(x, y, w, h, radius);
        c.fill();
      }
      c.restore();

      this._drawEyes(snake, alpha);
    }

    // 蛇头眼睛，根据行进方向朝前偏移
    _drawEyes(snake, alpha) {
      const c = this.ctx;
      const s = this.cell;
      const body = snake.body;
      const from = body.length > 1 ? body[1] : body[0];
      const hx = utils.lerp(from.x, body[0].x, alpha) * s + s / 2;
      const hy = utils.lerp(from.y, body[0].y, alpha) * s + s / 2;
      const dir = snake.direction;
      const fwd = s * 0.16;      // 沿前进方向偏移
      const side = s * 0.17;     // 左右分离
      const eyeR = Math.max(1.5, s * 0.075);
      const px = dir.y, py = dir.x; // 垂直于前进方向

      const eyes = [
        { x: hx + dir.x * fwd + px * side, y: hy + dir.y * fwd + py * side },
        { x: hx + dir.x * fwd - px * side, y: hy + dir.y * fwd - py * side },
      ];
      c.save();
      c.shadowBlur = 0;
      for (const e of eyes) {
        c.fillStyle = '#ffffff';
        c.beginPath(); c.arc(e.x, e.y, eyeR, 0, Math.PI * 2); c.fill();
        c.fillStyle = CONFIG.colors.eye;
        c.beginPath(); c.arc(e.x + dir.x * eyeR * 0.5, e.y + dir.y * eyeR * 0.5, eyeR * 0.55, 0, Math.PI * 2); c.fill();
      }
      c.restore();
    }

    // 每帧渲染入口。state = { snake, food, alpha }
    render(state, time) {
      this.food = state.food;
      this.clear();
      this.drawGrid(time);
      this.drawFood(time);
      if (state.snake) this.drawSnake(state.snake, state.alpha);
    }
  }

  SnakeGame.Renderer = Renderer;
})(window.SnakeGame = window.SnakeGame || {});
