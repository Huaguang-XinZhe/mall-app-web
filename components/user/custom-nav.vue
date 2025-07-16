<template>
    <view class="custom-nav">
        <view class="nav-back" @click="goBack">
            <text class="back-icon">〈</text>
        </view>
        <text class="nav-title">{{ title }}</text>
    </view>
</template>

<script>
export default {
    props: {
        title: {
            type: String,
            default: ''
        }
    },
    methods: {
        goBack() {
            this.$emit('back');
        }
    }
}
</script>

<style lang="scss" scoped>
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
</style>