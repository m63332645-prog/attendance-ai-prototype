import axios from 'axios'
import { showDialog  } from "vant";  
// import { backApp } from '@/assets/js/cordovaBridge';
import SignUtil from './signUtil'
// 私钥
const PRIVATE_KEY = "MIICdwIBADANBgkqhkiG9w0BAQEFAASCAmEwggJdAgEAAoGBAIi9hPJTWiaOyESSpHyLFTPGYgwhl65u7Q6DmNe4FEPTsnBClm5GpAdFMoicIxGHyyWKYASksGjgwtCFUrho0NyIcidZpgISuqBRviAEkwsqg5FGKvV5AOMX93zTUxK1Q/eR3xC3mTGr+rzrgGMtHsTCnNd6rn4ta7C1lzBAR03lAgMBAAECgYB3kiIbNL/0T47YR9MGBSj5KVS7fvSAWAd7VZ/lotY1qXyzpcadj7AHm37g7ofL4I7HuQTVip2oWEKCzNLU5vMbWBejGa+x5vslPLYveFqBN04b2yAOXn2tBxpALCVeQm85fxCKkZq2gZlpVyJICrTiamMEUPHEMAIzmbeLok9IgQJBAOJjuzFSuACzA1wj1DhFPC2YUBIfza7p2OMcgHCzArWJQkdRB6pbCuk6s6ICF+1Zz4d2pFrDhnax14zpRxQ6KD0CQQCaoAkNvhu1PBLa/9LDqinAS20L9xm3M/P5iSJYRcfiFD8wYu34uWOVT69MsYa16SwN75T41JdlN7uNKC2QWe7JAkEA0iWnpzJU0XlanhY4Mf+6y8w+T4SsJji2dqOHapYQ5rjCCHdkOTOH3lX6V2HAGjgrF2D/Ua18TQPqxcfpjhIqNQJAK7MzG9kwx4XU5mQK0xXSevBWP110vRxHxayGMmB2X2TNfwVWsEbk6Bv/NTOvGNZvhvjBJ5odt5OKxBgo2HUyUQJBAJaDcFEhgYXTUWVYWj3CTdsPulMhJr8Tr6Gt1+zuNaPZ7wszFozApoLqcQqOP2g8HxbsxRiJ4ulguqQdzcddlS0="
// 创建 axios 实例
const request = axios.create({
  // API 请求的默认前缀
  timeout: 600000, // 请求超时时间设置为10分钟
  headers: {
    "Content-Type": "application/json; charset-utf-8"
  }
});

// 异常拦截处理器
const errorHandler = (error) => {
  // console.log('errorHandler', error);
  const currentPath = window.location.href
  if (error && error.code && error.code === 'ERR_NETWORK' && !currentPath.includes('invitation')) {
    showDialog({
      message: '您当前的网络环境不佳，请切换网络后重试。可按如下方式尝试：\n1、将手机开启飞行模式，然后再关闭飞行模式\n2、更换Wi-Fi网络，确保该Wi-Fi网络可以接入互联网',
    })
  }

  if (error.response) {
    if (error.response.status === 403) {
      showDialog({
        message: '该页面已失效，请重新进入',
        confirmButtonColor: '#00A758'
      }).then(() => {
        console.log(window.wx);
        if (window.wx?.miniProgram) {
          window.wx.miniProgram.navigateBack(2)
        }
      })
    } else if (error.response.status === 500 && error.response.data.errorMsg) {
      if (error.config.url.includes('/getZhonghongId')) {
        return
      }
      showDialog({
        message: error.response.data.errorMsg,
      })
    }
  }
  return Promise.reject(error);
};

// request interceptor
request.interceptors.request.use((config) => {
  // console.log('config', config);
  const token = sessionStorage.getItem("token");
  const interviewToken = sessionStorage.getItem("interviewToken");
  // 如果 token 存在
  // 让每个请求携带自定义 token 请根据实际情况自行修改
  config.headers["Authorization"] = "Bearer " + token;
  config.headers["device"] = "mobileweb";
  if (config.url.includes("interview")) {
    config.headers['Authorization'] = interviewToken
  }
  // console.log("requestConfig", request);
  // 仅对特定请求添加签名（根据后端需要）
  if (config.headers['Need-Sign'] === 'true') {
    const params = config.data || config.params || {}
    
    // 添加时间戳防止重放攻击
    params.timestamp = Date.now()
    console.log('params--', params)
    // 生成签名
    const sign = SignUtil.signObject(params, PRIVATE_KEY)
    
    // 添加签名到请求头
    config.headers['X-Sign'] = sign
    config.headers['X-Timestamp'] = params.timestamp
    console.log(config.headers,'config.headers')
    // 在参数中添加签名
    if (config.method === 'post') {
      config.data = { ...params, sign }
    } else {
      config.params = { ...params, sign }
    }
  }
  return config;
}, errorHandler);

// response interceptor
request.interceptors.response.use((response) => {
  // console.log('response', response);
  if (response.config.url.includes("interview")) {
    return { data: response.data, status: response.status };
  }
  return response.data;
}, errorHandler);

// const installer = {
//   vm: {},
//   install(Vue) {
//     Vue.use(VueAxios, request);
//   }
// };

export default request;

// export { request as axios };
