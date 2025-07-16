<template>
    <view class="withdraw-records" v-if="records.length > 0">
        <view class="section-title">提现记录</view>
        <view class="record-item" v-for="record in records" :key="record.id">
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
</template>

<script>
export default {
    props: {
        records: {
            type: Array,
            default: () => []
        }
    },
    methods: {
        formatDate(dateStr) {
            if (!dateStr) return '';

            // 将日期字符串转换为iOS兼容格式
            let compatibleDateStr = dateStr;

            // 检查是否包含空格分隔的日期和时间
            if (dateStr.includes(' ')) {
                // 将空格替换为'T'以符合ISO标准
                compatibleDateStr = dateStr.replace(' ', 'T');
            }

            try {
                const date = new Date(compatibleDateStr);

                // 检查日期是否有效
                if (isNaN(date.getTime())) {
                    console.warn('无效的日期格式:', dateStr);
                    return dateStr; // 返回原始字符串
                }

                // 使用标准方法格式化日期
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');

                // 返回格式化后的日期字符串
                return `${year}-${month}-${day} ${hours}:${minutes}`;
            } catch (error) {
                console.error('日期格式化错误:', error);
                return dateStr; // 出错时返回原始字符串
            }
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
.section-title {
    display: block;
    font-size: 32upx;
    color: #333;
    margin: 40upx 0 20upx 0;
    font-weight: bold;
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
</style>