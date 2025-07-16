/**
 * 提现工具类
 * 用于处理提现限额相关计算
 */

/**
 * 计算实际可提现金额（考虑限额）
 * @param {Number|String} availableAmount 可提现金额
 * @param {Number|String} singleLimit 单笔限额
 * @param {Number|String} dailyLimit 日限额
 * @param {Number|String} dailyUsed 日已用额度
 * @returns {Object} 包含实际可提现金额、是否部分提现等信息
 */
export function calculateWithdrawAmount(availableAmount, singleLimit, dailyLimit, dailyUsed) {
  // 转换为数字类型
  const available = parseFloat(availableAmount || 0);
  const single = parseFloat(singleLimit || 0);
  const daily = parseFloat(dailyLimit || 0);
  const used = parseFloat(dailyUsed || 0);
  
  // 默认结果
  const result = {
    actualAmount: available,
    isPartial: false,
    limitedBySingle: false,
    limitedByDaily: false,
    remainingCount: 1,
    canWithdraw: available > 0
  };
  
  // 如果可提现金额为0，则无法提现
  if (available <= 0) {
    result.actualAmount = 0;
    result.canWithdraw = false;
    return result;
  }
  
  // 检查单笔限额
  if (single > 0 && available > single) {
    result.actualAmount = single;
    result.isPartial = true;
    result.limitedBySingle = true;
    result.remainingCount = Math.ceil(available / single);
  }
  
  // 检查日限额
  if (daily > 0) {
    const dailyRemaining = daily - used;
    if (dailyRemaining <= 0) {
      // 今日额度已用完
      result.actualAmount = 0;
      result.canWithdraw = false;
      result.limitedByDaily = true;
    } else if (result.actualAmount > dailyRemaining) {
      // 今日剩余额度不足
      result.actualAmount = dailyRemaining;
      result.isPartial = true;
      result.limitedByDaily = true;
      
      // 重新计算需要提现的次数
      if (result.limitedBySingle) {
        // 同时受单笔和日限额限制，取最小值
        const singleCount = Math.ceil(available / single);
        const dailyCount = Math.ceil(available / dailyRemaining);
        result.remainingCount = Math.max(singleCount, dailyCount);
      } else {
        result.remainingCount = Math.ceil(available / dailyRemaining);
      }
    }
  }
  
  // 格式化金额为两位小数
  result.actualAmount = parseFloat(result.actualAmount.toFixed(2));
  
  return result;
}

/**
 * 生成提现限额提示文本
 * @param {Object} withdrawInfo 提现信息
 * @returns {String} 提示文本
 */
export function generateLimitTips(withdrawInfo) {
  const { isPartial, limitedBySingle, limitedByDaily, remainingCount, canWithdraw } = withdrawInfo;
  
  if (!canWithdraw) {
    if (limitedByDaily) {
      return '今日提现额度已用完，请明天再试';
    }
    return '暂无可提现金额';
  }
  
  if (isPartial) {
    let tips = '由于微信支付限制，';
    
    if (limitedBySingle && limitedByDaily) {
      tips += '受单笔限额和日限额影响，';
    } else if (limitedBySingle) {
      tips += '受单笔限额影响，';
    } else if (limitedByDaily) {
      tips += '受日限额影响，';
    }
    
    tips += `您需要分${remainingCount}次提取完所有金额`;
    return tips;
  }
  
  return '';
} 