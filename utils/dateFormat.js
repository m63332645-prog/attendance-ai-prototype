/**
 * 日期格式化工具函数
 * 兼容 iOS Safari 对日期格式的解析问题
 */

/**
 * 将任意日期格式转换为指定格式（兼容 iOS）
 * - iOS Safari 不支持 "YYYY-MM-DD HH:mm:ss" 格式，需要转换为 "YYYY/MM/DD HH:mm:ss"
 * - 根据输入是否包含时间部分，自动决定输出格式
 * 
 * @param {Date|string|number} date - 日期对象、字符串或时间戳
 * @param {boolean} withTime - 是否包含时间部分，默认根据输入自动判断
 * @returns {string} 格式化后的字符串
 *   - 不含时间: "2025-01-15"
 *   - 含时间: "2025-01-15 14:30:00"
 */
export function formatDate(date, withTime = null) {
  if (!date) return '';

  let d;

  // 解析日期，兼容 iOS
  if (date instanceof Date) {
    d = date;
  } else if (typeof date === 'number') {
    d = new Date(date);
  } else if (typeof date === 'string') {
    // iOS 不支持 "YYYY-MM-DD HH:mm:ss"，但支持 "YYYY/MM/DD HH:mm:ss"
    let normalizedDate = date.trim();
    if (normalizedDate.includes('-') && normalizedDate.includes(':')) {
      normalizedDate = normalizedDate.replace(/-/g, '/');
    }
    d = new Date(normalizedDate);
  } else {
    return '';
  }

  // 验证日期是否有效
  if (isNaN(d.getTime())) {
    return '';
  }

  // 如果未指定是否包含时间，根据原始输入判断
  if (withTime === null) {
    withTime = typeof date === 'string'
      ? (date.includes(':') || date.includes('T'))
      : (d.getHours() !== 0 || d.getMinutes() !== 0 || d.getSeconds() !== 0);
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  if (withTime) {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } else {
    return `${year}-${month}-${day}`;
  }
}

/**
  * 计算指定分钟后的时间字符串
  * @param {string} timeStr - "YYYY-MM-DD HH:mm:ss" 或 "HH:mm:ss"
  * @param {number} minutes - 增加的分钟数
  * @returns {string} 格式化后的时间字符串
  */
export function getDateTimeAfterMinutes(timeStr, minutes) {
  if (!timeStr || minutes == null) return '';

  const hasDate = timeStr.includes('-');
  const dateObj = hasDate
    ? new Date(timeStr.replace(' ', 'T'))
    : (() => {
      const [h, m, s] = timeStr.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, s || 0, 0);
      return d;
    })();

  if (isNaN(dateObj.getTime())) return '';

  dateObj.setMinutes(dateObj.getMinutes() + minutes);
  const pad = (n) => String(n).padStart(2, '0');
  const h = pad(dateObj.getHours());
  const m = pad(dateObj.getMinutes());
  const s = pad(dateObj.getSeconds());

  return hasDate
    ? `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())} ${h}:${m}:${s}`
    : `${h}:${m}:${s}`;
}
// 格式化时间，获取时分

export const formatTime = (time) => {
  return new Date(time).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};