/**
 * 
 * AudioManager.js —— 基于 Web Audio API 的程序化音效
 * 不依赖任何外部音频资源，所有音效由振荡器实时合成。
 * AudioContext 必须在用户手势后创建/恢复（浏览器自动播放策略），
 * 因此对外暴露 unlock() 供首次交互时调用。
 */
(function (SnakeGame) {
  'use strict';

  class AudioManager {
    constructor(muted) {
      this.muted = !!muted;
      this.ctx = null;
    }

    // 惰性创建 / 恢复 AudioContext（需在用户手势中调用）
    _ensure() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
        return this.ctx;
      }
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
      } catch (e) {
        this.ctx = null;
      }
      return this.ctx;
    }

    unlock() { this._ensure(); }

    setMuted(muted) { this.muted = !!muted; }

    // 合成一个带音量包络的短音；slideTo 用于滑音
    _tone(freq, duration, type, gain, slideTo) {
      if (this.muted) return;
      const ctx = this._ensure();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type || 'square';
        osc.frequency.setValueAtTime(freq, now);
        if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(gain || 0.05, now + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + duration + 0.03);
      } catch (e) {
        /* 音效失败不影响游戏，静默忽略 */
      }
    }

    playEat() { this._tone(520, 0.09, 'square', 0.07, 900); }
    playTurn() { this._tone(300, 0.035, 'triangle', 0.025); }
    playStart() { this._tone(440, 0.12, 'square', 0.06, 680); }
    playClick() { this._tone(360, 0.045, 'square', 0.035); }
    playGameOver() {
      this._tone(420, 0.18, 'sawtooth', 0.06, 130);
      setTimeout(() => this._tone(230, 0.32, 'sawtooth', 0.06, 70), 130);
    }
  }

  SnakeGame.AudioManager = AudioManager;
})(window.SnakeGame = window.SnakeGame || {});
