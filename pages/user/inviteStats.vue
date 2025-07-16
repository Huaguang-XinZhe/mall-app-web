<template>
  <view class="container">
    <!-- 导航栏 -->
    <custom-nav title="邀请提现" @back="goBack"></custom-nav>

    <!-- 内容区域 -->
    <view class="content">
      <!-- 只在微信小程序中显示完整功能 -->
      <!-- #ifdef MP-WEIXIN -->
      <!-- 邀请码信息 -->
      <invite-code-section :invite-code="displayInviteCode"></invite-code-section>

      <!-- 邀请统计 -->
      <invite-stats-section :invited-count="withdrawInfo.invitedCount || 0"
        :commission-rate="withdrawInfo.commissionRate || 0.3"
        :total-order-amount="withdrawInfo.totalOrderAmount || '0.00'">
      </invite-stats-section>

      <!-- 提现板块 -->
      <withdraw-section :available-commission="withdrawInfo.availableCommission || '0.00'" :can-withdraw="canWithdraw"
        :withdraw-loading="withdrawLoading" @withdraw="submitWithdraw">
      </withdraw-section>

      <!-- 提现记录 -->
      <withdraw-records :records="withdrawRecords || []"></withdraw-records>

      <!-- 邀请的用户列表 -->
      <invited-users-list :users="invitedUsers || []" :invited-count="withdrawInfo.invitedCount || 0">
      </invited-users-list>

      <!-- #endif -->

      <!-- 非微信小程序提示 -->
      <!-- #ifndef MP-WEIXIN -->
      <unsupported-platform></unsupported-platform>
      <!-- #endif -->
    </view>
  </view>
</template>

<script>
import { mapState } from 'vuex';
import { getInviteStats, getInviteWithdrawInfo, requestWithdraw, getWithdrawRecords } from '@/api/user.js';
import { AUTH_API_BASE_URL } from '@/utils/appConfig.js';
import CustomNav from '@/components/user/custom-nav.vue';
import InviteCodeSection from '@/components/user/invite-code-section.vue';
import InviteStatsSection from '@/components/user/invite-stats-section.vue';
import WithdrawSection from '@/components/user/withdraw-section.vue';
import WithdrawRecords from '@/components/user/withdraw-records.vue';
import InvitedUsersList from '@/components/user/invited-users-list.vue';
import UnsupportedPlatform from '@/components/user/unsupported-platform.vue';

