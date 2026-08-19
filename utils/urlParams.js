/**
 * URL 参数管理工具
 * 用于在 H5 应用中保持 token 等关键参数不丢失
 */

/**
 * 从当前 URL 获取所有查询参数
 * @returns {URLSearchParams} 查询参数对象
 */
export function getUrlParams() {
  const hash = window.location.hash;
  const queryIndex = hash.indexOf('?');
  if (queryIndex !== -1) {
    const queryString = hash.substring(queryIndex + 1);
    return new URLSearchParams(queryString);
  }
  return new URLSearchParams();
}

/**
 * 获取指定的 URL 参数
 * @param {string} key - 参数名
 * @returns {string|null} 参数值
 */
export function getUrlParam(key) {
  const params = getUrlParams();
  return params.get(key);
}

/**
 * 构建带参数的路由路径
 * @param {string} path - 目标路径
 * @param {Object} extraParams - 额外的参数（可选）
 * @returns {string} 带参数的完整路径
 */
export function buildRoutePath(path, extraParams = {}) {
  const params = getUrlParams();
  
  // 添加额外参数
  Object.keys(extraParams).forEach(key => {
    if (extraParams[key] !== null && extraParams[key] !== undefined) {
      params.set(key, extraParams[key]);
    }
  });
  
  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

/**
 * 安全的 router.push 封装，自动携带 URL 参数
 * @param {Object} router - Vue Router 实例
 * @param {string|Object} to - 目标路由（可以是字符串路径或路由对象）
 * @param {Object} extraParams - 额外的参数（可选）
 */
export function pushWithParams(router, to, extraParams = {}) {
  if (typeof to === 'string') {
    const fullPath = buildRoutePath(to, extraParams);
    router.push(fullPath);
  } else {
    // 如果是路由对象，合并参数
    const params = getUrlParams();
    Object.keys(extraParams).forEach(key => {
      if (extraParams[key] !== null && extraParams[key] !== undefined) {
        params.set(key, extraParams[key]);
      }
    });
    
    const query = { ...to.query };
    params.forEach((value, key) => {
      query[key] = value;
    });
    router.push({
      ...to,
      query
    });
  }
}

/**
 * 安全的 router.replace 封装，自动携带 URL 参数
 * @param {Object} router - Vue Router 实例
 * @param {string|Object} to - 目标路由
 * @param {Object} extraParams - 额外的参数（可选）
 */
export function replaceWithParams(router, to, extraParams = {}) {
  if (typeof to === 'string') {
    const fullPath = buildRoutePath(to, extraParams);
    router.replace(fullPath);
  } else {
    const params = getUrlParams();
    Object.keys(extraParams).forEach(key => {
      if (extraParams[key] !== null && extraParams[key] !== undefined) {
        params.set(key, extraParams[key]);
      }
    });
    
    const query = { ...to.query };
    params.forEach((value, key) => {
      query[key] = value;
    });
    
    router.replace({
      ...to,
      query
    });
  }
}
/**
 * 返回上一页，如果没有历史记录则关闭 WebView
 * @param {Object} router - Vue Router 实例
 */
export function goBackOrClose(router) {
  // 使用 Vue Router 的历史记录长度判断
  // 在 Hash 模式下，router.options.history.state.back 可以判断是否有上一页
  const canGoBack = router.options.history.state && router.options.history.state.back !== null;
  
  if (canGoBack) {
    router.back();
  } else {
    // 没有上一页，关闭 WebView
    console.log('首页返回，尝试关闭 WebView');
    closeWebView();
  }
}

/**
 * 关闭 WebView（根据不同平台调用不同的方法）
 */
export function closeWebView() {
  console.log('执行关闭 WebView');
  
  // iOS WKWebView - 优先尝试
  if (window.webkit && window.webkit.messageHandlers) {
    // 尝试多种可能的 handler 名称
    const handlers = ['closeApp', 'close', 'back', 'goBack'];
    for (const handlerName of handlers) {
      if (window.webkit.messageHandlers[handlerName]) {
        console.log(`调用 iOS handler: ${handlerName}`);
        try {
          window.webkit.messageHandlers[handlerName].postMessage({});
          return;
        } catch (e) {
          console.error(`调用 ${handlerName} 失败:`, e);
        }
      }
    }
  }
  
  // Android WebView
  if (window.AndroidBridge && typeof window.AndroidBridge.close === 'function') {
    console.log('调用 Android Bridge close');
    window.AndroidBridge.close();
    return;
  }
  
  // 其他 Android 桥接方式
  if (window.JsBridge && typeof window.JsBridge.close === 'function') {
    console.log('调用 JsBridge close');
    window.JsBridge.close();
    return;
  }
  
  // 通用方案：尝试关闭窗口
  console.log('尝试 window.close()');
  window.close();
  
  // 如果以上都失败，提示用户
  setTimeout(() => {
    console.warn('无法自动关闭 WebView，请手动返回');
  }, 500);
}


/**
 * 初始化 URL 参数到 Store
 * @param {Object} store - 应用 Store
 */
export function initUrlParams(store) {
  const token = getUrlParam('token');
  const agentCode = getUrlParam('agentCode');
  
  if (token) {
    store.token = token;
    localStorage.setItem('token', token);
    sessionStorage.setItem('token', token);
  }
  
  if (agentCode) {
    store.agentCode = agentCode;
  }
  
  console.log('URL 参数初始化:', { token: !!token, agentCode });
}