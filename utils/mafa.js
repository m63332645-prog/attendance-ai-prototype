/**
 * MafaJSAPI 定位服务封装
 */

/**
 * 检查是否在 Mafa App 环境中
 * @returns {boolean}
 */
export const isMafaApp = () => {  
  return !!(window.MafaJSAPI && typeof window.MafaJSAPI.isMafaApp === 'function' && window.MafaJSAPI.isMafaApp())
}

/**
 * 使用 MafaJSAPI 获取定位
 * @returns {Promise<{lat: number, lon: number}>}
 * @throws {Error} 当不在 Mafa App 环境或定位失败时
 */
export const getLocationViaMafa = async () => {
  if (!isMafaApp()) {
    throw new Error('不在 Mafa App 环境中')
  }

  const res = await window.MafaJSAPI.geoloactionGetLocation()

  return {
    lat: parseFloat(res.data.latitude),
    lon: parseFloat(res.data.longitude)
  }
}

/**
 * 获取定位（优先 MafaJSAPI，失败自动降级到浏览器 API）
 * @param {Object} options - 定位选项
 * @param {number} options.timeout - 超时时间（毫秒），默认 8000
 * @param {boolean} options.enableHighAccuracy - 是否启用高精度，默认 true
 * @returns {Promise<{lat: number, lon: number, source: 'mafa' | 'browser'}>}
 */
export const getLocation = async (options = {}) => {
  const { timeout = 8000, enableHighAccuracy = true } = options
  // 优先尝试 MafaJSAPI
  if (isMafaApp()) {
    try {
      console.log('📍 使用 MafaJSAPI 获取定位...')
      const location = await getLocationViaMafa()
      console.log('✅ MafaJSAPI 定位成功:', location)
      return { ...location, source: 'mafa' }
    } catch (error) {
      console.warn('⚠️ MafaJSAPI 定位失败，降级到浏览器 API:', error.message)
    }
  }

  // 降级到浏览器 Geolocation API
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持定位功能'))
      return
    }

    console.log('📍 使用浏览器 Geolocation API 获取定位...')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        }
        console.log('✅ 浏览器定位成功:', location)
        resolve({ ...location, source: 'browser' })
      },
      (error) => {
        console.error(' 浏览器定位失败:', error)
        reject(new Error(`定位失败: ${error.message || '未知错误'}`))
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge: 0
      }
    )
  })
}
/**
 * 获取启动参数
 * 
 */
export const getStartupParams = async (keys = []) => {
  // console.log('路由路径:', res.data.routerPath)
  // console.log('所有参数:', res.data.params)
  return window.MafaJSAPI.getStartupParams(keys.length ? { key: keys } : undefined)
}


export default {
  isMafaApp,
  getLocationViaMafa,
  getLocation
}
