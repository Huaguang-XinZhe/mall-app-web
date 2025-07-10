<template>
	<view class="app">
		<view class="price-box">
			<text>支付金额</text>
			<text class="price">{{orderInfo.payAmount}}</text>
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
		wxMiniPayExternal
	} from '@/api/order.js';
	
	export default {
		data() {
			return {
				orderId: null,
				orderInfo: {},
				payLoading: false
			};
		},
		onLoad(options) {
			this.orderId = options.orderId;
			fetchOrderDetail(this.orderId).then(response => {
				this.orderInfo = response.data;
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

					// 调用新的外部订单支付接口
					const response = await wxMiniPayExternal({
						orderId: this.orderId,
						amount: parseFloat(this.orderInfo.payAmount),
						description: `订单支付-${this.orderInfo.orderSn}`,
						total_fee: parseFloat(this.orderInfo.payAmount)
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
							success: (res) => {
								console.log('微信支付成功:', res);
								uni.showToast({
									title: '支付成功',
									icon: 'success'
								});
								// 跳转到支付成功页面
								uni.redirectTo({
									url: '/pages/money/paySuccess'
								});
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
