// appConfig.js

//配置API请求的基础路径

// 原有商城API（商品、订单等）
export const API_BASE_URL = "https://boyangchuanggu.com";

// 新增用户认证API（登录、注册、邀请码等）
// 注意：ngrok地址是动态变化的，请根据实际情况修改
// 本地开发时，可以使用类似 http://localhost:3000
export const AUTH_API_BASE_URL =
  "https://2ce2-2408-8948-2011-8f96-21a3-434d-81ea-d167.ngrok-free.app";

//是否启用支付宝支付
export const USE_ALIPAY = false;
