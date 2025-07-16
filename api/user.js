import request from "@/utils/requestUtil";
import authRequest from "@/utils/authRequest";

// === 认证相关接口（使用新的后端服务器） ===

// 微信传统登录（已弃用 - 因为 getUserProfile 不可用）
export function wechatLogin(params) {
  return authRequest({
    method: "POST",
    url: "/api/auth/login",
    data: params,
  });
}

// 微信手机号一键登录（推荐使用）
// #ifdef MP-WEIXIN
export function phoneLogin(params) {
  return authRequest({
    method: "POST",
    url: "/api/auth/phoneLogin",
    data: params,
    header: {
      'content-type': 'application/json;charset=UTF-8'
    }
  });
}
// #endif

// 获取用户信息
export function getUserProfile() {
  return authRequest({
    method: "GET",
    url: "/api/user/profile",
  });
}

// 更新用户信息（简化版本，只包含必要字段）
export function updateProfile(params) {
  return authRequest({
    method: "PUT",
    url: "/api/user/profile",
    data: params,
  });
}

// 验证邀请码
export function validateInviteCode(inviteCode) {
  return authRequest({
    method: "POST",
    url: "/api/auth/validateInviteCode",
    data: { inviteCode },
  });
}

// 通过邀请码注册（已弃用 - 手机号登录时自动注册）
export function registerWithInviteCode(params) {
  return authRequest({
    method: "POST",
    url: "/api/auth/registerWithInviteCode",
    data: params,
  });
}

// 验证 Token
export function verifyToken() {
  return authRequest({
    method: "POST",
    url: "/api/auth/verify",
  });
}

// 获取邀请统计信息
export function getInviteStats() {
  return authRequest({
    method: "GET",
    url: "/api/auth/inviteStats",
  });
}

// 获取邀请提现信息
export function getInviteWithdrawInfo(params) {
  return authRequest({
    method: "GET",
    url: "/api/withdraw/info",
    params: params
  });
}

// 申请提现
export function requestWithdraw(params) {
  return authRequest({
    method: "POST",
    url: "/api/withdraw/request",
    data: params,
  });
}

// 获取提现记录
export function getWithdrawRecords(params) {
  return authRequest({
    method: "GET",
    url: "/api/withdraw/records",
    params: params,
  });
}

// 获取提现限额信息
export function getWithdrawLimits() {
  return authRequest({
    method: "GET",
    url: "/api/withdraw/limits",
  });
}

// === 原有商城相关接口（保持兼容） ===

// 获取用户邀请码（如果原系统有的话）
export function fetchInviteCode() {
  return request({
    method: "GET",
    url: "/member/inviteCode",
  });
}

// 生成邀请分享链接（如果原系统有的话）
export function generateShareLink(inviteCode) {
  return request({
    method: "GET",
    url: "/member/shareLink",
    params: { inviteCode },
  });
}
