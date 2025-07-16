<template>
    <view class="withdraw-section">
        <view class="section-title">申请提现</view>
        <view class="withdraw-card">
            <view class="available-amount">
                <text class="label">预估可提现金额</text>
                <text class="amount">¥{{ displayAmount }}</text>
                <text class="estimate-hint">实际可提现金额以微信支付API验证结果为准</text>
            </view>

            <view class="withdraw-form">
                <view class="withdraw-tips">
                    <text>提现说明：</text>
                    <text class="important-tip">预估金额仅供参考，实际可提现金额需通过微信官方API验证订单交易状态</text>
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

                <button class="withdraw-btn" :disabled="!actualCanWithdraw || withdrawLoading || verifying"
                    :class="{ disabled: !actualCanWithdraw || withdrawLoading || verifying }" @click="onWithdraw">{{
                        withdrawLoading || verifying ?
                            '处理中...' : '申请提现' }}</button>
            </view>
        </view>
    </view>
</template>

<script>
import { calculateWithdrawAmount, generateLimitTips } from '@/utils/withdrawUtils.js';
import { verifyWithdrawAmount } from '@/api/user.js';

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
    data() {
        return {
            verifying: false,
            verifiedAmount: null
        };
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
            // 如果有验证过的金额，使用验证金额
            const amount = this.verifiedAmount !== null ?
                this.verifiedAmount.toString() : this.availableCommission;

            return calculateWithdrawAmount(
                amount,
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
        },
        // 显示的金额文本
        displayAmount() {
            if (this.verifiedAmount !== null) {
                return this.verifiedAmount.toFixed(2);
            }
            return this.availableCommission || '0.00';
        },
        // 是否显示验证结果
        showVerificationResult() {
            return this.verifiedAmount !== null &&
                parseFloat(this.verifiedAmount) !== parseFloat(this.availableCommission);
        },
        // 计算实际是否可以提现（考虑验证后的金额）
        actualCanWithdraw() {
            // 如果已经验证过金额，检查验证后的金额是否满足最低限额要求
            if (this.verifiedAmount !== null) {
                return this.canWithdraw && this.verifiedAmount >= 0.1;
            }
            // 否则使用props传入的canWithdraw
            return this.canWithdraw;
        }
    },
    methods: {
        async onWithdraw() {
            if (!this.actualCanWithdraw || this.withdrawLoading || this.verifying) return;

            // 如果还没有验证过金额，先进行验证
            if (this.verifiedAmount === null) {
                await this.verifyAmount();
                return;
            }

            // 发送实际提现金额
            this.$emit('withdraw', {
                amount: this.actualWithdrawAmount,
                isPartial: this.isPartialWithdraw
            });
        },

        async verifyAmount() {
            try {
                this.verifying = true;

                uni.showLoading({
                    title: '验证金额中...'
                });

                // 调用验证API
                const response = await verifyWithdrawAmount();

                uni.hideLoading();

                if (response.success) {
                    // 更新验证后的金额
                    this.verifiedAmount = response.data.verifiedAmount;

                    // 检查是否可以提现（后端返回的标志）
                    const canWithdraw = response.data.canWithdraw !== undefined ?
                        response.data.canWithdraw : this.verifiedAmount >= 0.1;

                    // 如果不可提现（低于最低限额），显示提示
                    if (!canWithdraw && this.verifiedAmount < 0.1) {
                        uni.showModal({
                            title: '无法提现',
                            content: `实际可提现金额为¥${this.verifiedAmount.toFixed(2)}，低于微信支付最低限额0.1元，暂不可提现`,
                            showCancel: false,
                            confirmText: '我知道了'
                        });
                        // 重置验证状态但保留验证金额，以便显示
                        this.verifying = false;
                        return;
                    }

                    // 如果验证金额与预估金额不同，显示提示
                    if (this.showVerificationResult) {
                        uni.showModal({
                            title: '金额已调整',
                            content: `根据微信订单验证，实际可提现金额为¥${this.verifiedAmount.toFixed(2)}`,
                            showCancel: true,
                            confirmText: '继续提现',
                            cancelText: '取消',
                            success: (res) => {
                                if (res.confirm && canWithdraw) {
                                    // 用户确认后，继续提现流程
                                    this.$emit('withdraw', {
                                        amount: this.actualWithdrawAmount,
                                        isPartial: this.isPartialWithdraw
                                    });
                                } else {
                                    // 用户取消，重置验证状态
                                    this.verifiedAmount = null;
                                }
                            }
                        });
                    } else if (canWithdraw) {
                        // 验证金额与预估金额相同，直接继续提现流程
                        this.$emit('withdraw', {
                            amount: this.actualWithdrawAmount,
                            isPartial: this.isPartialWithdraw
                        });
                    }
                } else {
                    // 验证失败，显示错误信息
                    uni.showToast({
                        title: response.message || '验证金额失败',
                        icon: 'none'
                    });

                    // 使用预估金额继续
                    this.$emit('withdraw', {
                        amount: this.actualWithdrawAmount,
                        isPartial: this.isPartialWithdraw
                    });
                }
            } catch (error) {
                uni.hideLoading();
                console.error('验证金额失败:', error);

                uni.showToast({
                    title: '验证金额失败，将使用预估金额',
                    icon: 'none'
                });

                // 使用预估金额继续
                this.$emit('withdraw', {
                    amount: this.actualWithdrawAmount,
                    isPartial: this.isPartialWithdraw
                });
            } finally {
                this.verifying = false;
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

        .estimate-hint {
            font-size: 24upx;
            color: #999;
            margin-top: 10upx;
            display: block;
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

            .important-tip {
                color: #FA436A;
                font-weight: bold;
                margin: 10upx 0;
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