import request from "@/utils/requestUtil";
import authRequest from "@/utils/authRequest";

export function generateConfirmOrder(data) {
  return request({
    method: "POST",
    url: "/order/generateConfirmOrder",
    data: data,
  });
}

export function generateOrder(data) {
  return request({
    method: "POST",
    url: "/order/generateOrder",
    data: data,
  });
}

export function fetchOrderList(params) {
  return request({
    method: "GET",
    url: "/order/list",
    params: params,
  });
}

export function payOrderSuccess(data) {
  return request({
    method: "POST",
    url: "/order/paySuccess",
    header: {
      "content-type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    data: data,
  });
}

// 微信小程序支付接口 - 使用新后端
export function wxMiniPay(data) {
  // 确保 total_fee 参数存在，如果不存在则使用 amount 的值
  if (!data.total_fee && data.amount) {
    data.total_fee = data.amount;
  }

  return authRequest({
    method: "POST",
    url: "/api/payment/wxMiniPay",
    data: data,
  });
}

// 外部订单微信小程序支付接口 - 专门处理老后端创建的订单
export function wxMiniPayExternal(data) {
  // 确保 total_fee 参数存在，如果不存在则使用 amount 的值
  if (!data.total_fee && data.amount) {
    data.total_fee = data.amount;
  }

  return authRequest({
    method: "POST",
    url: "/api/payment/wxMiniPayExternal",
    data: data,
  });
}

// 手动更新外部订单状态
export function updateExternalOrderStatus(data) {
  return authRequest({
    method: "POST",
    url: "/api/payment/updateExternalOrderStatus",
    data: data,
  });
}

// 商家转账接口 - 使用新后端
export function transferToUser(data) {
  return authRequest({
    method: "POST",
    url: "/api/payment/transferToUser",
    data: data,
  });
}

// 创建测试订单 - 使用新后端
export function createTestOrder(data) {
  return authRequest({
    method: "POST",
    url: "/api/payment/createTestOrder",
    data: data,
  });
}

export function fetchOrderDetail(orderId) {
  return request({
    method: "GET",
    url: `/order/detail/${orderId}`,
  });
}

export function cancelUserOrder(data) {
  return request({
    method: "POST",
    url: "/order/cancelUserOrder",
    header: {
      "content-type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    data: data,
  });
}

export function confirmReceiveOrder(data) {
  return request({
    method: "POST",
    url: "/order/confirmReceiveOrder",
    header: {
      "content-type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    data: data,
  });
}

export function deleteUserOrder(data) {
  return request({
    method: "POST",
    url: "/order/deleteOrder",
    header: {
      "content-type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    data: data,
  });
}

export function fetchAliapyStatus(params) {
  return request({
    method: "GET",
    url: "/alipay/query",
    params: params,
  });
}
