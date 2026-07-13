/**
 * Food.js —— 食物生成与位置管理
 * 在所有未被蛇身占据的空闲格子中随机选取一个生成食物，
 * 保证食物不会出现在蛇身上。若棋盘已被填满则返回 false（通关）。
 */
(function (SnakeGame) {
  'use strict';

  const { CONFIG } = SnakeGame;

  class Food {
    constructor() {
      this.position = { x: -1, y: -1 };
    }

    spawn(snake) {
      const { cols, rows } = CONFIG.grid;
      const occupied = snake.cellsSet();
      const free = [];
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (!occupied.has(x + ',' + y)) free.push({ x, y });
        }
      }
      if (free.length === 0) {
        this.position = { x: -1, y: -1 };
        return false; // 棋盘已满
      }
      this.position = free[Math.floor(Math.random() * free.length)];
      return true;
    }
  }

  SnakeGame.Food = Food;
})(window.SnakeGame = window.SnakeGame || {});
