import { checkLogistics as requestCheckLogistics } from '@/utils/requestUtil.js';
import { getWxTransactionId, confirmReceiveOrder } from '@/api/order.js';

/**
 * 查看物流信息
 * @param {String} orderId - 订单ID
 * @param {String} deliverySn - 物流单号
 * @param {Object} goodsInfo - 商品信息
 * @param {String} goodsInfo.goodsName - 商品名称
 * @param {String} goodsInfo.goodsImgUrl - 商品图片URL
 * @returns {Promise} - 返回Promise对象
 */
export function checkLogistics(orderId, deliverySn, goodsInfo = {}) {
  console.log('查看物流', orderId, deliverySn);

  // 确认参数有效性
  if (!orderId || !deliverySn) {
    console.error('订单ID或物流单号无效', orderId, deliverySn);
    uni.showToast({
      title: '订单信息不完整，无法查询物流',
      icon: 'none'
    });
    return Promise.reject(new Error('订单信息不完整'));
  }

  console.log(`准备查询物流: 订单ID=${orderId}, 物流单号=${deliverySn}, 商品=${goodsInfo.goodsName || '未提供'}`);

  // 使用公共的物流查询方法，并传递商品信息
  return requestCheckLogistics(orderId, deliverySn, goodsInfo)
    .then(token => {
      console.log('物流查询成功，token:', token);
      return token;
    })
    .catch(err => {
      console.error('物流查询失败:', err);
      throw err;
    });
}

/**
 * 确认收货
 * @param {String} orderId - 订单ID
 * @param {String} orderSn - 订单编号
 * @returns {Promise} - 返回Promise对象
 */
export function receiveOrder(orderId, orderSn) {
  if (!orderId) {
    uni.showToast({
      title: '订单ID不能为空',
      icon: 'none'
    });
    return Promise.reject(new Error('订单ID不能为空'));
  }

  // 显示加载中提示
  uni.showLoading({
    title: '获取订单信息...'
  });

  // 如果没有订单编号，直接提示
  if (!orderSn) {
    console.warn('未提供订单编号，无法确认收货');
    uni.hideLoading();
    uni.showToast({
      title: '请在服务号消息中确认收货',
      icon: 'none',
      duration: 2500
    });
    return Promise.resolve({ success: true, message: '已提示用户在服务号中确认收货' });
  }

  // 从后端获取微信交易单号
  return getWxTransactionId(orderSn)
    .then(response => {
      uni.hideLoading();

      if (response.success && response.data && response.data.transaction_id) {
        const transactionId = response.data.transaction_id;
        console.log('获取到交易单号:', transactionId);

        // 拉起确认收货组件
        if (typeof wx !== 'undefined' && wx.openBusinessView) {
          return new Promise((resolve) => {
            wx.openBusinessView({
              businessType: 'weappOrderConfirm',
              extraData: {
                transaction_id: transactionId
              },
              success() {
                console.log('成功拉起确认收货组件');
                resolve({ success: true, message: '已拉起确认收货组件' });
              },
              fail(err) {
                console.error('拉起确认收货组件失败', err);
                uni.showToast({
                  title: '请在服务号消息中确认收货',
                  icon: 'none',
                  duration: 2500
                });
                resolve({ success: true, message: '已提示用户在服务号中确认收货' });
              },
              complete() {
                console.log('隐藏确认收货组件');
                // 不再自动调用传统方式确认收货
              }
            });
          });
        } else {
          console.log('当前环境不支持微信确认收货组件');
          uni.showToast({
            title: '请在服务号消息中确认收货',
            icon: 'none',
            duration: 2500
          });
          return Promise.resolve({ success: true, message: '已提示用户在服务号中确认收货' });
        }
      } else {
        console.error('获取交易单号失败:', response);
        uni.showToast({
          title: '请在服务号消息中确认收货',
          icon: 'none',
          duration: 2500
        });
        return Promise.resolve({ success: true, message: '已提示用户在服务号中确认收货' });
      }
    })
    .catch(error => {
      uni.hideLoading();
      console.error('获取交易单号出错:', error);
      uni.showToast({
        title: '请在服务号消息中确认收货',
        icon: 'none',
        duration: 2500
      });
      return Promise.resolve({ success: true, message: '已提示用户在服务号中确认收货' });
    });
}

/**
 * 使用API方式确认收货
 * @param {String} orderId - 订单ID
 * @returns {Promise} - 返回Promise对象
 */
export function confirmReceiveByApi(orderId) {
  uni.showLoading({
    title: '处理中...'
  });
  
  return confirmReceiveOrder({ orderId: orderId })
    .then(response => {
      uni.hideLoading();
      if (response.code === 200) {
        uni.showToast({
          title: '确认收货成功',
          icon: 'success'
        });
        return { success: true, message: '确认收货成功' };
      } else {
        uni.showToast({
          title: response.message || '确认收货失败',
          icon: 'none'
        });
        return Promise.reject(new Error(response.message || '确认收货失败'));
      }
    })
    .catch(error => {
      uni.hideLoading();
      uni.showToast({
        title: '确认收货失败，请稍后重试',
        icon: 'none'
      });
      return Promise.reject(error);
    });
} 