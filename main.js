import { createApp } from 'vue';
import App from './App.vue';
import './index.css';
import Vant from 'vant';
import 'vant/lib/index.css';
import router from './router';
import vConsole from "vconsole";
import '@/utils/sensors'
import { initSafeAreaListener } from './utils/safeArea';
import { initUrlParams } from './utils/urlParams';
import "./utils/cordovaBridge.js";
import { isMafaApp } from "./utils/mafa.js";


if (process.env.VUE_APP_AMA_ENV === "development") {
  new vConsole();
}


// 在路由准备好后初始化 URL 参数
router.isReady().then(() => {
  import('./store').then(({ store }) => {
    initUrlParams(store);
  });
});
// 初始化安全区域监听
initSafeAreaListener();

const app = createApp(App);
app.use(Vant);
app.use(router);
app.mount('#root');

// 检测是否是低版本 WebView
function isOldWebView() {
  const ua = navigator.userAgent;
  console.log(ua,'ua');
  
  // 小米、vivo 等品牌的旧版 WebView
  return /MiuiBrowser|VivoBrowser|MQQBrowser\/[1-8]\./i.test(ua);
}

if (isOldWebView()) {
  console.warn('检测到旧版 WebView，启用兼容模式');
  // 可以在这里加载额外的 polyfill
  document.body.classList.add('compat-mode');
}