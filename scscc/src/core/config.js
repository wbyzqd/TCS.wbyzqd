/**
 * config.js —— 全局常量、配置与通用工具函数
 * 作为整个游戏的"单一事实来源"（single source of truth），
 * 所有模块从 window.SnakeGame 命名空间读取配置，避免魔法数字散落各处。
 */
(function (SnakeGame) {
  'use strict';

  const CONFIG = {
    // 网格尺寸（正方形棋盘）
    grid: { cols: 20, rows: 20 },

    // 每吃到一个食物获得的分数
    scorePerFood: 10,

    // 难度预设：baseInterval 为初始步进间隔(ms)，越小越快；
    // minInterval 为速度上限（间隔下限）；speedStep 为每吃一个食物缩短的间隔(ms)
    difficulties: {
      slow:   { label: '慢', baseInterval: 170, minInterval: 100, speedStep: 3 },
      normal: { label: '中', baseInterval: 130, minInterval: 72,  speedStep: 4 },
      fast:   { label: '快', baseInterval: 95,  minInterval: 55,  speedStep: 3 },
    },
    defaultDifficulty: 'normal',

    // 初始蛇身长度
    initialSnakeLength: 3,

    // 配色（霓虹街机主题）
    colors: {
      background: '#070B10',
      grid: 'rgba(64, 224, 208, 0.05)',
      snakeHead: '#D6FF6B',
      snakeBodyStart: '#B6FF3B',
      snakeBodyEnd: '#16C79A',
      snakeGlow: 'rgba(130, 255, 140, 0.55)',
      food: '#FF3D77',
      foodGlow: 'rgba(255, 61, 119, 0.7)',
      eye: '#06131b',
    },

    // 四个方向向量
    directions: {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    },

    // localStorage 键名
    storageKeys: {
      highScore: 'snake.highScore',
      difficulty: 'snake.difficulty',
      muted: 'snake.muted',
    },
  };

  // 通用工具函数
  const utils = {
    lerp(a, b, t) { return a + (b - a) * t; },
    clamp(v, min, max) { return v < min ? min : v > max ? max : v; },
    // 判断两个方向是否互为反向（防止 180° 自撞）
    isOpposite(a, b) { return a.x + b.x === 0 && a.y + b.y === 0; },
    hexToRgb(hex) {
      const h = hex.replace('#', '');
      const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
      const n = parseInt(full, 16);
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    },
    // 在两个十六进制颜色间线性插值，返回 rgb() 字符串
    mixColor(c1, c2, t) {
      const a = utils.hexToRgb(c1);
      const b = utils.hexToRgb(c2);
      const r = Math.round(utils.lerp(a.r, b.r, t));
      const g = Math.round(utils.lerp(a.g, b.g, t));
      const bl = Math.round(utils.lerp(a.b, b.b, t));
      return `rgb(${r}, ${g}, ${bl})`;
    },
  };

  SnakeGame.CONFIG = CONFIG;
  SnakeGame.utils = utils;
})(window.SnakeGame = window.SnakeGame || {});
