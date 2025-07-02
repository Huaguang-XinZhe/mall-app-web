<template>
  <view class="container">
    <!-- 导航栏 -->
    <view class="custom-nav">
      <view class="nav-back" @click="goBack">
        <text class="back-icon">〈</text>
      </view>
      <text class="nav-title">邀请统计</text>
    </view>
    
    <!-- 内容区域 -->
    <view class="content">
      <!-- 只在微信小程序中显示完整功能 -->
      <!-- #ifdef MP-WEIXIN -->
      <invite-share 
        :inviteCode="inviteCode" 
        :stats="inviteStats"
      />
      
      <!-- 邀请的用户列表 -->
      <view class="invited-list" v-if="invitedUsers && invitedUsers.length > 0">
        <view class="section-title">已邀请的用户</view>
        <view class="user-item" v-for="user in invitedUsers" :key="user.id">
          <image 
            class="avatar" 
            :src="user.avatar_url || '/static/missing-face.png'"
            mode="aspectFill"
          />
          <view class="user-info">
            <text class="nickname">{{ user.nickname || '用户' + user.id }}</text>
            <text class="join-time">加入时间：{{ formatTime(user.created_at) }}</text>
          </view>
        </view>
      </view>
      
      <view class="empty-state" v-else-if="inviteStats && inviteStats.invitedCount === 0">
        <text class="empty-text">还没有邀请过用户</text>
        <text class="empty-hint">分享邀请码给好友，他们注册成功后会显示在这里</text>
      </view>
      <!-- #endif -->
      
      <!-- 非微信小程序提示 -->
      <!-- #ifndef MP-WEIXIN -->
      <view class="unsupported-platform">
        <image class="hint-icon" src="/static/missing-face.png" mode="aspectFit" />
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
import { getInviteStats } from '@/api/user.js';
import inviteShare from '@/components/invite-share.vue';

export default {
  components: {
    inviteShare
  },
  
  data() {
    return {
      inviteStats: null,
      invitedUsers: [],
      loading: false
    }
  },
  
  computed: {
    ...mapState(['hasLogin', 'userInfo', 'inviteCode'])
  },
  
  onLoad() {
    if (this.hasLogin) {
      this.loadInviteStats();
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
        imageUrl: '/static/user-bg.jpg'
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
        imageUrl: '/static/user-bg.jpg'
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
        content: '请先登录后查看邀请统计',
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
    
    async loadInviteStats() {
      if (this.loading) return;
      
      try {
        this.loading = true;
        const response = await getInviteStats();
        
        if (response.success && response.data) {
          this.inviteStats = {
            inviteCode: response.data.inviteCode,
            invitedCount: response.data.invitedCount
          };
          this.invitedUsers = response.data.invitedUsers || [];
        }
      } catch (error) {
        console.error('获取邀请统计失败:', error);
        uni.showToast({
          title: '获取邀请统计失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
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
  padding-top: 20upx;
}

.section-title {
  display: block;
  font-size: 32upx;
  color: #333;
  margin: 40upx 40upx 30upx 40upx;
  font-weight: bold;
}

.invited-list {
  background: #fff;
  margin: 0 30upx;
  border-radius: 12upx;
  overflow: hidden;
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