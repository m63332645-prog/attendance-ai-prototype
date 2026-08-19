/**
 * 刘海屏安全区域适配工具
 * 用于获取和管理 iOS/Android 设备的安全区域信息
 */

/**
 * 获取安全区域的值
 * @param {string} type - 安全区域类型: 'top' | 'bottom' | 'left' | 'right'
 * @returns {number} 安全区域的像素值
 */
export function getSafeAreaInset(type) {
  const property = `--safe-area-inset-${type}`;
  const value = getComputedStyle(document.documentElement).getPropertyValue(property);
  
  if (value) {
    return parseFloat(value) || 0;
  }
  
  // 降级方案：使用 CSS env() 变量
  const tempDiv = document.createElement('div');
  tempDiv.style.setProperty('padding', `env(safe-area-inset-${type})`);
  document.body.appendChild(tempDiv);
  const computedStyle = window.getComputedStyle(tempDiv);
  const paddingValue = computedStyle.getPropertyValue(`padding-${type}`);
  document.body.removeChild(tempDiv);
  
  return parseFloat(paddingValue) || 0;
}

/**
 * 检测是否为刘海屏设备
 * @returns {boolean}
 */
export function isNotchDevice() {
  // 通过安全区域判断
  const topInset = getSafeAreaInset('top');
  const bottomInset = getSafeAreaInset('bottom');
  
  // 如果顶部或底部有明显的内边距，说明是刘海屏
  return topInset > 20 || bottomInset > 20;
}

/**
 * 检测设备类型
 * @returns {Object} 设备信息
 */
export function getDeviceInfo() {
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  
  return {
    isIOS,
    isAndroid,
    isNotch: isNotchDevice(),
    safeArea: {
      top: getSafeAreaInset('top'),
      bottom: getSafeAreaInset('bottom'),
      left: getSafeAreaInset('left'),
      right: getSafeAreaInset('right'),
    }
  };
}

/**
 * 动态设置安全区域 CSS 变量
 * 用于某些 WebView 需要手动注入安全区域值的场景
 * @param {Object} insets - 安全区域值 { top, bottom, left, right }
 */
export function setSafeAreaVariables(insets) {
  const root = document.documentElement;
  
  if (insets.top !== undefined) {
    root.style.setProperty('--safe-area-inset-top', `${insets.top}px`);
  }
  if (insets.bottom !== undefined) {
    root.style.setProperty('--safe-area-inset-bottom', `${insets.bottom}px`);
  }
  if (insets.left !== undefined) {
    root.style.setProperty('--safe-area-inset-left', `${insets.left}px`);
  }
  if (insets.right !== undefined) {
    root.style.setProperty('--safe-area-inset-right', `${insets.right}px`);
  }
}

/**
 * 初始化安全区域监听
 * 当设备方向改变时更新安全区域
 */
export function initSafeAreaListener() {
  // 监听屏幕方向变化
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      // 触发重新计算
      const deviceInfo = getDeviceInfo();
      console.log('设备方向改变，安全区域:', deviceInfo.safeArea);
    }, 300);
  });
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    // 可以在此处添加额外的逻辑
  });
}