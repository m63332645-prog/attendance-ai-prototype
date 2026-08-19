/**
 * 路由跳转辅助 Composable
 * 自动处理 URL 参数保持和 iOS 返回逻辑
 */
import { useRouter } from 'vue-router';
import { pushWithParams, replaceWithParams, goBackOrClose } from '../utils/urlParams';

export function useSmartRouter() {
  const router = useRouter();

  /**
   * 智能跳转，自动保持 URL 参数
   * @param {string|Object} to - 目标路由
   * @param {Object} extraParams - 额外参数
   */
  const push = (to, extraParams = {}) => {
    pushWithParams(router, to, extraParams);
  };

  /**
   * 智能替换，自动保持 URL 参数
   * @param {string|Object} to - 目标路由
   * @param {Object} extraParams - 额外参数
   */
  const replace = (to, extraParams = {}) => {
    replaceWithParams(router, to, extraParams);
  };

  /**
   * 智能返回，首页时关闭 WebView
   */
  const back = () => {
    goBackOrClose(router);
  };

  return {
    push,
    replace,
    back,
    router
  };
}