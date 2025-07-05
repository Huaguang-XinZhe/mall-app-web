// appConfig.js

//配置API请求的基础路径

// 原有商城API（商品、订单等）
export const API_BASE_URL = "https://boyangchuanggu.com";

// 新增用户认证API（登录、注册、邀请码等）
// 注意：ngrok地址是动态变化的，请根据实际情况修改
// 本地开发时，可以使用类似 http://localhost:3000
// 重要：使用 ngrok 时，系统已自动添加 Cookie: abuse_interstitial=域名
// 这样可以绕过 ngrok 的安全检查页面，直接访问 API
export const AUTH_API_BASE_URL =
  "https://new.boyangchuanggu.com";

//是否启用支付宝支付
export const USE_ALIPAY = false;
