<template>
	<view v-if="show" class="login-sheet-wrapper" @click="hideSheet">
		<view class="login-sheet" @click.stop>
			<view class="sheet-header">
				<text class="title">欢迎使用商城</text>
				<text class="close-btn" @click="hideSheet">×</text>
			</view>
			
			<view class="sheet-content">
				<view v-if="!showInviteInput" class="login-section">
					<text class="login-title">请先登录</text>
					<text class="login-desc">使用微信手机号一键登录，快速体验商城功能</text>
					<!-- #ifdef MP-WEIXIN -->
					<button class="phone-login-btn" open-type="getPhoneNumber" @getphonenumber="handlePhoneLogin">
						<text class="yticon icon-shouji"></text>
						手机号一键登录
					</button>
					<!-- #endif -->
					<!-- #ifndef MP-WEIXIN -->
					<button class="phone-login-btn" @click="handleMockLogin">
						<text class="yticon icon-shouji"></text>
						模拟登录（开发环境）
					</button>
					<!-- #endif -->
				</view>
				
				<view v-else class="invite-section">
					<text class="invite-title">请输入邀请码</text>
					<text class="invite-desc">需要邀请码才能注册使用</text>
					<view class="input-wrapper">
						<input 
							class="invite-input" 
							type="text" 
							v-model="inviteCode" 
							placeholder="请输入邀请码 (如:AAA)"
							maxlength="6"
							@input="validateCode"
						/>
					</view>
					<button 
						class="confirm-btn" 
						:class="{ disabled: !isValidCode || submitting }"
						:disabled="!isValidCode || submitting"
						@click="handleRegister"
					>
						{{ submitting ? '注册中...' : '确认注册' }}
					</button>
					<button class="back-btn" @click="backToLogin">返回</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { mapMutations } from 'vuex';
	import { phoneLogin, validateInviteCode } from '@/api/user.js';
	
	export default {
		props: {
			show: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				showInviteInput: false,
				inviteCode: '',
				isValidCode: false,
				submitting: false,
				userOpenid: '',
				encryptedData: '',
				iv: ''
			}
		},
		watch: {
			show(newVal) {
				if (newVal) {
					// 检查 URL 中是否有邀请码参数
					this.checkInviteCodeFromUrl();
				} else {
					this.resetData();
				}
			}
		},
		methods: {
			...mapMutations(['login', 'setInviteCode', 'setInviteFrom']),
			
			hideSheet() {
				this.$emit('hide');
			},
			
			resetData() {
				this.showInviteInput = false;
				this.inviteCode = '';
				this.isValidCode = false;
				this.submitting = false;
				this.userOpenid = '';
				this.encryptedData = '';
				this.iv = '';
			},
			
			checkInviteCodeFromUrl() {
				// 从页面参数中获取邀请码
				const pages = getCurrentPages();
				const currentPage = pages[pages.length - 1];
				if (currentPage && currentPage.options && currentPage.options.inviteCode) {
					this.inviteCode = currentPage.options.inviteCode;
					this.validateCode();
				}
			},
			
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
			

			
			async handlePhoneLogin(e) {
				try {
					// #ifdef MP-WEIXIN
					console.log('手机号授权详细结果:', JSON.stringify(e.detail));
					
					if (e.detail.errMsg === 'getPhoneNumber:ok') {
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
								}
							},
							fail: (err) => {
								console.error('微信登录失败详情:', JSON.stringify(err));
								uni.showToast({
									title: '登录失败，请重试',
									icon: 'none'
								});
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
				}
			},
			
			async handleMockLogin() {
				// #ifndef MP-WEIXIN
				// 非小程序环境，模拟登录
				try {
					const mockCode = 'mock_code_' + Date.now();
					const loginParams = {
						code: mockCode,
						encryptedData: 'mock_encrypted_data',
						iv: 'mock_iv',
						isMock: true
					};
					
					// 只有当 inviteCode 有值且有效时才添加到参数中
					if (this.inviteCode && this.inviteCode.trim()) {
						loginParams.inviteCode = this.inviteCode.trim();
					}
					
					console.log('模拟登录参数:', loginParams);
					const response = await phoneLogin(loginParams);
					
					if (response.success) {
							// 已注册用户，直接登录
							this.handleLoginSuccess(response.data);
					} else {
						uni.showToast({
							title: response.message || '登录失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('模拟登录失败:', error);
					
					// 检查是否是需要邀请码的错误响应
					if (error.data && error.data.needInviteCode) {
						console.log('检测到新用户需要邀请码（模拟环境）');
						this.showInviteInput = true;
						uni.showToast({
							title: '新用户需要邀请码注册',
							icon: 'none'
						});
						return;
					}
					
					uni.showToast({
						title: error.message || '登录失败，请重试',
						icon: 'none'
					});
				}
				// #endif
			},
			
			async callPhoneLoginAPI(code) {
				try {
					// 构建登录参数
					const loginParams = {
						code: code,
						encryptedData: this.encryptedData,
						iv: this.iv
					};
					
					// 只有当 inviteCode 有值且有效时才添加到参数中
					if (this.inviteCode && this.inviteCode.trim()) {
						loginParams.inviteCode = this.inviteCode.trim();
					}
					
					console.log('手机号登录详细参数:');
					console.log('  - code:', loginParams.code);
					console.log('  - encryptedData长度:', loginParams.encryptedData.length);
					console.log('  - iv:', loginParams.iv);
					console.log('  - inviteCode:', loginParams.inviteCode || '无');
					
					console.log('开始调用后端登录接口...');
					
					// 调用后端手机号登录接口
					const response = await phoneLogin(loginParams);
					
					console.log('登录接口响应:', JSON.stringify(response));
					
					if (response.success) {
						// 登录成功
						console.log('登录成功, 用户信息:', JSON.stringify(response.data.userInfo));
							// 已注册用户，直接登录
							this.handleLoginSuccess(response.data);
					} else {
						console.error('登录失败:', response.message, '错误代码:', response.code);
						uni.showToast({
							title: response.message || '登录失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('手机号登录接口调用失败:', error);
					console.error('错误对象详情:', JSON.stringify(error));
					
					// 检查是否是需要邀请码的错误响应
					if (error.data && error.data.needInviteCode) {
						console.log('检测到新用户需要邀请码，显示邀请码输入框');
						// 保存注册所需的信息
						this.encryptedData = this.encryptedData;
						this.iv = this.iv;
						this.showInviteInput = true;
						uni.showToast({
							title: '新用户需要邀请码注册',
							icon: 'none'
						});
						return;
					}
					
					// 显示错误信息
					uni.showToast({
						title: error.message || '登录失败，请重试',
						icon: 'none'
					});
				}
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
								
								const response = await phoneLogin(registerParams);
								
								if (response.success) {
									// 注册成功
									this.handleLoginSuccess(response.data);
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
				
				uni.showToast({
					title: '登录成功',
					icon: 'success'
				});
				
				this.hideSheet();
			},
			
			
			
			backToLogin() {
				this.showInviteInput = false;
				this.inviteCode = '';
				this.isValidCode = false;
			}
		}
	}
</script>

<style lang="scss" scoped>
	.login-sheet-wrapper {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 9999;
		display: flex;
		align-items: flex-end;
	}
	
	.login-sheet {
		width: 100%;
		background: #fff;
		border-radius: 20rpx 20rpx 0 0;
		padding: 60rpx 60rpx 100rpx;
		animation: slideUp 0.3s ease-out;
	}
	
	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}
	
	.sheet-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 60rpx;
		
		.title {
			font-size: 36rpx;
			font-weight: bold;
			color: #333;
		}
		
		.close-btn {
			font-size: 60rpx;
			color: #999;
			line-height: 1;
		}
	}
	
	.login-section, .invite-section {
		text-align: center;
	}
	
	.login-title, .invite-title {
		display: block;
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 20rpx;
	}
	
	.login-desc, .invite-desc {
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
		
		.yticon {
			margin-right: 20rpx;
			font-size: 36rpx;
		}
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