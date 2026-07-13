/**
 * InputController.js —— 统一输入层
 * 汇聚键盘（方向键 / WASD / 空格 / 回车）、触屏滑动手势、虚拟方向键，
 * 转换为语义化事件（direction / togglePause / primary）向上层派发。
 * 不直接操作游戏状态，保持与游戏逻辑解耦。
 */
(function (SnakeGame) {
  'use strict';

  const { directions } = SnakeGame.CONFIG;

  class InputController {
    constructor() {
      this.handlers = { direction: null, togglePause: null, primary: null };
      this._touchStart = null;
      this._bindKeyboard();
    }

    // 注册事件回调，支持链式调用
    on(event, fn) {
      this.handlers[event] = fn;
      return this;
    }

    _emitDirection(name) {
      const dir = directions[name];
      if (dir && this.handlers.direction) this.handlers.direction(dir, name);
    }

    _bindKeyboard() {
      window.addEventListener('keydown', (e) => {
        switch (e.key) {
          case 'ArrowUp': case 'w': case 'W':
            this._emitDirection('up'); e.preventDefault(); break;
          case 'ArrowDown': case 's': case 'S':
            this._emitDirection('down'); e.preventDefault(); break;
          case 'ArrowLeft': case 'a': case 'A':
            this._emitDirection('left'); e.preventDefault(); break;
          case 'ArrowRight': case 'd': case 'D':
            this._emitDirection('right'); e.preventDefault(); break;
          case ' ': case 'Spacebar':
            if (this.handlers.togglePause) this.handlers.togglePause();
            e.preventDefault(); break;
          case 'Enter':
            if (this.handlers.primary) this.handlers.primary();
            e.preventDefault(); break;
          default: break;
        }
      }, { passive: false });
    }

    // 在指定元素上绑定滑动手势（移动端方向控制）
    attachTouch(el) {
      if (!el) return;
      const threshold = 24; // 触发方向所需的最小滑动像素
      el.addEventListener('touchstart', (e) => {
        const t = e.changedTouches[0];
        this._touchStart = { x: t.clientX, y: t.clientY };
      }, { passive: true });
      el.addEventListener('touchend', (e) => {
        if (!this._touchStart) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - this._touchStart.x;
        const dy = t.clientY - this._touchStart.y;
        this._touchStart = null;
        if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;
        if (Math.abs(dx) > Math.abs(dy)) this._emitDirection(dx > 0 ? 'right' : 'left');
        else this._emitDirection(dy > 0 ? 'down' : 'up');
      }, { passive: true });
    }

    // 绑定虚拟方向键（元素带 data-dir 属性）
    attachDpad(container) {
      if (!container) return;
      container.querySelectorAll('[data-dir]').forEach((btn) => {
        const fire = (e) => { e.preventDefault(); this._emitDirection(btn.getAttribute('data-dir')); };
        btn.addEventListener('click', fire);
        btn.addEventListener('touchstart', fire, { passive: false });
      });
    }
  }

  SnakeGame.InputController = InputController;
})(window.SnakeGame = window.SnakeGame || {});
