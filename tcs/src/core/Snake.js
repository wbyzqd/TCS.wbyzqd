/**
 * Snake.js —— 蛇的数据模型与行为
 * body 为坐标数组，索引 0 为蛇头。
 * 通过"添加新蛇头 + 视情况移除蛇尾"的方式实现移动/增长，
 * 并对方向变更做反向拦截，避免 180° 瞬间自撞。
 */
(function (SnakeGame) {
  'use strict';

  const { CONFIG, utils } = SnakeGame;

  class Snake {
    constructor() {
      this.reset();
    }

    // 将蛇复位到棋盘中央，朝右
    reset() {
      const cx = Math.floor(CONFIG.grid.cols / 2);
      const cy = Math.floor(CONFIG.grid.rows / 2);
      this.direction = { x: 1, y: 0 };
      this.nextDirection = { x: 1, y: 0 };
      this.body = [];
      for (let i = 0; i < CONFIG.initialSnakeLength; i++) {
        this.body.push({ x: cx - i, y: cy });
      }
      this.growing = false; // 本步是否处于增长状态（供渲染插值使用）
    }

    get head() { return this.body[0]; }
    get length() { return this.body.length; }

    // 缓存下一步方向；反向或重复则忽略。返回是否产生有效转向。
    setDirection(dir) {
      if (utils.isOpposite(dir, this.direction)) return false;
      if (dir.x === this.nextDirection.x && dir.y === this.nextDirection.y) return false;
      this.nextDirection = { x: dir.x, y: dir.y };
      return true;
    }

    // 计算下一步蛇头位置（不修改状态），并返回本步实际采用的方向
    peekNextHead() {
      const nd = this.nextDirection;
      const dir = utils.isOpposite(nd, this.direction) ? this.direction : nd;
      return { x: this.head.x + dir.x, y: this.head.y + dir.y, dir };
    }

    // 前进一格；grow 为 true 时保留蛇尾（蛇身增长）
    step(grow) {
      const next = this.peekNextHead();
      this.direction = next.dir;
      this.body.unshift({ x: next.x, y: next.y });
      if (!grow) this.body.pop();
      this.growing = !!grow;
    }

    // 判断某格是否被蛇身占据；ignoreTail=true 时忽略最后一节（该节本步将移开）
    occupies(x, y, ignoreTail) {
      const limit = ignoreTail ? this.body.length - 1 : this.body.length;
      for (let i = 0; i < limit; i++) {
        if (this.body[i].x === x && this.body[i].y === y) return true;
      }
      return false;
    }

    // 返回蛇身占据格子的集合（供食物生成避让）
    cellsSet() {
      const set = new Set();
      for (const seg of this.body) set.add(seg.x + ',' + seg.y);
      return set;
    }
  }

  SnakeGame.Snake = Snake;
})(window.SnakeGame = window.SnakeGame || {});
