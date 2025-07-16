<template>
    <view class="invite-section">
        <text class="invite-title">请输入邀请码</text>
        <text class="invite-desc">需要邀请码才能注册使用</text>
        <view class="input-wrapper">
            <input class="invite-input" type="text" v-model="inviteCode" placeholder="请输入邀请码 (如:AAA)" maxlength="6"
                @input="validateCode" />
        </view>
        <button class="confirm-btn" :class="{ disabled: !isValidCode || submitting }"
            :disabled="!isValidCode || submitting" @click="handleRegister">
            {{ submitting ? '注册中...' : '确认注册' }}
        </button>
        <button class="back-btn" @click="$emit('back')">返回</button>
    </view>
</template>

<script>
import { phoneLogin } from '@/api/user.js';
import { mapMutations } from 'vuex';

export default {
    props: {
        encryptedData: {
            type: String,
            required: true
        },
        iv: {
            type: String,
            required: true
        },
        pendingInviteCode: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            inviteCode: '',
            isValidCode: false,
            submitting: false
        }
    },
    created() {
        // 如果有待处理的邀请码，自动填充
        if (this.pendingInviteCode) {
            this.inviteCode = this.pendingInviteCode;
            this.validateCode();
        }
    },
    methods: {
        ...mapMutations(['login', 'setInviteCode', 'setInviteFrom']),

        validateCode() {
            // 特殊处理系统邀请码 "AAA"
            if (this.inviteCode === 'AAA') {
                this.isValidCode = true;
                return;
            }

            // 验证普通邀请码：6位，由大小写字母和数字组成
            const regex = /^[a-zA-Z0-9]{6}$/;
            this.isValidCode = regex.test(this.inviteCode);
        },

        async handleRegister() {
            if (!this.isValidCode || this.submitting) {
                return;
            }

            if (!this.inviteCode || !this.inviteCode.trim()) {
                uni.showToast({
                    title: '请输入邀请码',
                    icon: 'none'
                });
                return;
            }

            this.submitting = true;

            try {
                // 重新获取微信登录 code，然后带着邀请码调用手机号登录接口
                uni.login({
                    provider: 'weixin',
                    success: async (loginRes) => {
                        if (loginRes.code) {
                            try {
                                const registerParams = {
                                    code: loginRes.code,
                                    encryptedData: this.encryptedData,
                                    iv: this.iv,
                                    inviteCode: this.inviteCode.trim()
                                };

                                console.log('邀请码注册参数:', registerParams);

                                // 直接使用uni.request发送请求
                                const { AUTH_API_BASE_URL } = require('@/utils/appConfig.js');
                                const response = await new Promise((resolve, reject) => {
                                    uni.request({
                                        url: `${AUTH_API_BASE_URL}/api/auth/phoneLogin`,
                                        data: registerParams,
                                        method: 'POST',
                                        header: {
                                            'content-type': 'application/json'
                                        },
                                        success: (res) => {
                                            console.log('注册请求成功:', res);
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
                                            console.error('注册请求失败:', err);
                                            reject(err);
                                        }
                                    });
                                });

                                if (response.success) {
                                    // 注册成功
                                    this.handleLoginSuccess(response.data);
                                    this.$emit('register-success');
                                    uni.showToast({
                                        title: '注册成功',
                                        icon: 'success'
                                    });
                                } else {
                                    uni.showToast({
                                        title: response.message || '注册失败',
                                        icon: 'none'
                                    });
                                }
                            } catch (error) {
                                console.error('注册失败:', error);
                                uni.showToast({
                                    title: error.message || '注册失败，请重试',
                                    icon: 'none'
                                });
                            }
                        } else {
                            uni.showToast({
                                title: '获取登录凭证失败',
                                icon: 'none'
                            });
                        }
                        this.submitting = false;
                    },
                    fail: (err) => {
                        console.error('重新获取登录凭证失败:', err);
                        uni.showToast({
                            title: '注册失败，请重试',
                            icon: 'none'
                        });
                        this.submitting = false;
                    }
                });
            } catch (error) {
                console.error('邀请码注册失败:', error);
                uni.showToast({
                    title: error.message || '注册失败，请重试',
                    icon: 'none'
                });
                this.submitting = false;
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

            // 清除待处理的邀请码
            uni.removeStorageSync('pendingInviteCode');
        }
    }
}
</script>

<style lang="scss" scoped>
.invite-section {
    text-align: center;
}

.invite-title {
    display: block;
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;
}

.invite-desc {
    display: block;
    font-size: 28rpx;
    color: #666;
    margin-bottom: 60rpx;
}

.input-wrapper {
    margin-bottom: 60rpx;
}

.invite-input {
    width: 100%;
    height: 88rpx;
    border: 2rpx solid #e5e5e5;
    border-radius: 44rpx;
    padding: 0 30rpx;
    font-size: 32rpx;
    text-align: center;
    letter-spacing: 8rpx;
}

.confirm-btn {
    width: 100%;
    height: 88rpx;
    background: #07c160;
    color: #fff;
    font-size: 32rpx;
    border-radius: 44rpx;
    border: none;
    margin-bottom: 30rpx;

    &.disabled {
        background: #ccc;
    }
}

.back-btn {
    width: 100%;
    height: 88rpx;
    background: #f7f7f7;
    color: #333;
    font-size: 32rpx;
    border-radius: 44rpx;
    border: none;
}
</style>