<template>
	<view class="app">
		<!-- 调试模式提示 -->
		<view class="debug-banner" v-if="debugMode">
			<text class="debug-text">🔧 调试模式：支付金额已调整为 ¥{{ debugAmount }} 元</text>
		</view>

		<view class="price-box">
			<text>支付金额</text>
			<text class="price">{{ finalPayAmount }}</text>
			<text class="original-price" v-if="debugMode && originalAmount !== finalPayAmount">
				原价：¥{{ originalAmount }}
			</text>
		</view>

		<view class="payment-info">
			<view class="payment-method">
				<text class="icon yticon icon-weixinzhifu"></text>
				<view class="method-info">
					<text class="method-title">微信支付</text>
					<text class="method-desc">安全快捷的支付方式</text>
				</view>
			</view>
		</view>

		<text class="mix-btn" @click="confirm" :class="{ 'loading': payLoading }">
			{{ payLoading ? '支付中...' : '确认支付' }}
		</text>
	</view>
</template>

<script>
	import {
		fetchOrderDetail,
		wxMiniPayExternal,
		payOrderSuccess,
		updateExternalOrderStatus
	} from '@/api/order.js';
	import { DEBUG_MODE, DEBUG_AMOUNT } from '@/utils/appConfig.js';
	
	export default {
		data() {
			return {
				orderId: null,
				orderInfo: {},
				payLoading: false,
				debugMode: DEBUG_MODE,
				debugAmount: DEBUG_AMOUNT
			};
		},
		computed: {
			// 原始金额
			originalAmount() {
				return this.orderInfo.payAmount || 0;
			},
			// 最终支付金额（调试模式下使用测试金额）
			finalPayAmount() {
				if (this.debugMode) {
					return this.debugAmount;
				}
				return this.originalAmount;
			}
		},
		onLoad(options) {
			this.orderId = options.orderId;
			fetchOrderDetail(this.orderId).then(response => {
				this.orderInfo = response.data;
				
				// 调试模式提示
				if (this.debugMode) {
					console.log('🔧 调试模式已开启');
					console.log('原始支付金额:', this.originalAmount);
					console.log('调试支付金额:', this.finalPayAmount);
					
					uni.showModal({
						title: '调试模式',
						content: `当前为调试模式，支付金额已调整为 ¥${this.debugAmount} 元\n原价：¥${this.originalAmount} 元`,
						showCancel: false,
						confirmText: '我知道了'
					});
				}
			});
		},
		methods: {
			// 确认微信支付 - 使用新的外部订单支付接口
			async confirm() {
				if (this.payLoading) return;
				
				try {
					this.payLoading = true;
					console.log('开始微信支付，订单ID:', this.orderId);
					console.log('订单信息:', this.orderInfo);
					console.log('调试模式:', this.debugMode);
					console.log('最终支付金额:', this.finalPayAmount);

					// 调用新的外部订单支付接口
					const response = await wxMiniPayExternal({
						orderId: this.orderId,
						amount: this.finalPayAmount,  // 使用最终金额（调试模式下为测试金额）
						description: `订单支付-${this.orderInfo.orderSn}${this.debugMode ? '(调试)' : ''}`,
						total_fee: this.finalPayAmount
					});

					console.log('支付接口响应:', response);

					if (response.success) {
						const paymentParams = response.data;
						console.log('获取支付参数成功:', paymentParams);

						// 调起微信支付
						// #ifdef MP-WEIXIN
						uni.requestPayment({
							provider: 'wxpay',
							timeStamp: paymentParams.timeStamp,
							nonceStr: paymentParams.nonceStr,
							package: paymentParams.package,
							signType: paymentParams.signType,
							paySign: paymentParams.paySign,
							success: async (res) => {
								console.log('微信支付成功:', res);
								
								try {
									// 双重保障：同时更新老后端和新后端的订单状态
									console.log('开始更新订单状态...');
									
									// 1. 更新老后端订单状态
									const oldBackendUpdate = payOrderSuccess({
										orderId: this.orderId,
										payType: 2  // 2 表示微信支付
									});
									
									// 2. 更新新后端的外部订单状态
									const newBackendUpdate = updateExternalOrderStatus({
										orderId: this.orderId,
										payType: 2
									});
									
									// 等待两个更新操作完成
									const [oldResult, newResult] = await Promise.allSettled([
										oldBackendUpdate, 
										newBackendUpdate
									]);
									
									console.log('老后端订单状态更新结果:', oldResult);
									console.log('新后端订单状态更新结果:', newResult);
									
									let successCount = 0;
									if (oldResult.status === 'fulfilled' && oldResult.value.code === 200) {
										console.log('✅ 老后端订单状态更新成功');
										successCount++;
									} else {
										console.warn('⚠️ 老后端订单状态更新失败:', oldResult.reason || oldResult.value?.message);
									}
									
									if (newResult.status === 'fulfilled' && newResult.value.success) {
										console.log('✅ 新后端订单状态更新成功');
										successCount++;
									} else {
										console.warn('⚠️ 新后端订单状态更新失败:', newResult.reason || newResult.value?.message);
									}
									
									if (successCount > 0) {
										console.log(`📊 订单状态更新完成，成功 ${successCount}/2 个后端`);
									}
									
								} catch (updateError) {
									console.error('❌ 更新订单状态时出错:', updateError);
									// 即使更新失败也不影响支付成功的提示
								}
								
								// 调试模式成功提示
								if (this.debugMode) {
									uni.showToast({
										title: `调试支付成功 ¥${this.finalPayAmount}`,
										icon: 'success',
										duration: 2000
									});
								} else {
									uni.showToast({
										title: '支付成功',
										icon: 'success'
									});
								}
								
								// 跳转到支付成功页面
								setTimeout(() => {
									uni.redirectTo({
										url: '/pages/money/paySuccess'
									});
								}, this.debugMode ? 2000 : 1500);
							},
							fail: (err) => {
								console.error('微信支付失败:', err);
								uni.showToast({
									title: `支付失败: ${err.errMsg}`,
									icon: 'none'
								});
							}
						});
						// #endif

						// #ifndef MP-WEIXIN
						uni.showModal({
							title: '提示',
							content: '请在微信小程序环境下进行支付',
							showCancel: false
						});
						// #endif

					} else {
						throw new Error(response.message || '获取支付参数失败');
					}
				} catch (error) {
					console.error('支付失败:', error);
					uni.showToast({
						title: error.message || '支付失败',
						icon: 'none'
					});
				} finally {
					this.payLoading = false;
				}
			}
		}
	}
