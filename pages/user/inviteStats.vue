<template>
  <view class="container">
    <!-- 导航栏 -->
    <view class="custom-nav">
      <view class="nav-back" @click="goBack">
        <text class="back-icon">〈</text>
      </view>
      <text class="nav-title">邀请提现</text>
    </view>
    
    <!-- 内容区域 -->
    <view class="content">
      <!-- 只在微信小程序中显示完整功能 -->
      <!-- #ifdef MP-WEIXIN -->
      <!-- 邀请码信息 -->
      <view class="invite-code-section">
        <view class="code-display">
          <text class="label">我的邀请码</text>
          <view class="code-box">
            <text class="code">{{ withdrawInfo.inviteCode || '暂无' }}</text>
            <view class="copy-btn" @click="copyInviteCode">
              <text class="yticon icon-fuzhi"></text>
              <text>复制</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 邀请统计 -->
      <view class="stats-section">
        <view class="stats-grid">
          <view class="stats-item">
            <text class="stats-number">{{ withdrawInfo.invitedCount || 0 }}</text>
            <text class="stats-label">已邀请人数</text>
          </view>
          <view class="stats-item">
            <text class="stats-number">{{ withdrawInfo.commissionRate * 100 }}%</text>
            <text class="stats-label">分成比例</text>
          </view>
          <view class="stats-item">
            <text class="stats-number">¥{{ withdrawInfo.totalOrderAmount || '0.00' }}</text>
            <text class="stats-label">订单总金额</text>
          </view>
        </view>
      </view>
      
      <!-- 提现板块 -->
      <view class="withdraw-section">
        <view class="section-title">申请提现</view>
        <view class="withdraw-card">
          <view class="available-amount">
            <text class="label">可提现金额</text>
            <text class="amount">¥{{ withdrawInfo.availableCommission || '0.00' }}</text>
          </view>
          
          <view class="withdraw-form">
            <!-- 移除提现金额输入框，改为全额提现 -->
            <view class="withdraw-tips">
              <text>提现说明：</text>
              <text>1. 提现将全额提取可提现金额</text>
              <text>2. 提现将直接转入您的微信钱包</text>
            </view>
            
            <view class="test-mode-switch" v-if="isDev">
              <text class="switch-label">使用测试模式:</text>
              <switch :checked="useTestMode" @change="toggleTestMode" color="#ff9500" />
              <text class="switch-hint">{{ useTestMode ? '模拟转账' : '真实转账' }}</text>
            </view>
            
            <button 
              class="withdraw-btn" 
              :disabled="!canWithdraw || withdrawLoading" 
              :class="{ disabled: !canWithdraw || withdrawLoading }"
              @click="submitWithdraw"
            >{{ withdrawLoading ? '处理中...' : '申请提现' }}</button>
          </view>
        </view>
      </view>
      
      <!-- 提现记录 -->
      <view class="withdraw-records" v-if="withdrawRecords.length > 0">
        <view class="section-title">提现记录</view>
        <view class="record-item" v-for="record in withdrawRecords" :key="record.id">
          <view class="record-left">
            <text class="record-amount">¥{{ record.amount }}</text>
            <text class="record-time">{{ formatDate(record.createTime) }}</text>
          </view>
          <view class="record-status" :class="{
            'status-processing': record.status === 'PROCESSING',
            'status-success': record.status === 'SUCCESS',
            'status-failed': record.status === 'FAILED'
          }">
            {{ getStatusText(record.status) }}
          </view>
        </view>
      </view>
      
      <!-- 邀请的用户列表 -->
      <view class="invited-list" v-if="invitedUsers && invitedUsers.length > 0">
        <view class="section-title">已邀请的用户</view>
        <view class="user-item" v-for="user in invitedUsers" :key="user.id">
          <image 
            class="avatar" 
            :src="user.avatar_url || 'https://boyangchuanggu-mall.oss-cn-guangzhou.aliyuncs.com/static/missing-face.png'"
            mode="aspectFill"
          />
          <view class="user-info">
            <text class="nickname">{{ user.nickname || '用户' + user.id }}</text>
            <text class="join-time">加入时间：{{ formatTime(user.created_at) }}</text>
          </view>
        </view>
      </view>
      
      <view class="empty-state" v-else-if="withdrawInfo.invitedCount === 0">
        <text class="empty-text">还没有邀请过用户</text>
        <text class="empty-hint">分享邀请码给好友，他们注册成功后会显示在这里</text>
      </view>
      <!-- #endif -->
      
      <!-- 非微信小程序提示 -->
      <!-- #ifndef MP-WEIXIN -->
      <view class="unsupported-platform">
        <image class="hint-icon" src="https://boyangchuanggu-mall.oss-cn-guangzhou.aliyuncs.com/static/missing-face.png" mode="aspectFit" />
        <view class="hint-text">
          <text>邀请功能仅支持微信小程序</text>
          <text>请在微信中使用此功能</text>
        </view>
      </view>
      <!-- #endif -->
    </view>
  </view>
