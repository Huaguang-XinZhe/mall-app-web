<template>
    <view class="unsupported-platform">
        <image class="hint-icon" src="https://boyangchuanggu-mall.oss-cn-guangzhou.aliyuncs.com/static/missing-face.png"
            mode="aspectFit" />
        <view class="hint-text">
            <text>邀请功能仅支持微信小程序</text>
            <text>请在微信中使用此功能</text>
        </view>
    </view>
</template>

<script>
export default {
    name: 'UnsupportedPlatform'
}
</script>

<style lang="scss" scoped>
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