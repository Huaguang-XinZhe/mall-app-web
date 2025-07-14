import Request from "@/js_sdk/luch-request/request.js";
import { API_BASE_URL } from "@/utils/appConfig.js";

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

const http = new Request();

http.setConfig((config) => {
  /* 设置全局配置 */
  config.baseUrl = API_BASE_URL; /* 根域名不同 */
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
http.validateStatus = (statusCode) => {
  return statusCode === 200;
};

http.interceptor.request((config, cancel) => {
  /* 请求之前拦截器 */
  const token = uni.getStorageSync("token");
  if (token) {
    config.header = {
      Authorization: `Bearer ${token}`,
      ...config.header,
    };
    console.log("老后端请求添加认证头:", `Bearer ${token.substring(0, 15)}...`);
  } else {
    config.header = {
      ...config.header,
    };
  }
  /*
	if (!token) { // 如果token不存在，调用cancel 会取消本次请求，但是该函数的catch() 仍会执行
	  cancel('token 不存在') // 接收一个参数，会传给catch((err) => {}) err.errMsg === 'token 不存在'
	}
	*/
  return config;
});

http.interceptor.response(
  async (response) => {
    /* 请求之后拦截器 */
    console.log("老后端响应:", response.config.url, response.data);
    const res = response.data;
    if (res.code !== 200) {
      //提示错误信息
      console.error("老后端响应错误:", res.code, res.message);

      // 如果是 401，尝试刷新一下 token
      if (res.code === 401) {
        console.log("检测到老后端认证失败，尝试刷新 token");

        // 记录重试次数，防止无限循环
        const retryCount = response.config._retryCount || 0;
        if (retryCount >= 2) {
          console.log(
            `请求 ${response.config.url} 已重试 ${retryCount} 次，停止重试`
          );
          // 显示登录提示
          uni.showModal({
            title: "提示",
            content: "登录状态已失效，请重新登录",
            confirmText: "重新登录",
            cancelText: "取消",
            success: function (res) {
              if (res.confirm) {
                // 登出并跳转
                const store = require("@/store").default;
                store.commit("logout");

                // 跳转到首页，首页会自动检测登录状态并显示登录弹窗
                uni.reLaunch({
                  url: "/pages/index/index",
                });
              }
            },
          });
          return Promise.reject(response);
        }

        try {
          // 尝试静默刷新 token
          await silentRefreshToken();

          // token 刷新成功，重新发起请求
          console.log("Token 刷新成功，重新发起请求:", response.config.url);

          // 获取最新的 token
          const newToken = uni.getStorageSync("token");

          // 创建新的请求配置
          const newConfig = { ...response.config };
          // 增加重试计数
          newConfig._retryCount = retryCount + 1;

          if (newToken) {
            newConfig.header = {
              ...newConfig.header,
              Authorization: `Bearer ${newToken}`,
            };
          }

          // 重新发起请求
          console.log(
            `重试请求 ${newConfig.url}，当前重试次数: ${newConfig._retryCount}`
          );
          const newResponse = await http.request(newConfig);
          return newResponse;
        } catch (error) {
          console.error("Token 刷新失败，无法继续请求:", error);
          // 静默刷新失败，显示登录提示
          uni.showModal({
            title: "提示",
            content: "登录状态已失效，请重新登录",
            confirmText: "重新登录",
            cancelText: "取消",
            success: function (res) {
              if (res.confirm) {
                // 登出并跳转
                const store = require("@/store").default;
                store.commit("logout");

                // 跳转到首页，首页会自动检测登录状态并显示登录弹窗
                uni.reLaunch({
                  url: "/pages/index/index",
                });
              }
            },
          });
        }
      } else {
        // 非 401 错误才显示提示
        uni.showToast({
          title: res.message,
          duration: 1500,
          icon: "none",
        });
      }

      return Promise.reject(response);
    } else {
      return response.data;
    }
  },
  (response) => {
    //提示错误信息
    console.log("老后端网络错误:", response);
    console.log("请求详情:", response.config);

    // 只有在非静默模式下才显示错误提示
    if (!response.silentRefresh) {
      uni.showToast({
        title: response.errMsg || "网络请求失败",
        duration: 1500,
        icon: "none",
      });
    }

    return Promise.reject(response);
  }
);

export function request(options = {}) {
  return http.request(options);
}

/**
 * 查询物流信息，获取物流查询token并打开物流查询小程序
 * @param {String} orderId - 订单ID
 * @param {String} deliverySn - 物流单号
 * @param {Object} options - 额外选项
 * @param {String} options.goodsName - 商品名称
 * @param {String} options.goodsImgUrl - 商品图片URL
 * @returns {Promise} - 返回Promise对象
 */
export function checkLogistics(orderId, deliverySn, options = {}) {
  return new Promise((resolve, reject) => {
    if (!deliverySn) {
      uni.showToast({
        title: '暂无物流信息',
        icon: 'none'
      });
      reject(new Error('暂无物流信息'));
      return;
    }
    
    // 显示加载中
    uni.showLoading({
      title: '加载中...'
    });
    
    // 获取当前token
    const token = uni.getStorageSync('token');
    
    // 从appConfig中导入API基础URL
    const { AUTH_API_BASE_URL } = require('@/utils/appConfig.js');
    
    // 准备请求参数 - 直接传递物流单号
    const requestData = {
      deliverySn: deliverySn
    };
    
    // 如果提供了商品信息，添加到请求参数中
    if (options.goodsName) {
      requestData.goodsName = options.goodsName;
    }
    
    if (options.goodsImgUrl) {
      requestData.goodsImgUrl = options.goodsImgUrl;
    }
    
    console.log(`准备请求物流信息: 订单ID=${orderId}, 物流单号=${deliverySn}, 商品名称=${options.goodsName || '未提供'}`);
    
    // 获取物流查询token - 确保路径与后端匹配
    uni.request({
      url: AUTH_API_BASE_URL + '/api/wx-delivery/token/' + orderId,
      method: 'GET',
      data: requestData,
      header: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        console.log('获取物流token响应:', res);
        uni.hideLoading();
        
        if (res.statusCode === 200 && res.data && res.data.code === 200 && res.data.data && res.data.data.waybillToken) {
          // 调用物流插件
          const waybillToken = res.data.data.waybillToken;
          console.log('获取到物流token:', waybillToken);
          
          // 使用物流插件API打开物流查询
          if (typeof wx !== 'undefined') {
            console.log('准备使用物流插件打开物流查询');
            try {
              const plugin = requirePlugin("logisticsPlugin");
              plugin.openWaybillTracking({
                waybillToken: waybillToken,
                success(res) {
                  console.log('打开物流查询成功', res);
                  resolve(waybillToken);
                },
                fail(err) {
                  console.error('打开物流查询失败', err);
                  uni.showToast({
                    title: '打开物流查询失败: ' + (err.errMsg || JSON.stringify(err)),
                    icon: 'none',
                    duration: 3000
                  });
                  reject(err);
                }
              });
            } catch (err) {
              console.error('加载物流插件失败', err);
              uni.showToast({
                title: '加载物流插件失败，请确保已在app.json中配置插件',
                icon: 'none',
                duration: 3000
              });
              reject(err);
            }
          } else {
            console.error('当前环境不支持物流查询插件');
            uni.showToast({
              title: '当前环境不支持物流查询',
              icon: 'none'
            });
            reject(new Error('当前环境不支持物流查询'));
          }
        } else {
          console.error('获取物流token失败:', res);
          uni.showToast({
            title: '获取物流信息失败: ' + (res.data && res.data.message ? res.data.message : '服务器响应异常'),
            icon: 'none',
            duration: 3000
          });
          reject(new Error('获取物流token失败'));
        }
      },
      fail: (err) => {
        uni.hideLoading();
        console.error('获取物流token请求失败:', err);
        uni.showToast({
          title: '获取物流信息失败: ' + (err.errMsg || JSON.stringify(err)),
          icon: 'none',
          duration: 3000
        });
        reject(err);
      }
    });
  });
}

export default request;
