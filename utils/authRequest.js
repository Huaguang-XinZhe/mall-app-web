import Request from "@/js_sdk/luch-request/request.js";
import { AUTH_API_BASE_URL } from "@/utils/appConfig.js";

const authHttp = new Request();

authHttp.setConfig((config) => {
  /* 设置认证服务全局配置 */
  config.baseUrl = AUTH_API_BASE_URL;
  config.header = {
    "Ngrok-Skip-Browser-Warning": "1",
    ...config.header,
  };
  return config;
});

/**
 * 自定义验证器，如果返回true 则进入响应拦截器的响应成功函数(resolve)，否则进入响应拦截器的响应错误函数(reject)
 * @param { Number } statusCode - 请求响应体statusCode（只读）
 * @return { Boolean } 如果为true,则 resolve, 否则 reject
 */
authHttp.validateStatus = (statusCode) => {
  // 允许 200 和 400 都进入成功的响应拦截器，我们在拦截器中处理业务逻辑
  return statusCode === 200 || statusCode === 400;
};

authHttp.interceptor.request((config, cancel) => {
  /* 请求之前拦截器 */
  const token = uni.getStorageSync("token");
  if (token) {
    config.header = {
      Authorization: `Bearer ${token}`,
      ...config.header,
    };
  }
  return config;
});

authHttp.interceptor.response(
  (response) => {
    /* 请求之后拦截器 */
    const res = response.data;
    console.log("authRequest 响应拦截器 - 原始响应:", res);
    console.log("authRequest 响应拦截器 - HTTP状态码:", response.statusCode);

    // 处理不同的响应格式
    let code, message, data;
    if (res.success !== undefined) {
      // 新的响应格式 { success: true, message: "xxx", data: {...} }
      code = res.success ? 200 : 400;
      message = res.message;
      data = res.data;
      console.log("使用新格式解析 - success:", res.success);
    } else {
      // 旧的响应格式 { code: 200, message: "xxx", data: {...} }
      code = res.code;
      message = res.message;
      data = res.data;
      console.log("使用旧格式解析 - code:", res.code, "message:", res.message);
    }

    console.log(
      "解析后的数据 - code:",
      code,
      "message:",
      message,
      "data:",
      data
    );

    if (code !== 200) {
      // 对于特定错误，不自动显示 toast（由前端页面自行处理）
      const skipToastMessages = ["新用户注册需要邀请码"];

      if (!skipToastMessages.includes(message)) {
        //提示错误信息
        uni.showToast({
          title: message || "请求失败",
          icon: "none",
          duration: 2000,
        });
      }

      //401未登录处理
      if (code === 401) {
        // 清除本地存储的 token
        uni.removeStorageSync("token");
        uni.removeStorageSync("userInfo");

        uni.showModal({
          title: "提示",
          content: "您的登录已过期，请重新登录",
          confirmText: "重新登录",
          cancelText: "取消",
          success: function (res) {
            if (res.confirm) {
              // 跳转到首页，首页会自动检测登录状态并显示登录弹窗
              uni.reLaunch({
                url: "/pages/index/index",
              });
            }
          },
        });
      }
      // 返回结构化的错误对象，让前端能够正确处理
      const errorObj = {
        code,
        message,
        data,
        success: false,
        originalResponse: response,
      };
      return Promise.reject(errorObj);
    } else {
      return {
        code,
        message,
        data,
        success: code === 200,
      };
    }
  },
  (response) => {
    //提示错误信息
    console.log("auth response error", response);
    uni.showToast({
      title: response.errMsg || "网络错误",
      icon: "none",
      duration: 2000,
    });
    return Promise.reject(response);
  }
);

export function authRequest(options = {}) {
  return authHttp.request(options);
}

export default authRequest;
