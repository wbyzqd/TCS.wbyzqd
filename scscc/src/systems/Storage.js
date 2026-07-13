
/**
 * Storage.js —— localStorage 持久化封装
 * 负责最高分、难度、静音偏好的读写。
 * 所有访问都包裹 try/catch，并在 localStorage 不可用时（如隐私模式、file:// 限制）
 * 自动降级到内存存储，保证主流程不中断。
 */
(function (SnakeGame) {
  'use strict';

  const { storageKeys, difficulties, defaultDifficulty } = SnakeGame.CONFIG;

  // 内存兜底存储
  const memory = Object.create(null);
  let available = true;

  // 探测 localStorage 是否可用
  try {
    const probe = '__snake_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
  } catch (e) {
    available = false;
  }

  function read(key) {
    try {
      return available ? window.localStorage.getItem(key) : (key in memory ? memory[key] : null);
    } catch (e) {
      return key in memory ? memory[key] : null;
    }
  }

  function write(key, value) {
    try {
      if (available) window.localStorage.setItem(key, value);
      else memory[key] = value;
    } catch (e) {
      memory[key] = value;
    }
  }

  const Storage = {
    getHighScore() {
      const v = parseInt(read(storageKeys.highScore), 10);
      return Number.isFinite(v) && v > 0 ? v : 0;
    },
    setHighScore(score) { write(storageKeys.highScore, String(score)); },

    getDifficulty() {
      const v = read(storageKeys.difficulty);
      return v && difficulties[v] ? v : defaultDifficulty;
    },
    setDifficulty(name) { write(storageKeys.difficulty, name); },

    getMuted() { return read(storageKeys.muted) === 'true'; },
    setMuted(muted) { write(storageKeys.muted, muted ? 'true' : 'false'); },
  };

  SnakeGame.Storage = Storage;
})(window.SnakeGame = window.SnakeGame || {});