</script>

<style lang='scss'>
	.app {
		width: 100%;
		background-color: #f5f5f5;
		min-height: 100vh;
	}

	.debug-banner {
		background-color: #ffece6;
		padding: 10upx 20upx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 20upx;

		.debug-text {
			font-size: 24upx;
			color: #e6a23c;
			font-weight: bold;
		}
	}

	.price-box {
		background-color: #fff;
		height: 265upx;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		font-size: 28upx;
		color: #909399;

		.price {
			font-size: 50upx;
			color: #303133;
			margin-top: 12upx;

			&:before {
				content: '￥';
				font-size: 40upx;
			}
		}

		.original-price {
			font-size: 24upx;
			color: #909399;
			margin-top: 10upx;
		}
	}

	.payment-info {
		margin-top: 20upx;
		background-color: #fff;
		padding: 30upx 60upx;
		
		.payment-method {
			display: flex;
			align-items: center;
			
			.icon {
				width: 100upx;
				font-size: 52upx;
				color: #36cb59;
				margin-right: 30upx;
			}
			
			.method-info {
				flex: 1;
				
				.method-title {
					display: block;
					font-size: 32upx;
					color: #303133;
					font-weight: bold;
					margin-bottom: 8upx;
				}
				
				.method-desc {
					font-size: 26upx;
					color: #909399;
				}
			}
		}
	}

	.mix-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 630upx;
		height: 80upx;
		margin: 80upx auto 30upx;
		font-size: $font-lg;
		color: #fff;
		background-color: $base-color;
		border-radius: 10upx;
		box-shadow: 1px 2px 5px rgba(219, 63, 96, 0.4);
		transition: all 0.3s ease;
		
		&.loading {
			background-color: #ccc;
			box-shadow: none;
		}
	}
</style>
