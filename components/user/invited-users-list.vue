<template>
    <view>
        <view class="invited-list" v-if="users && users.length > 0">
            <view class="section-title">已邀请的用户</view>
            <view class="user-item" v-for="user in users" :key="user.id">
                <image class="avatar"
                    :src="user.avatar_url || 'https://boyangchuanggu-mall.oss-cn-guangzhou.aliyuncs.com/static/missing-face.png'"
                    mode="aspectFill" />
                <view class="user-info">
                    <text class="nickname">{{ user.nickname || '用户' + user.id }}</text>
                    <text class="join-time">加入时间：{{ formatTime(user.created_at) }}</text>
                </view>
            </view>
        </view>

        <view class="empty-state" v-else-if="invitedCount === 0">
            <text class="empty-text">还没有邀请过用户</text>
            <text class="empty-hint">分享邀请码给好友，他们注册成功后会显示在这里</text>
        </view>
    </view>
</template>

<script>
export default {
    props: {
        users: {
            type: Array,
            default: () => []
        },
        invitedCount: {
            type: Number,
            default: 0
        }
    },
    methods: {
        formatTime(timeStr) {
            if (!timeStr) return '';

            // 将日期字符串转换为iOS兼容格式
            let compatibleTimeStr = timeStr;

            // 检查是否包含空格分隔的日期和时间
            if (timeStr.includes(' ')) {
                // 将空格替换为'T'以符合ISO标准
                compatibleTimeStr = timeStr.replace(' ', 'T');
            }

            try {
                const date = new Date(compatibleTimeStr);

                // 检查日期是否有效
                if (isNaN(date.getTime())) {
                    console.warn('无效的日期格式:', timeStr);
                    return timeStr; // 返回原始字符串
                }

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
                    // 使用iOS兼容的日期格式化方法
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                }
            } catch (error) {
                console.error('日期格式化错误:', error);
                return timeStr; // 出错时返回原始字符串
            }
        }
    }
}
</script>

<style lang="scss" scoped>
.section-title {
    display: block;
    font-size: 32upx;
    color: #333;
    margin: 40upx 0 20upx 0;
    font-weight: bold;
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
</style>