</template>

<script>
import { mapState } from 'vuex';
import { getInviteStats, getInviteWithdrawInfo, requestWithdraw, getWithdrawRecords } from '@/api/user.js';

export default {
  data() {
    return {
      withdrawInfo: {
        invitedCount: 0,
        inviteCode: '',
        commissionRate: 0.3,
        totalOrderAmount: '0.00',
        availableCommission: '0.00',
        openid: ''
      },
      invitedUsers: [],
      loading: false,
      withdrawLoading: false,
      canWithdraw: false,
      withdrawRecords: [],
      useTestMode: true,
      isDev: process.env.NODE_ENV === 'development'
    }
  },
  
  computed: {
    ...mapState(['hasLogin', 'userInfo', 'inviteCode'])
  },
  
  onLoad() {
    if (this.hasLogin) {
      this.loadWithdrawInfo();
    } else {
      this.redirectToLogin();
    }
  },
  
  // #ifdef MP-WEIXIN
  onShareAppMessage() {
    if (this.inviteCode) {
      return {
        title: '邀请您加入商城，注册即享优惠',
        path: `/pages/index/index?inviteCode=${this.inviteCode}`,
        imageUrl: 'https://boyangchuanggu-mall.oss-cn-guangzhou.aliyuncs.com/static/user-bg.jpg'
      };
    }
    return {
      title: '商城小程序',
      path: '/pages/index/index'
    };
  },
  // #endif
  
  // #ifdef MP-WEIXIN
  onShareTimeline() {
    if (this.inviteCode) {
      return {
        title: '邀请您加入商城，注册即享优惠',
        query: `inviteCode=${this.inviteCode}`,
        imageUrl: 'https://boyangchuanggu-mall.oss-cn-guangzhou.aliyuncs.com/static/user-bg.jpg'
      };
    }
    return {
      title: '商城小程序'
    };
  },
  // #endif
  
  methods: {
    goBack() {
      uni.navigateBack();
    },
    
    redirectToLogin() {
      uni.showModal({
        title: '未登录',
        content: '请先登录后查看邀请提现',
        success: (res) => {
          if (res.confirm) {
            uni.reLaunch({
              url: '/pages/public/login'
            });
          } else {
            uni.navigateBack();
          }
        }
      });
    },
    
    async loadWithdrawInfo() {
      if (this.loading) return;
      
      try {
        this.loading = true;
        
        // 检查本地缓存中是否有邀请信息，且未过期
        const cachedInviteInfo = uni.getStorageSync('inviteInfo');
        const now = new Date().getTime();
        
        if (cachedInviteInfo && cachedInviteInfo.expireTime > now) {
          console.log('使用本地缓存的邀请信息:', cachedInviteInfo);
          // 使用本地缓存的基本信息
          this.withdrawInfo.inviteCode = cachedInviteInfo.inviteCode;
          this.withdrawInfo.invitedCount = cachedInviteInfo.invitedCount;
          
          // 仍然需要获取提现相关信息
          this.fetchWithdrawInfo();
        } else {
          // 直接获取完整的提现信息
          this.fetchWithdrawInfo();
        }
      } catch (error) {
        console.error('加载提现信息失败:', error);
        uni.showToast({
          title: '加载提现信息失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
    async fetchWithdrawInfo() {
      try {
        const response = await getInviteWithdrawInfo();
        
        if (response.success && response.data) {
          this.withdrawInfo = {
            inviteCode: response.data.inviteCode,
            invitedCount: response.data.invitedCount,
            commissionRate: response.data.commissionRate,
            totalOrderAmount: response.data.totalOrderAmount,
            availableCommission: response.data.availableCommission,
            openid: response.data.openid,
            processingWithdraw: response.data.processingWithdraw
          };
          
          // 判断是否可以提现
          const availableAmount = parseFloat(this.withdrawInfo.availableCommission);
          this.canWithdraw = availableAmount > 0 && !this.withdrawInfo.processingWithdraw;
          
          // 存储到本地缓存，设置1分钟过期时间
          const now = new Date().getTime();
          const inviteInfo = {
            inviteCode: response.data.inviteCode,
            invitedCount: response.data.invitedCount,
            openid: response.data.openid,
            expireTime: now + 60000 // 当前时间 + 1分钟
          };
          uni.setStorageSync('inviteInfo', inviteInfo);
        }
        
        // 获取邀请的用户列表
        this.loadInvitedUsers();
        
        // 获取提现记录
        this.loadWithdrawRecords();
      } catch (error) {
        console.error('获取提现信息失败:', error);
        uni.showToast({
          title: '获取提现信息失败',
          icon: 'none'
        });
      }
    },
    
    async loadInvitedUsers() {
      try {
        const response = await getInviteStats();
        
        if (response.success && response.data) {
          this.invitedUsers = response.data.invitedUsers || [];
        }
      } catch (error) {
        console.error('获取邀请用户列表失败:', error);
      }
    },
    
    async loadWithdrawRecords() {
      try {
        const response = await getWithdrawRecords();
        
        if (response.success && response.data) {
          this.withdrawRecords = response.data.records || [];
        }
      } catch (error) {
        console.error('获取提现记录失败:', error);
      }
    },
    
    async submitWithdraw() {
      if (!this.canWithdraw || this.withdrawLoading) return;
      
      try {
        this.withdrawLoading = true;
        
        uni.showLoading({
          title: '提交中...'
        });
        
        const response = await requestWithdraw({
          testMode: this.useTestMode,
          remark: '邀请奖励提现'
        });
        
        uni.hideLoading();
        
        if (response.success) {
          // 如果有 packageInfo，需要拉起微信收款确认页面
          const packageInfo = response.data.packageInfo;
          
          if (packageInfo) {
            // #ifdef MP-WEIXIN
            if (wx.canIUse('requestMerchantTransfer')) {
              wx.requestMerchantTransfer({
                mchId: process.env.WECHAT_MCH_ID || '1721095761', 
                appId: wx.getAccountInfoSync().miniProgram.appId,
                package: packageInfo,
                success: (res) => {
                  uni.showModal({
                    title: '提现申请已提交',
                    content: `提现金额: ¥${response.data.amount}\n审核通过后将转入您的微信钱包`,
                    showCancel: false,
                    success: () => {
                      // 刷新提现信息
                      this.fetchWithdrawInfo();
                    }
                  });
                },
                fail: (res) => {
                  uni.showToast({
                    title: '收款确认失败',
                    icon: 'none'
                  });
                }
              });
            } else {
              uni.showModal({
                content: '你的微信版本过低，请更新至最新版本。',
                showCancel: false
              });
            }
            // #endif
          } else {
            uni.showModal({
              title: '提现申请已提交',
              content: `提现金额: ¥${response.data.amount}\n审核通过后将转入您的微信钱包`,
              showCancel: false,
              success: () => {
                // 刷新提现信息
                this.fetchWithdrawInfo();
              }
            });
          }
        } else {
          uni.showToast({
            title: response.message || '提现申请失败',
            icon: 'none'
          });
        }
      } catch (error) {
        uni.hideLoading();
        console.error('提现申请失败:', error);
        uni.showToast({
          title: error.message || '提现申请失败',
          icon: 'none'
        });
      } finally {
        this.withdrawLoading = false;
      }
    },
    
    toggleTestMode(e) {
      this.useTestMode = e.detail.value;
    },
    
    copyInviteCode() {
      if (!this.withdrawInfo.inviteCode) {
        uni.showToast({
          title: '暂无邀请码',
          icon: 'none'
        });
        return;
      }
      
      uni.setClipboardData({
        data: this.withdrawInfo.inviteCode,
        success: () => {
          uni.showToast({
            title: '邀请码已复制',
            icon: 'success'
          });
        }
      });
    },
    
    formatTime(timeStr) {
      if (!timeStr) return '';
      const date = new Date(timeStr);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      
      if (days === 0) {
        return '今天';
      } else if (days === 1) {
        return '昨天';
      } else if (days < 30) {
        return `${days}天前`;
      } else {
        return date.toLocaleDateString();
      }
    },
    
    formatDate(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    },
    
    getStatusText(status) {
      const statusMap = {
        'PROCESSING': '处理中',
        'SUCCESS': '成功',
        'FAILED': '失败'
      };
      return statusMap[status] || '未知';
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #f5f5f5;
}

.custom-nav {
  position: relative;
  height: 180upx;
  background-color: #FA436A;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding-bottom: 20upx;
  
  .nav-back {
    position: absolute;
    left: 30upx;
    bottom: 20upx;
    width: 60upx;
    height: 60upx;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .back-icon {
      color: #fff;
      font-size: 44upx;
      font-weight: bold;
    }
  }
  
  .nav-title {
    color: #fff;
    font-size: 36upx;
    text-align: center;
    font-weight: bold;
    margin-bottom: 10upx;
  }
}

.content {
  padding: 20upx;
}

.section-title {
  display: block;
  font-size: 32upx;
  color: #333;
  margin: 40upx 0 20upx 0;
  font-weight: bold;
}

.invite-code-section {
  background: #fff;
  border-radius: 12upx;
  padding: 30upx;
  margin-bottom: 20upx;
  box-shadow: 0 2upx 8upx rgba(0, 0, 0, 0.1);
}

.code-display {
  .label {
    display: block;
    font-size: 28upx;
    color: #666;
    margin-bottom: 20upx;
  }
  
  .code-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    .code {
      font-size: 36upx;
      font-weight: bold;
      color: #FA436A;
      letter-spacing: 4upx;
    }
    
    .copy-btn {
      display: flex;
      align-items: center;
      background: #FA436A;
      color: #fff;
      padding: 12upx 24upx;
      border-radius: 8upx;
      font-size: 24upx;
      
      .yticon {
        margin-right: 10upx;
        font-size: 24upx;
      }
    }
  }
}

.stats-section {
  margin-bottom: 20upx;
  
  .stats-grid {
    display: flex;
    justify-content: space-between;
  }
  
  .stats-item {
    flex: 1;
    text-align: center;
    background: #fff;
    border-radius: 12upx;
    padding: 20upx 0;
    margin: 0 10upx;
    box-shadow: 0 2upx 8upx rgba(0, 0, 0, 0.1);
    
    &:first-child {
      margin-left: 0;
    }
    
    &:last-child {
      margin-right: 0;
    }
    
    .stats-number {
      display: block;
      font-size: 32upx;
      font-weight: bold;
      color: #FA436A;
      margin-bottom: 10upx;
    }
    
    .stats-label {
      font-size: 24upx;
      color: #666;
    }
  }
}

.withdraw-section {
  background: #fff;
  border-radius: 12upx;
  padding: 30upx;
  margin-bottom: 20upx;
  box-shadow: 0 2upx 8upx rgba(0, 0, 0, 0.1);
  
  .available-amount {
    margin-bottom: 30upx;
    
    .label {
      font-size: 28upx;
      color: #666;
      margin-bottom: 10upx;
      display: block;
    }
    
    .amount {
      font-size: 48upx;
      font-weight: bold;
      color: #FA436A;
    }
  }
  
  .withdraw-form {
    .withdraw-tips {
      margin: 30upx 0;
      
      text {
        display: block;
        font-size: 24upx;
        color: #999;
        line-height: 1.6;
      }
    }
    
    .withdraw-btn {
      background: #FA436A;
      color: #fff;
      border-radius: 50upx;
      height: 90upx;
      line-height: 90upx;
      font-size: 32upx;
      font-weight: bold;
      box-shadow: 0 4upx 8upx rgba(250, 67, 106, 0.3);
      
      &.disabled {
        background: #ccc;
        box-shadow: none;
      }
    }
  }
}

.test-mode-switch {
  display: flex;
  align-items: center;
  margin-bottom: 30upx;
  padding-left: 20upx;

  .switch-label {
    font-size: 28upx;
    color: #666;
    margin-right: 15upx;
  }

  .switch-hint {
    font-size: 24upx;
    color: #999;
    margin-left: 10upx;
  }
}

.withdraw-records {
  background: #fff;
  border-radius: 12upx;
  padding: 30upx;
  margin-bottom: 20upx;
  box-shadow: 0 2upx 8upx rgba(0, 0, 0, 0.1);
  
  .record-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20upx 0;
    border-bottom: 1px solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
    
    .record-left {
      .record-amount {
        font-size: 32upx;
        font-weight: bold;
        color: #333;
        display: block;
        margin-bottom: 8upx;
      }
      
      .record-time {
        font-size: 24upx;
        color: #999;
      }
    }
    
    .record-status {
      font-size: 28upx;
      
      &.status-processing {
        color: #007aff;
      }
      
      &.status-success {
        color: #34c759;
      }
      
      &.status-failed {
        color: #ff3b30;
      }
    }
  }
}

.invited-list {
  background: #fff;
  border-radius: 12upx;
  overflow: hidden;
  margin-bottom: 20upx;
  box-shadow: 0 2upx 8upx rgba(0, 0, 0, 0.1);
}

.user-item {
  display: flex;
  align-items: center;
  padding: 30upx;
  border-bottom: 1upx solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
  
  .avatar {
    width: 80upx;
    height: 80upx;
    border-radius: 50%;
    margin-right: 24upx;
  }
  
  .user-info {
    flex: 1;
    
    .nickname {
      display: block;
      font-size: 32upx;
      color: #333;
      margin-bottom: 8upx;
    }
    
    .join-time {
      font-size: 24upx;
      color: #999;
    }
  }
}

.empty-state {
  text-align: center;
  padding: 40upx 60upx;
  margin-top: 30upx;
  background: #fff;
  border-radius: 12upx;
  box-shadow: 0 2upx 8upx rgba(0, 0, 0, 0.1);
  
  .empty-text {
    display: block;
    font-size: 32upx;
    color: #666;
    margin-bottom: 20upx;
  }
  
  .empty-hint {
    font-size: 28upx;
    color: #999;
    line-height: 1.6;
  }
}

.unsupported-platform {
  text-align: center;
  padding: 120upx 60upx;
  
  .hint-icon {
    width: 200upx;
    height: 200upx;
    margin-bottom: 40upx;
    opacity: 0.6;
  }
  
  .hint-text {
    text {
      display: block;
      font-size: 32upx;
      color: #666;
      line-height: 1.6;
      margin-bottom: 20upx;
    }
  }
}
</style> 