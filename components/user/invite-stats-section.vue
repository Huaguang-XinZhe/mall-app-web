<template>
    <view class="stats-section">
        <view class="stats-grid">
            <view class="stats-item">
                <text class="stats-number">{{ invitedCount || 0 }}</text>
                <text class="stats-label">已邀请人数</text>
            </view>
            <view class="stats-item">
                <text class="stats-number">{{ formatCommissionRate }}</text>
                <text class="stats-label">分成比例</text>
            </view>
            <view class="stats-item">
                <text class="stats-number">¥{{ formatTotalAmount }}</text>
                <text class="stats-label">订单总金额</text>
            </view>
        </view>
    </view>
</template>

<script>
export default {
    props: {
        invitedCount: {
            type: Number,
            default: 0
        },
        commissionRate: {
            type: Number,
            default: 0.3
        },
        totalOrderAmount: {
            type: [String, Number],
            default: '0.00'
        }
    },
    computed: {
        formatCommissionRate() {
            // 处理可能的NaN或undefined情况
            if (!this.commissionRate || isNaN(this.commissionRate)) {
                return '30%'; // 默认值
            }
            return (this.commissionRate * 100).toFixed(0) + '%';
        },
        formatTotalAmount() {
            // 处理金额格式化
            if (!this.totalOrderAmount || this.totalOrderAmount === 'NaN' || isNaN(Number(this.totalOrderAmount))) {
                return '0.00';
            }

            // 尝试将金额转换为数字并格式化为两位小数
            try {
                const amount = parseFloat(this.totalOrderAmount);
                return amount.toFixed(2);
            } catch (e) {
                console.error('金额格式化错误:', e);
                return '0.00';
            }
        }
    }
}
</script>

<style lang="scss" scoped>
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
</style>