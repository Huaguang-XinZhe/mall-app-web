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
                    <text v-if="hasSingleLimit">1. 单笔提现限额：¥{{ singleLimit }}</text>
                    <text v-if="hasDailyLimit">{{ hasSingleLimit ? '2' : '1' }}. 日提现限额：¥{{ dailyLimit }}</text>
                    <text v-if="hasLimitTips" class="limit-warning">{{ limitTips }}</text>
                    <text>{{ limitNumberPrefix }}. 提现将{{ isPartialWithdraw ? '按限额' : '全额' }}提取{{ isPartialWithdraw ?
                        '部分' : '' }}可提现金额</text>
                    <text>{{ limitNumberPrefix + 1 }}. 提现将直接转入您的微信钱包</text>
                    <text v-if="remainingWithdrawCount > 1" class="multi-withdraw-tip">您需要分{{ remainingWithdrawCount
                    }}次提取完所有金额</text>
                </view>

                <view v-if="isPartialWithdraw" class="withdraw-amount-info">
                    <text class="withdraw-amount-label">本次提现金额</text>
                    <text class="withdraw-amount-value">¥{{ actualWithdrawAmount }}</text>
                </view>

                <button class="withdraw-btn" :disabled="!canWithdraw || withdrawLoading"
                    :class="{ disabled: !canWithdraw || withdrawLoading }" @click="onWithdraw">{{ withdrawLoading ?
                        '处理中...' : '申请提现' }}</button>
            </view>
        </view>
    </view>
</template>

<script>
import { calculateWithdrawAmount, generateLimitTips } from '@/utils/withdrawUtils.js';

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
        },
        singleLimit: {
            type: [String, Number],
            default: 0
        },
        dailyLimit: {
            type: [String, Number],
            default: 0
        },
        dailyUsed: {
            type: [String, Number],
            default: 0
        }
    },
    computed: {
        // 是否有单笔限额
        hasSingleLimit() {
            return this.singleLimit && parseFloat(this.singleLimit) > 0;
        },
        // 是否有日限额
        hasDailyLimit() {
            return this.dailyLimit && parseFloat(this.dailyLimit) > 0;
        },
        // 提现计算结果
        withdrawResult() {
            return calculateWithdrawAmount(
                this.availableCommission,
                this.singleLimit,
                this.dailyLimit,
                this.dailyUsed
            );
        },
        // 是否是部分提现（受限额影响）
        isPartialWithdraw() {
            return this.withdrawResult.isPartial;
        },
        // 实际可提现金额（考虑限额）
        actualWithdrawAmount() {
            return this.withdrawResult.actualAmount.toFixed(2);
        },
        // 限额提示文字
        limitTips() {
            return generateLimitTips(this.withdrawResult);
        },
        // 是否显示限额提示
        hasLimitTips() {
            return this.limitTips !== '';
        },
        // 提现说明序号前缀
        limitNumberPrefix() {
            let prefix = 1;
            if (this.hasSingleLimit) prefix++;
            if (this.hasDailyLimit) prefix++;
            if (this.hasLimitTips) prefix++;
            return prefix;
        },
        // 剩余需要提现的次数
        remainingWithdrawCount() {
            return this.withdrawResult.remainingCount || 1;
        }
    },
    methods: {
        onWithdraw() {
            // 发送实际提现金额
            this.$emit('withdraw', {
                amount: this.actualWithdrawAmount,
                isPartial: this.isPartialWithdraw
            });
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

            .limit-warning {
                color: #FA436A;
                font-weight: bold;
                margin: 10upx 0;
            }

            .multi-withdraw-tip {
                color: #FA436A;
                margin-top: 10upx;
            }
        }

        .withdraw-amount-info {
            background-color: #f8f8f8;
            padding: 20upx;
            border-radius: 10upx;
            margin-bottom: 20upx;
            display: flex;
            justify-content: space-between;
            align-items: center;

            .withdraw-amount-label {
                font-size: 28upx;
                color: #666;
            }

            .withdraw-amount-value {
                font-size: 32upx;
                font-weight: bold;
                color: #FA436A;
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