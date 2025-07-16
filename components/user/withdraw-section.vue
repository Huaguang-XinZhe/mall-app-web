<template>
    <view class="withdraw-section">
        <view class="section-title">申请提现</view>
        <view class="withdraw-card">
            <view class="available-amount">
                <text class="label">可提现金额</text>
                <text class="amount">¥{{ availableCommission || '0.00' }}</text>
            </view>

            <view class="withdraw-form">
                <view class="withdraw-tips">
                    <text>提现说明：</text>
                    <text>1. 提现将全额提取可提现金额</text>
                    <text>2. 提现将直接转入您的微信钱包</text>
                </view>

                <button class="withdraw-btn" :disabled="!canWithdraw || withdrawLoading"
                    :class="{ disabled: !canWithdraw || withdrawLoading }" @click="onWithdraw">{{ withdrawLoading ?
                        '处理中...' : '申请提现' }}</button>
            </view>
        </view>
    </view>
</template>

<script>
export default {
    props: {
        availableCommission: {
            type: String,
            default: '0.00'
        },
        canWithdraw: {
            type: Boolean,
            default: false
        },
        withdrawLoading: {
            type: Boolean,
            default: false
        }
    },
    methods: {
        onWithdraw() {
            this.$emit('withdraw');
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
</style>