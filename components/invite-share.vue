<template>
  <view class="invite-container">
    <view class="invite-header">
      <text class="title">邀请好友</text>
      <text class="subtitle">分享邀请码，邀请好友注册</text>
    </view>
    
    <view class="invite-code-section">
      <view class="code-display">
        <text class="label">我的邀请码</text>
        <view class="code-box">
          <text class="code">{{ inviteCode || '暂无' }}</text>
          <view class="copy-btn" @click="copyInviteCode">
            <text class="yticon icon-fuzhi"></text>
            <text>复制邀请码</text>
          </view>
        </view>
      </view>
    </view>
    
    <view class="share-section">
      <text class="section-title">分享方式</text>
      
      <!-- 微信小程序分享 -->
      <!-- #ifdef MP-WEIXIN -->
      <view class="share-item" @click="shareToWechat">
        <view class="share-icon wechat">
          <text class="wechat-icon">💬</text>
        </view>
        <view class="share-content">
          <text class="share-title">微信好友</text>
          <text class="share-desc">分享给微信好友或群聊</text>
        </view>
        <text class="arrow-icon">→</text>
      </view>
      <!-- #endif -->
      
      <!-- 复制链接 -->
      <view class="share-item" @click="copyShareLink">
        <view class="share-icon link">
          <text class="link-icon">🔗</text>
        </view>
        <view class="share-content">
          <text class="share-title">复制链接</text>
          <text class="share-desc">复制邀请链接分享到其他平台</text>
        </view>
        <text class="arrow-icon">→</text>
      </view>
    </view>
    
    <view class="invite-stats" v-if="stats">
      <text class="section-title">邀请统计</text>
      <view class="stats-grid">
        <view class="stats-item">
          <text class="stats-number">{{ stats.invitedCount || 0 }}</text>
          <text class="stats-label">已邀请人数</text>
        </view>
        <!-- 可以添加更多统计信息 -->
      </view>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    inviteCode: {
      type: String,
      default: ''
    },
    stats: {
      type: Object,
      default: null
    }
  },
  
  data() {
    return {
      baseShareUrl: '#/pages/public/login?inviteCode='
    }
  },
  
  methods: {
    // 复制邀请码
    copyInviteCode() {
      if (!this.inviteCode) {
        uni.showToast({
          title: '暂无邀请码',
          icon: 'none'
        });
        return;
      }
      
      uni.setClipboardData({
        data: this.inviteCode,
        success: () => {
          uni.showToast({
            title: '邀请码已复制',
            icon: 'success'
          });
        }
      });
    },
    
    // #ifdef MP-WEIXIN
    // 分享到微信
    shareToWechat() {
      if (!this.inviteCode) {
        uni.showToast({
          title: '暂无邀请码，无法分享',
          icon: 'none'
        });
        return;
      }
      
      // 微信小程序环境下，提示用户使用右上角分享按钮
      uni.showModal({
        title: '分享邀请',
        content: '点击右上角"···"按钮，然后点击"转发"或"分享到朋友圈"即可邀请好友',
        showCancel: false,
        confirmText: '我知道了'
      });
    },
    // #endif
    
    // 复制分享链接
    copyShareLink() {
      if (!this.inviteCode) {
        uni.showToast({
          title: '暂无邀请码，无法生成链接',
          icon: 'none'
        });
        return;
      }
      
      // 生成小程序路径
      const sharePath = `pages/index/index?inviteCode=${this.inviteCode}`;
      const shareText = `邀请您注册商城小程序，我的邀请码：${this.inviteCode}，小程序路径：${sharePath}`;
      
      uni.setClipboardData({
        data: shareText,
        success: () => {
          uni.showToast({
            title: '邀请信息已复制',
            icon: 'success'
          });
        }
      });
    }
  }
}
</script>

<style lang="scss" scoped>
.invite-container {
  padding: 40upx;
}

.invite-header {
  text-align: center;
  margin-bottom: 60upx;
  
  .title {
    display: block;
    font-size: 48upx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20upx;
  }
  
  .subtitle {
    font-size: 28upx;
    color: #666;
  }
}

.invite-code-section {
  margin-bottom: 60upx;
}

.code-display {
  .label {
    display: block;
    font-size: 32upx;
    color: #333;
    margin-bottom: 20upx;
  }
  
  .code-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #f5f5f5;
    border-radius: 12upx;
    padding: 30upx;
    
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
      padding: 16upx 24upx;
      border-radius: 8upx;
      font-size: 24upx;
      transition: all 0.2s;
      
      &:active {
        transform: scale(0.95);
        opacity: 0.9;
      }
      
      .yticon {
        margin-right: 10upx;
        font-size: 26upx;
      }
    }
  }
}

.share-section {
  margin-bottom: 60upx;
}

.section-title {
  display: block;
  font-size: 32upx;
  color: #333;
  margin-bottom: 30upx;
  font-weight: bold;
}

.share-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12upx;
  padding: 30upx;
  margin-bottom: 20upx;
  box-shadow: 0 2upx 8upx rgba(0, 0, 0, 0.1);
  
  &:active {
    background: #f9f9f9;
  }
}

.share-icon {
  width: 80upx;
  height: 80upx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24upx;
  
  .wechat-icon, .link-icon {
    font-size: 40upx;
  }
  
  &.wechat {
    background: #07c160;
  }
  
  &.link {
    background: #FA436A;
  }
}

.arrow-icon {
  font-size: 32upx;
  color: #999;
}

.share-content {
  flex: 1;
  
  .share-title {
    display: block;
    font-size: 32upx;
    color: #333;
    margin-bottom: 8upx;
  }
  
  .share-desc {
    font-size: 24upx;
    color: #666;
  }
}

.invite-stats {
  .stats-grid {
    display: flex;
    justify-content: center;
  }
  
  .stats-item {
    text-align: center;
    background: #fff;
    border-radius: 12upx;
    padding: 40upx;
    box-shadow: 0 2upx 8upx rgba(0, 0, 0, 0.1);
    
    .stats-number {
      display: block;
      font-size: 48upx;
      font-weight: bold;
      color: #FA436A;
      margin-bottom: 16upx;
    }
    
    .stats-label {
      font-size: 28upx;
      color: #666;
    }
  }
}
</style> 