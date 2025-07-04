import Request from "@/js_sdk/luch-request/request.js";
import { AUTH_API_BASE_URL } from "@/utils/appConfig.js";

// 用于静默刷新 token 的函数
let isRefreshing = false;
let refreshPromise = null;
let pendingRequests = [];

// 添加刷新失败计数器和锁定机制
let refreshFailCount = 0;
let refreshLocked = false;
let lastRefreshTime = 0;

// 静默刷新 token
async function silentRefreshToken() {
  // 检查是否被锁定
  if (refreshLocked) {
    console.log("Token 刷新已被锁定，跳过刷新");
    return Promise.reject(new Error("Token 刷新已被锁定"));
  }

  // 检查是否短时间内频繁刷新
  const now = Date.now();
  if (now - lastRefreshTime < 5000) {
    // 5秒内
    refreshFailCount++;
    console.log(`短时间内多次刷新 token，当前失败计数: ${refreshFailCount}`);

    // 如果短时间内失败3次以上，锁定刷新机制
    if (refreshFailCount >= 3) {
      console.log("检测到频繁刷新 token 失败，锁定刷新机制 30 秒");
      refreshLocked = true;

      // 30 秒后解锁
      setTimeout(() => {
        refreshLocked = false;
        refreshFailCount = 0;
        console.log("Token 刷新锁定已解除");
      }, 30000);

      return Promise.reject(new Error("Token 刷新过于频繁，已临时锁定"));
    }
  } else {
    // 重置计数器
    refreshFailCount = 0;
  }

  // 更新最后刷新时间
  lastRefreshTime = now;

  // 如果已经在刷新，返回现有的 Promise
  if (isRefreshing) {
    return refreshPromise;
  }

  isRefreshing = true;
  console.log("开始静默刷新 token...");

  refreshPromise = new Promise(async (resolve, reject) => {
    try {
      const { verifyToken } = require("@/api/user.js");
      const response = await verifyToken();

      if (response.success) {
        console.log("token 刷新成功，继续执行请求");
        // 重置失败计数
        refreshFailCount = 0;

        // 成功后处理所有等待的请求
        pendingRequests.forEach((callback) => callback());
        pendingRequests = [];
        resolve(true);
      } else {
        console.error("token 刷新失败:", response.message);
        reject(new Error("Token 刷新失败"));
      }
    } catch (error) {
      console.error("token 刷新出错:", error);
      reject(error);
    } finally {
      isRefreshing = false;
    }
  });

  return refreshPromise;
}

const authHttp = new Request();

authHttp.setConfig((config) => {
  /* 设置全局配置 */
  config.baseUrl = AUTH_API_BASE_URL; /* 使用新后端地址 */
  config.header = {
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
  // 修改: 400状态码（通常是需要邀请码的情况）也当作成功响应处理
  return (statusCode >= 200 && statusCode < 300) || statusCode === 400;
};

authHttp.interceptor.request((config, cancel) => {
  /* 请求之前拦截器 */
  const token = uni.getStorageSync("token");
  if (token) {
    config.header = {
      Authorization: `Bearer ${token}`,
      ...config.header,
    };
    console.log("新后端请求添加认证头:", `Bearer ${token.substring(0, 15)}...`);
  } else {
    config.header = {
      ...config.header,
    };
  }

  // 添加 ngrok Cookie 解决方案
  // 从 baseUrl 中提取 ngrok 域名
  if (config.baseUrl && config.baseUrl.includes("ngrok-free.app")) {
    const ngrokDomain = config.baseUrl.match(/https?:\/\/([^\/]+)/)[1];
    if (ngrokDomain) {
      config.header = {
        ...config.header,
        Cookie: `abuse_interstitial=${ngrokDomain}`,
      };
      console.log("添加 ngrok Cookie:", `abuse_interstitial=${ngrokDomain}`);
    }
  }

  return config;
});

authHttp.interceptor.response(
  async (response) => {
    /* 请求之后拦截器 */
    // 检测是否返回了 HTML 而不是 JSON (ngrok 警告页面)
    if (
      typeof response.data === "string" &&
      response.data.includes("<!DOCTYPE html>")
    ) {
      console.error("检测到 HTML 响应，可能是 ngrok 警告页面");

      // 创建一个错误对象，但不立即抛出
      const error = new Error("API 返回了 HTML 内容，可能是 ngrok 警告页面");
      error.response = response;
      error.code = "HTML_RESPONSE";
      error.statusCode = 500;

      // 显示提示
      uni.showModal({
        title: "网络请求异常",
        content:
          "检测到网络异常，请确认您已通过 ngrok 安全检查页面。请在浏览器中访问一次后端地址，然后重试。",
        showCancel: true,
        confirmText: "我知道了",
        success: (res) => {
          if (res.confirm) {
            // 可以选择在这里执行一些操作
          }
        },
      });

      throw error;
    }

    console.log("新后端响应:", response.config.url, response.data);
    const res = response.data;

    // 新后端使用 success 字段判断成功与否
    if (res.success === false) {
      //提示错误信息
      console.error("新后端响应错误:", res.code, res.message);

      // 如果是401，尝试刷新token的逻辑...
      // 此处省略相关代码...

      // 对于400状态码（通常是需要邀请码的情况），直接返回完整响应数据
      if (res.code === 400 || response.statusCode === 400) {
        console.log("处理400错误，返回完整响应:", res);
        // 直接抛出包含完整数据的错误，使调用方能获取到错误信息
        const error = new Error(res.message || "请求失败");
        error.response = response;
        error.data = res;
        error.code = res.code;
        error.success = res.success;
        error.statusCode = response.statusCode;
        throw error;
      }

      // 普通错误也直接抛出
      const error = new Error(res.message || "请求失败");
      error.response = response;
      error.data = res;
      error.code = res.code;
      error.success = res.success;
      error.statusCode = response.statusCode;
      throw error;
    } else {
      return res;
    }
  },
  (response) => {
    //提示错误信息
    console.log("新后端网络错误:", response);
    console.log("请求详情:", response.config);

    // 捕获更多错误信息
    console.log("错误详细信息:");
    if (response.data) console.log("- 响应数据:", response.data);
    if (response.statusCode) console.log("- 状态码:", response.statusCode);
    if (response.errMsg) console.log("- 错误消息:", response.errMsg);

    // 构建更有信息量的错误对象
    const error = new Error(response.errMsg || "网络请求失败");
    error.response = response;

    // 如果响应中包含data，将其附加到错误对象上
    if (response.data) {
      error.data = response.data;
    }

    // 附加状态码
    if (response.statusCode) {
      error.statusCode = response.statusCode;
    }

    // 只有在非静默模式下才显示错误提示
    if (!response.silentRefresh) {
      uni.showToast({
        title: response.errMsg || "网络请求失败",
        duration: 1500,
        icon: "none",
      });
    }

    return Promise.reject(error); // 返回增强的错误对象
  }
);

export function authRequest(options = {}) {
  return authHttp.request(options);
}

export default authRequest;