export default {
  components: {
    CustomNav,
    InviteCodeSection,
    InviteStatsSection,
    WithdrawSection,
    WithdrawRecords,
    InvitedUsersList,
    UnsupportedPlatform
  },

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
      withdrawStatusTimer: null,
      withdrawStatusCheckCount: 0
    }
  },

  computed: {
    ...mapState(['hasLogin', 'userInfo', 'inviteCode']),
    // 确保使用store中的邀请码作为备用
    displayInviteCode() {
      return this.withdrawInfo.inviteCode || this.inviteCode || '';
    }
  },

  onLoad() {
    console.log('页面加载 - store中的邀请码:', this.inviteCode);
    console.log('页面加载 - 用户信息:', JSON.stringify(this.userInfo).substring(0, 100));

    if (this.hasLogin) {
      // 初始化数据，确保有默认值
      this.withdrawInfo.inviteCode = this.inviteCode || '';
      this.loadWithdrawInfo();
    } else {
      this.redirectToLogin();
    }
  },

  onShow() {
    // 页面显示时也刷新数据
    if (this.hasLogin) {
      this.loadWithdrawInfo();
    }
  },

  onUnload() {
    // 页面卸载时清除定时器
    if (this.withdrawStatusTimer) {
      clearTimeout(this.withdrawStatusTimer);
    }
  },

  // #ifdef MP-WEIXIN
  onShareAppMessage() {
    if (this.displayInviteCode) {
      return {
        title: '邀请您加入商城，注册即享优惠',
        path: `/pages/index/index?inviteCode=${this.displayInviteCode}`,
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
    if (this.displayInviteCode) {
      return {
        title: '邀请您加入商城，注册即享优惠',
        query: `inviteCode=${this.displayInviteCode}`,
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

        // 提现后必须获取最新数据，不使用缓存
        this.fetchWithdrawInfo();
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
        // 添加时间戳参数避免缓存
        const timestamp = new Date().getTime();
        console.log(`开始获取提现信息，时间戳：${timestamp}`);
        const response = await getInviteWithdrawInfo({ _t: timestamp });

        if (response.success && response.data) {
          console.log('提现信息获取成功:', response.data);

          // 确保所有字段都有默认值
          this.withdrawInfo = {
            inviteCode: response.data.inviteCode || this.inviteCode || '',
            invitedCount: response.data.invitedCount || 0,
            commissionRate: response.data.commissionRate || 0.3,
            totalOrderAmount: response.data.totalOrderAmount || '0.00',
            availableCommission: response.data.availableCommission || '0.00',
            openid: response.data.openid || '',
            processingWithdraw: response.data.processingWithdraw || false
          };

          // 判断是否可以提现
          const availableAmount = parseFloat(this.withdrawInfo.availableCommission);
          console.log(`可提现金额: ${availableAmount}, 处理中提现: ${this.withdrawInfo.processingWithdraw ? 'true' : 'false'}`);
          this.canWithdraw = availableAmount > 0 && !this.withdrawInfo.processingWithdraw;

          // 更新本地缓存，设置短暂过期时间
          const now = new Date().getTime();
          const inviteInfo = {
            inviteCode: this.withdrawInfo.inviteCode,
            invitedCount: this.withdrawInfo.invitedCount,
            openid: this.withdrawInfo.openid,
            expireTime: now + 10000 // 当前时间 + 10秒，确保频繁刷新
          };
          uni.setStorageSync('inviteInfo', inviteInfo);

          // 如果store中没有邀请码但API返回了，更新store
          if (!this.inviteCode && this.withdrawInfo.inviteCode) {
            this.$store.commit('setInviteCode', this.withdrawInfo.inviteCode);
          }
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
        // 添加时间戳参数避免缓存
        const timestamp = new Date().getTime();
        const response = await getInviteStats({ _t: timestamp });

        if (response.success && response.data) {
          this.invitedUsers = response.data.invitedUsers || [];
        }
      } catch (error) {
        console.error('获取邀请用户列表失败:', error);
      }
    },

    async loadWithdrawRecords() {
      try {
        // 添加时间戳参数避免缓存
        const timestamp = new Date().getTime();
        const response = await getWithdrawRecords({ _t: timestamp });

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

        // 构建提现数据
        const transferData = {
          amount: parseFloat(this.withdrawInfo.availableCommission),
          transfer_remark: '邀请好友奖励活动'
        };

        // 调用后端API
        const response = await requestWithdraw(transferData);

        uni.hideLoading();

        if (response.success) {
          // 获取 package_info 用于拉起微信收款确认页面
          const packageInfo = response.data.packageInfo || response.data.package_info;

          if (packageInfo) {
            // #ifdef MP-WEIXIN
            if (wx.canIUse('requestMerchantTransfer')) {
              wx.requestMerchantTransfer({
                mchId: process.env.WECHAT_MCH_ID || '1721095761',
                appId: wx.getAccountInfoSync().miniProgram.appId,
                package: packageInfo,
                success: () => {
                  // 提示用户提现申请已提交，但需要等待处理
                  uni.showToast({
                    title: '提现申请已提交',
                    icon: 'success'
                  });

                  // 显示更详细的提示
                  setTimeout(() => {
                    // 清除本地缓存，强制重新获取数据
                    uni.removeStorageSync('inviteInfo');
                    // 开始轮询检查提现状态
                    this.startWithdrawStatusCheck();
                  }, 1500);
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
            uni.showToast({
              title: '提现申请已提交',
              icon: 'success'
            });

            // 显示更详细的提示
            setTimeout(() => {
              uni.showModal({
                title: '提现处理中',
                content: '您的提现申请已提交，系统将在1-2分钟内处理。如果您已确认收款，请稍后刷新页面查看结果。',
                showCancel: false,
                success: () => {
                  // 延迟刷新数据，确保后端处理完成
                  console.log('提现申请已提交，延迟刷新数据');
                  // 清除本地缓存，强制重新获取数据
                  uni.removeStorageSync('inviteInfo');
                  // 立即刷新提现信息和记录
                  this.fetchWithdrawInfo();
                }
              });
            }, 1000);
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

    // 开始轮询检查提现状态
    startWithdrawStatusCheck() {
      console.log('开始轮询检查提现状态');
      // 清除可能存在的上一次轮询
      if (this.withdrawStatusTimer) {
        clearTimeout(this.withdrawStatusTimer);
      }

      // 设置轮询次数和间隔
      this.withdrawStatusCheckCount = 0;
      this.checkWithdrawStatus();
    },

    // 检查提现状态
    checkWithdrawStatus() {
      // 最多轮询2次，每次间隔5秒
      if (this.withdrawStatusCheckCount >= 2) {
        console.log('轮询结束，最大次数已达到');
        // 最后再刷新一次数据
        this.fetchWithdrawInfo();
        return;
      }

      this.withdrawStatusCheckCount++;
      console.log(`第${this.withdrawStatusCheckCount}次检查提现状态`);

      // 获取最新提现信息
      this.fetchWithdrawInfo();

      // 设置下一次检查的定时器
      this.withdrawStatusTimer = setTimeout(() => {
        this.checkWithdrawStatus();
      }, 5000); // 5秒检查一次
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #f5f5f5;
}

.content {
  padding: 20upx;
}
</style>