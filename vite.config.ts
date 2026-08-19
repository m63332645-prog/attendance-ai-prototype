import path from "path";
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
// Deleted:import autoprefixer from "autoprefixer";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    base: "./",
    server: {
      port: 3000,
      host: "0.0.0.0",
      allowedHosts: true,
      hmr: {
        overlay: false,
      },
      proxy: {
        "/api/file": {
          target:
            "https://amasit01.manulife-sinochem.com/ama-gateway/ama-cloud-sys",
          changeOrigin: true,
          secure: false,
        },
        "/api": {
          target:
            "https://amasit01.manulife-sinochem.com/ama-gateway/ama-cloud-content",
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, "/api"),
        },
        "/ama-sub-insurance": {
          target:
            "https://amasit01.manulife-sinochem.com/ama-gateway",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [
      vue(),
      {
        name: 'transform-mafa-jsapi',
        transformIndexHtml(html) {
          const mafajsapi = env.VITE_MAFA_JSAPI;
          if (mafajsapi) {
            return html.replace(
              '</head>',
              `    <script src="${mafajsapi}"></script>\n</head>`
            );
          }
          return html;
        },
      },
    ],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.VUE_APP_SENSORS_URL": JSON.stringify(env.VUE_APP_SENSORS_URL),
      "process.env.VUE_APP_AMA_ENV": JSON.stringify(env.VUE_APP_AMA_ENV),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    build: {
      target: "es2015",
      cssCodeSplit: false,
      cssTarget: "chrome61",
    },
    // Deleted:css: {
    // Deleted:  postcss: {
    // Deleted:    plugins: [
    // Deleted:      autoprefixer({
    // Deleted:        overrideBrowserslist: [
    // Deleted:          "Android >= 5.0",
    // Deleted:          "iOS >= 10.0",
    // Deleted:          "last 2 versions",
    // Deleted:          "> 1%",
    // Deleted:          "not dead"
    // Deleted:        ]
    // Deleted:      })
    // Deleted:    ]
    // Deleted:  }
    // Deleted:}
  };
});