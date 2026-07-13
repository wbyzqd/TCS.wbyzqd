/**
 * 
 * HUD.js —— 界面（DOM）层
 * 管理分数/最高分显示、状态遮罩文案切换、按钮与难度控件的事件绑定，
 * 以及游戏结束时的抖动反馈。与游戏逻辑通过回调解耦。
 */
(function (SnakeGame) {
  'use strict';

  class HUD {
    constructor() {
      this.scoreEl = document.getElementById('score');
      this.highEl = document.getElementById('high-score');
      this.speedEl = document.getElementById('speed-level');

      this.overlay = document.getElementById('overlay');
      this.overlayTitle = document.getElementById('overlay-title');
      this.overlayText = document.getElementById('overlay-text');
      this.overlayBtn = document.getElementById('overlay-btn');

      this.startBtn = document.getElementById('btn-start');
      this.pauseBtn = document.getElementById('btn-pause');
      this.restartBtn = document.getElementById('btn-restart');
      this.muteBtn = document.getElementById('btn-mute');

      this.diffButtons = Array.prototype.slice.call(document.querySelectorAll('[data-diff]'));
      this.canvasWrap = document.getElementById('canvas-wrap');

      this.handlers = {};
    }

    on(evt, fn) { this.handlers[evt] = fn; return this; }

    bind() {
      const fire = (name) => () => { if (this.handlers[name]) this.handlers[name](); };
      this.overlayBtn.addEventListener('click', fire('primary'));
      this.startBtn.addEventListener('click', fire('primary'));
      this.pauseBtn.addEventListener('click', fire('togglePause'));
      this.restartBtn.addEventListener('click', fire('restart'));
      this.muteBtn.addEventListener('click', fire('toggleMute'));
      this.diffButtons.forEach((b) => {
        b.addEventListener('click', () => {
          if (this.handlers.difficulty) this.handlers.difficulty(b.getAttribute('data-diff'));
        });
      });
    }

    setScore(v) {
      this.scoreEl.textContent = v;
      // 重置并重新触发跳动动画
      this.scoreEl.classList.remove('pop');
      void this.scoreEl.offsetWidth;
      this.scoreEl.classList.add('pop');
    }

    setHighScore(v) { this.highEl.textContent = v; }

    setSpeed(level) { if (this.speedEl) this.speedEl.textContent = level; }

    setMuted(muted) {
      this.muteBtn.textContent = muted ? '🔇' : '🔊';
      this.muteBtn.setAttribute('aria-pressed', String(!!muted));
    }

    setDifficulty(name) {
      this.diffButtons.forEach((b) => b.classList.toggle('active', b.getAttribute('data-diff') === name));
    }

    setPaused(isPaused) {
      this.pauseBtn.textContent = isPaused ? '继续' : '暂停';
    }

    showOverlay(title, html, btnText, variant) {
      this.overlayTitle.textContent = title;
      this.overlayText.innerHTML = html;
      this.overlayBtn.textContent = btnText;
      this.overlay.classList.remove('hidden', 'variant-over', 'variant-start', 'variant-pause');
      if (variant) this.overlay.classList.add('variant-' + variant);
    }

    hideOverlay() {
      this.overlay.classList.add('hidden');
    }

    flashGameOver() {
      if (!this.canvasWrap) return;
      this.canvasWrap.classList.remove('shake');
      void this.canvasWrap.offsetWidth;
      this.canvasWrap.classList.add('shake');
    }
  }

  SnakeGame.HUD = HUD;
})(window.SnakeGame = window.SnakeGame || {});
