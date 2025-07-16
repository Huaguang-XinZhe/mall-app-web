<template>
    <view class="invite-code-section">
        <view class="code-display">
            <text class="label">我的邀请码</text>
            <view class="code-box">
                <text class="code">{{ displayCode }}</text>
                <view class="copy-btn" @click="copyCode">
                    <text class="yticon icon-fuzhi"></text>
                    <text>复制</text>
                </view>
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
        }
    },
    computed: {
        displayCode() {
            return this.inviteCode && this.inviteCode.trim() !== '' ? this.inviteCode : '暂无';
        }
    },
    methods: {
        copyCode() {
            if (!this.inviteCode || this.inviteCode.trim() === '') {
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
        }
    }
}
</script>

<style lang="scss" scoped>
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
</style>