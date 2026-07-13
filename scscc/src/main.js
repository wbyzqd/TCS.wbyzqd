/**
 * 
 * main.js —— 应用入口
 * 装配各模块（渲染、HUD、输入、音效、存储），创建 Game 实例并启动，
 * 同时处理画布的响应式尺寸变化。
 */
(function (SnakeGame) {
  'use strict';

  function boot() {
    const canvas = document.getElementById('game');
    if (!canvas) return;

    const renderer = new SnakeGame.Renderer(canvas);
    const hud = new SnakeGame.HUD();
    const input = new SnakeGame.InputController();
    const audio = new SnakeGame.AudioManager(SnakeGame.Storage.getMuted());

    hud.bind();
    input.attachTouch(document.getElementById('canvas-wrap'));
    input.attachDpad(document.getElementById('dpad'));

    const game = new SnakeGame.Game({ renderer, hud, input, audio, storage: SnakeGame.Storage });

    // 响应式：窗口尺寸变化时重设画布分辨率（防抖）
    let resizeTimer = null;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => renderer.resize(), 100);
    };
    window.addEventListener('resize', onResize);
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => renderer.resize());
      ro.observe(canvas.parentElement);
    }

    window.__snakeGame = game; // 便于调试
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window.SnakeGame = window.SnakeGame || {});
