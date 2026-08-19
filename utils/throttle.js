/**
 * 创建节流函数
 * @param {Function} fn - 要节流的函数
 * @param {number} delay - 节流时间窗口（毫秒）
 * @returns {Function} 节流后的函数
 */
export const throttle = (fn, delay = 2000) => {
  let lastTime = 0;
  
  return function(...args) {
    const now = Date.now();
    
    // 如果距离上次执行超过 delay，则立即执行
    if (now - lastTime >= delay) {
      lastTime = now;
      fn.apply(this, args);
    }
    // 否则忽略本次调用
  };
};