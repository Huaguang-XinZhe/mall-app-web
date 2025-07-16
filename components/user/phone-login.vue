<template>
    <view class="login-section">
        <text class="login-title">请先登录</text>
        <text class="login-desc">使用微信手机号一键登录，快速体验商城功能</text>
        <!-- #ifdef MP-WEIXIN -->
        <button class="phone-login-btn" open-type="getPhoneNumber" @getphonenumber="handlePhoneLogin"
            :disabled="isLoading">
            <text class="yticon icon-shouji" v-if="!isLoading"></text>
            <text class="loading-icon" v-else></text>
            {{ isLoading ? '登录中...' : '手机号一键登录' }}
        </button>
        <!-- #endif -->

        <view v-if="pendingInviteCode" class="invite-info">
            <text class="invite-tip">检测到邀请码：{{ pendingInviteCode }}</text>
        </view>
    </view>
</template>

<script>
import { mapMutations } from 'vuex';
import { phoneLogin } from '@/api/user.js';

export default {
    props: {
        pendingInviteCode: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            isLoading: false,
            encryptedData: '',
            iv: ''
        }
    },
    methods: {
        ...mapMutations(['login', 'setInviteCode', 'setInviteFrom']),

        async handlePhoneLogin(e) {
            try {
                // #ifdef MP-WEIXIN
                console.log('手机号授权详细结果:', JSON.stringify(e.detail));

                if (e.detail.errMsg === 'getPhoneNumber:ok') {
                    // 设置加载状态
                    this.isLoading = true;
                    // 获取手机号成功
                    this.encryptedData = e.detail.encryptedData;
                    this.iv = e.detail.iv;

                    console.log('encryptedData详情:');
                    console.log('  - 长度:', this.encryptedData.length);
                    console.log('  - 前20个字符:', this.encryptedData.substring(0, 20));
                    console.log('  - 后20个字符:', this.encryptedData.substring(this.encryptedData.length - 20));

                    console.log('iv详情:');
                    console.log('  - 长度:', this.iv.length);
                    console.log('  - 完整内容:', this.iv);

                    // 先获取微信登录 code
                    uni.login({
                        provider: 'weixin',
                        success: (loginRes) => {
                            console.log('微信登录结果:', JSON.stringify(loginRes));
                            if (loginRes.code) {
                                console.log('获取code成功:', loginRes.code);
                                this.callPhoneLoginAPI(loginRes.code);
                            } else {
                                console.error('登录凭证获取失败:', loginRes.errMsg);
                                uni.showToast({
                                    title: '获取登录凭证失败',
                                    icon: 'none'
                                });
                                this.isLoading = false; // 重置加载状态
                            }
                        },
                        fail: (err) => {
                            console.error('微信登录失败详情:', JSON.stringify(err));
                            uni.showToast({
                                title: '登录失败，请重试',
                                icon: 'none'
                            });
                            this.isLoading = false; // 重置加载状态
                        }
                    });
                } else {
                    // 用户取消授权
                    console.log('用户取消手机号授权, errMsg:', e.detail.errMsg);
                    uni.showToast({
                        title: '需要手机号授权才能登录',
                        icon: 'none'
                    });
                }
                // #endif
            } catch (error) {
                console.error('手机号登录处理错误:', error);
                console.error('错误信息:', error.message);
                console.error('错误堆栈:', error.stack);
                uni.showToast({
                    title: '登录失败，请重试',
                    icon: 'none'
                });
                this.isLoading = false; // 重置加载状态
            }
        },

        async callPhoneLoginAPI(code) {
            try {
                // 构建登录参数
                const loginParams = {
                    code: code,
                    encryptedData: this.encryptedData,
                    iv: this.iv
                };

                // 如果有待处理的邀请码，添加到参数中
                if (this.pendingInviteCode) {
                    loginParams.inviteCode = this.pendingInviteCode;
                    console.log('使用待处理的邀请码:', this.pendingInviteCode);
                }

                console.log('手机号登录详细参数:');
                console.log('  - code:', loginParams.code);
                console.log('  - encryptedData长度:', loginParams.encryptedData.length);
                console.log('  - iv:', loginParams.iv);
                console.log('  - inviteCode:', loginParams.inviteCode || '无');

                // 添加更详细的日志
                console.log('请求参数JSON字符串:', JSON.stringify(loginParams));

                console.log('开始调用phoneLogin API');

                // 直接使用uni.request发送请求
                const response = await new Promise((resolve, reject) => {
                    const { AUTH_API_BASE_URL } = require('@/utils/appConfig.js');
                    uni.request({
                        url: `${AUTH_API_BASE_URL}/api/auth/phoneLogin`,
                        data: loginParams,
                        method: 'POST',
                        header: {
                            'content-type': 'application/json'
                        },
                        success: (res) => {
                            console.log('登录请求成功:', res);
                            if (res.statusCode >= 200 && res.statusCode < 300) {
                                resolve(res.data);
                            } else {
                                reject({
                                    statusCode: res.statusCode,
                                    data: res.data,
                                    errMsg: '请求失败'
                                });
                            }
                        },
                        fail: (err) => {
                            console.error('登录请求失败:', err);
                            reject(err);
                        }
                    });
                });

                console.log('登录接口响应:', JSON.stringify(response));

                if (response.success) {
                    // 登录成功
                    console.log('登录成功, 用户信息:', JSON.stringify(response.data.userInfo));
                    this.handleLoginSuccess(response.data);
                    this.$emit('login-success');
                } else {
                    console.error('登录失败:', response.message, '错误代码:', response.code);

                    // 检查是否为需要邀请码的错误
                    if (response.code === 400 && response.message && response.message.indexOf('邀请码') !== -1) {
                        console.log('从响应中检测到需要邀请码');
                        this.$emit('need-invite-code');
                    } else {
                        uni.showToast({
                            title: response.message || '登录失败',
                            icon: 'none'
                        });
                    }
                }
            } catch (error) {
                console.error('手机号登录接口调用失败:', error);

                // 简化的错误信息诊断
                console.log('错误类型:', typeof error);
                console.log('错误名称:', error.name);
                console.log('错误消息:', error.message);
                console.log('错误状态码:', error.statusCode);

                // 记录错误对象数据
                if (error.data) {
                    console.log('错误响应数据:', error.data);
                }

                // 检查是否为需要邀请码的错误
                if ((error.statusCode === 400 || (error.data && error.data.code === 400)) &&
                    ((error.data && error.data.message && error.data.message.indexOf('邀请码') !== -1) ||
                        (error.message && error.message.indexOf('邀请码') !== -1))) {
                    console.log('接收到邀请码错误');
                    this.$emit('need-invite-code');
                    return;
                }

                // 其他情况，显示一般错误
                uni.showToast({
                    title: (error.data && error.data.message) || error.message || '登录失败，请重试',
                    icon: 'none'
                });
            } finally {
                // 无论成功失败，都重置加载状态
                this.isLoading = false;
            }
        },

        handleLoginSuccess(data) {
            // 保存 token
            if (data.token) {
                // 确保 token 不包含 Bearer 前缀
                const tokenToStore = data.token.startsWith('Bearer ')
                    ? data.token.replace('Bearer ', '')
                    : data.token;

                console.log(`登录成功 - 存储 token，长度: ${tokenToStore.length}`);
                uni.setStorageSync('token', tokenToStore);
            }

            // 保存用户信息到 store
            this.login(data.userInfo);

            // 保存邀请码信息
            if (data.inviteCode) {
                this.setInviteCode(data.inviteCode);
            }
            if (data.inviteFrom) {
                this.setInviteFrom(data.inviteFrom);
            }

            uni.showToast({
                title: '登录成功',
                icon: 'success'
            });
        }
    }
}
</script>

<style lang="scss" scoped>
.login-section {
    text-align: center;
}

.login-title {
    display: block;
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;
}

.login-desc {
    display: block;
    font-size: 28rpx;
    color: #666;
    margin-bottom: 60rpx;
}

.phone-login-btn {
    width: 100%;
    height: 88rpx;
    background: #07c160;
    color: #fff;
    font-size: 32rpx;
    border-radius: 44rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;

    &[disabled] {
        background: #8fd2a8;
        opacity: 0.8;
    }

    .yticon {
        margin-right: 20rpx;
        font-size: 36rpx;
    }

    .loading-icon {
        width: 36rpx;
        height: 36rpx;
        margin-right: 20rpx;
        border: 3rpx solid #fff;
        border-radius: 50%;
        border-top-color: transparent;
        animation: loading 0.8s linear infinite;
    }
}

@keyframes loading {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.invite-info {
    margin-top: 30rpx;
    padding: 20rpx;
    background-color: #f8f8f8;
    border-radius: 10rpx;

    .invite-tip {
        font-size: 28rpx;
        color: #07c160;
    }
}
</style>