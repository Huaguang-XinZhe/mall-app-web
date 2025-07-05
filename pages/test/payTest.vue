<template>
	<view class="pay-test-container">
		<view class="header">
			<text class="title">支付功能测试</text>
			<text class="subtitle">测试金额：¥0.10</text>
		</view>

		<!-- 微信支付测试 -->
		<view class="test-section">
			<view class="section-title">
				<text class="icon">💳</text>
				<text>微信支付测试</text>
			</view>
			<view class="section-content">
				<view class="info-item">
					<text class="label">测试订单:</text>
					<text class="value">{{ testOrder.orderSn || '未创建' }}</text>
				</view>
				<view class="info-item">
					<text class="label">支付金额:</text>
					<text class="value price">¥0.10</text>
				</view>
				<view class="info-item">
					<text class="label">支付状态:</text>
					<text class="value" :class="payStatusClass">{{ payStatusText }}</text>
				</view>
				<view class="btn-group">
					<button class="test-btn primary" @click="createTestOrder" :loading="orderLoading">
						{{ orderLoading ? '创建中...' : '创建测试订单' }}
					</button>
					<button class="test-btn success" @click="testWxPay" :disabled="!testOrder.id" :loading="payLoading">
						{{ payLoading ? '支付中...' : '微信支付测试' }}
					</button>
				</view>
			</view>
		</view>

		<!-- 商家转账测试 -->
		<view class="test-section">
			<view class="section-title">
				<text class="icon">💰</text>
				<text>商家转账测试</text>
			</view>
			<view class="section-content">
				<view class="info-item">
					<text class="label">转账金额:</text>
					<text class="value price">¥0.10</text>
				</view>
				<view class="info-item">
					<text class="label">转账状态:</text>
					<text class="value" :class="transferStatusClass">{{ transferStatusText }}</text>
				</view>
				<view class="input-group">
					<text class="input-label">收款人备注:</text>
					<input class="input-field" v-model="transferRemark" placeholder="请输入转账备注（可选）" />
				</view>
				<view class="test-mode-switch">
					<text class="switch-label">使用测试模式:</text>
					<switch :checked="useTestMode" @change="toggleTestMode" color="#ff9500" />
					<text class="switch-hint">{{ useTestMode ? '模拟转账' : '真实转账' }}</text>
				</view>
				<view class="btn-group">
					<button class="test-btn warning" @click="testTransfer" :loading="transferLoading">
						{{ transferLoading ? '转账中...' : '商家转账测试' }}
					</button>
				</view>
			</view>
		</view>

		<!-- 测试日志 -->
		<view class="test-section">
			<view class="section-title">
				<text class="icon">📋</text>
				<text>测试日志</text>
				<text class="clear-btn" @click="clearLogs">清空</text>
			</view>
			<view class="logs-container">
				<view class="log-item" v-for="(log, index) in logs" :key="index" :class="log.type">
					<view class="log-time">{{ log.time }}</view>
					<view class="log-content">{{ log.message }}</view>
				</view>
				<view class="no-logs" v-if="logs.length === 0">
					<text>暂无测试日志</text>
				</view>
			</view>
		</view>

		<!-- 帮助说明 -->
		<view class="help-section">
			<view class="help-title">使用说明</view>
			<view class="help-content">
				<text>1. 微信支付测试：先创建测试订单，然后进行微信支付</text>
				<text>2. 商家转账测试：直接点击转账按钮进行测试</text>
				<text>3. 所有测试金额均为 ¥0.10，确保安全</text>
				<text>4. 请在微信小程序环境下测试支付功能</text>
			</view>
		</view>
	</view>
</template>

<script>
	import { createTestOrder, wxMiniPay, transferToUser } from '@/api/order.js'

	export default {
		data() {
			return {
				// 测试订单信息
				testOrder: {},
				orderLoading: false,
				
				// 微信支付状态
				payStatus: 0, // 0-未支付 1-支付中 2-支付成功 3-支付失败
				payLoading: false,
				
				// 商家转账状态
				transferStatus: 0, // 0-未转账 1-转账中 2-转账成功 3-转账失败
				transferLoading: false,
				transferRemark: '',
				
				// 测试日志
				logs: [],

				// 商家转账测试模式
				useTestMode: true
			}
		},
		computed: {
			payStatusText() {
				const statusMap = {
					0: '未支付',
					1: '支付中',
					2: '支付成功',
					3: '支付失败'
				}
				return statusMap[this.payStatus] || '未知'
			},
			payStatusClass() {
				const classMap = {
					0: 'status-default',
					1: 'status-loading',
					2: 'status-success',
					3: 'status-error'
				}
				return classMap[this.payStatus] || ''
			},
			transferStatusText() {
				const statusMap = {
					0: '未转账',
					1: '转账中',
					2: '转账成功',
					3: '转账失败'
				}
				return statusMap[this.transferStatus] || '未知'
			},
			transferStatusClass() {
				const classMap = {
					0: 'status-default',
					1: 'status-loading',
					2: 'status-success',
					3: 'status-error'
				}
				return classMap[this.transferStatus] || ''
			}
		},
		onLoad() {
			this.addLog('info', '页面加载完成，准备开始测试')
		},
		methods: {
			// 创建测试订单
			async createTestOrder() {
				try {
					this.orderLoading = true
					this.addLog('info', '开始创建测试订单...')
					
					const orderData = {
						amount: 0.1,
						description: '支付功能测试订单',
						testMode: true
					}
					
					const response = await createTestOrder(orderData)
					
					if (response.success) {
						this.testOrder = response.data
						this.addLog('success', `测试订单创建成功，订单号：${this.testOrder.orderSn}`)
						
						uni.showToast({
							title: '测试订单创建成功',
							icon: 'success'
						})
					} else {
						throw new Error(response.message || '创建订单失败')
					}
				} catch (error) {
					this.addLog('error', `创建测试订单失败：${error.message}`)
					uni.showToast({
						title: '创建订单失败',
						icon: 'none'
					})
					console.error('创建测试订单失败:', error)
				} finally {
					this.orderLoading = false
				}
			},

			// 微信支付测试
			async testWxPay() {
				try {
					this.payLoading = true
					this.payStatus = 1
					this.addLog('info', '开始微信支付测试...')

					// 调用后端接口获取支付参数
					const response = await wxMiniPay({
						orderId: this.testOrder.id,
						amount: 0.1,
						description: '微信支付测试',
						total_fee: 0.1  // 添加 total_fee 参数，确保与 amount 一致
					})

					if (response.success) {
						const paymentParams = response.data
						this.addLog('info', '获取支付参数成功，调起微信支付...')

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
								this.payStatus = 2
								this.addLog('success', '微信支付成功！')
								uni.showToast({
									title: '支付成功',
									icon: 'success'
								})
							},
							fail: (err) => {
								this.payStatus = 3
								this.addLog('error', `微信支付失败：${err.errMsg}`)
								uni.showToast({
									title: '支付失败',
									icon: 'none'
								})
							}
						})
						// #endif

						// #ifndef MP-WEIXIN
						this.addLog('warning', '请在微信小程序环境下测试支付功能')
						uni.showModal({
							title: '提示',
							content: '请在微信小程序环境下测试支付功能',
							showCancel: false
						})
						this.payStatus = 0
						// #endif

					} else {
						throw new Error(response.message || '获取支付参数失败')
					}
				} catch (error) {
					this.payStatus = 3
					this.addLog('error', `微信支付测试失败：${error.message}`)
					uni.showToast({
						title: '支付测试失败',
						icon: 'none'
					})
					console.error('微信支付测试失败:', error)
				} finally {
					this.payLoading = false
				}
			},

			// 商家转账测试
			async testTransfer() {
				try {
					this.transferLoading = true
					this.transferStatus = 1
					this.addLog('info', '开始商家转账测试...')

					// 调用真实的转账 API
					const transferData = {
						amount: 0.1,
						transfer_remark: this.transferRemark || '商家转账测试',
						testMode: this.useTestMode // 使用真实转账，不使用测试模式
					}

					const response = await transferToUser(transferData)

					if (response.success) {
						this.transferStatus = 2
						const transferInfo = response.data
						this.addLog('success', `商家转账成功！转账单号：${transferInfo.billNo || transferInfo.out_batch_no}`)
						
						uni.showToast({
							title: '转账成功',
							icon: 'success'
						})

						// 清空备注
						this.transferRemark = ''
					} else {
						throw new Error(response.message || '转账失败')
					}

				} catch (error) {
					this.transferStatus = 3
					this.addLog('error', `商家转账测试失败：${error.message}`)
					uni.showToast({
						title: '转账测试失败',
						icon: 'none'
					})
					console.error('商家转账测试失败:', error)
				} finally {
					this.transferLoading = false
				}
			},

			// 切换测试模式
			toggleTestMode(e) {
				this.useTestMode = e.detail.value
				this.addLog('info', `切换测试模式：${this.useTestMode ? '模拟转账' : '真实转账'}`)
			},

			// 添加日志
			addLog(type, message) {
				const log = {
					type,
					message,
					time: this.formatTime(new Date())
				}
				this.logs.unshift(log)
				
				// 保持最多 50 条日志
				if (this.logs.length > 50) {
					this.logs = this.logs.slice(0, 50)
				}
			},

			// 清空日志
			clearLogs() {
				this.logs = []
				this.addLog('info', '日志已清空')
			},

			// 格式化时间
			formatTime(date) {
				const pad = (num) => num.toString().padStart(2, '0')
				return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
			}
		}
	}
</script>

<style lang="scss" scoped>
	.pay-test-container {
		padding: 20upx;
		background-color: #f5f5f5;
		min-height: 100vh;
	}

	.header {
		text-align: center;
		margin-bottom: 40upx;
		
		.title {
			display: block;
			font-size: 36upx;
			font-weight: bold;
			color: #333;
			margin-bottom: 10upx;
		}
		
		.subtitle {
			font-size: 28upx;
			color: #666;
		}
	}

	.test-section {
		background-color: #fff;
		border-radius: 16upx;
		margin-bottom: 30upx;
		overflow: hidden;
		box-shadow: 0 4upx 12upx rgba(0, 0, 0, 0.1);
	}

	.section-title {
		display: flex;
		align-items: center;
		padding: 30upx 30upx 20upx;
		border-bottom: 1px solid #f0f0f0;
		position: relative;
		
		.icon {
			font-size: 32upx;
			margin-right: 15upx;
		}
		
		text {
			font-size: 32upx;
			font-weight: bold;
			color: #333;
		}
		
		.clear-btn {
			position: absolute;
			right: 30upx;
			font-size: 24upx;
			color: #007aff;
			font-weight: normal;
		}
	}

	.section-content {
		padding: 30upx;
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20upx;
		
		.label {
			font-size: 28upx;
			color: #666;
		}
		
		.value {
			font-size: 28upx;
			color: #333;
			
			&.price {
				color: #ff6b35;
				font-weight: bold;
			}
			
			&.status-default {
				color: #999;
			}
			
			&.status-loading {
				color: #007aff;
			}
			
			&.status-success {
				color: #34c759;
			}
			
			&.status-error {
				color: #ff3b30;
			}
		}
	}

	.input-group {
		margin-bottom: 30upx;
		
		.input-label {
			display: block;
			font-size: 28upx;
			color: #666;
			margin-bottom: 15upx;
		}
		
		.input-field {
			width: 100%;
			padding: 20upx;
			font-size: 28upx;
			border: 1px solid #e0e0e0;
			border-radius: 8upx;
			background-color: #fafafa;
			box-sizing: border-box;
		}
	}

	.test-mode-switch {
		display: flex;
		align-items: center;
		margin-bottom: 30upx;
		padding-left: 20upx;

		.switch-label {
			font-size: 28upx;
			color: #666;
			margin-right: 15upx;
		}

		.switch-hint {
			font-size: 24upx;
			color: #999;
			margin-left: 10upx;
		}
	}

	.btn-group {
		display: flex;
		gap: 20upx;
		flex-wrap: wrap;
	}

	.test-btn {
		flex: 1;
		min-width: 200upx;
		height: 80upx;
		font-size: 28upx;
		border-radius: 12upx;
		border: none;
		color: #fff;
		
		&.primary {
			background-color: #007aff;
		}
		
		&.success {
			background-color: #34c759;
		}
		
		&.warning {
			background-color: #ff9500;
		}
		
		&:disabled {
			background-color: #c0c0c0 !important;
		}
	}

	.logs-container {
		max-height: 400upx;
		overflow-y: auto;
	}

	.log-item {
		padding: 15upx 20upx;
		margin-bottom: 10upx;
		border-radius: 8upx;
		border-left: 4upx solid;
		
		&.info {
			background-color: #f0f9ff;
			border-left-color: #007aff;
			
			.log-content {
				color: #007aff;
			}
		}
		
		&.success {
			background-color: #f0fff4;
			border-left-color: #34c759;
			
			.log-content {
				color: #34c759;
			}
		}
		
		&.error {
			background-color: #fff5f5;
			border-left-color: #ff3b30;
			
			.log-content {
				color: #ff3b30;
			}
		}
		
		&.warning {
			background-color: #fffbf0;
			border-left-color: #ff9500;
			
			.log-content {
				color: #ff9500;
			}
		}
		
		.log-time {
			font-size: 22upx;
			color: #999;
			margin-bottom: 5upx;
		}
		
		.log-content {
			font-size: 26upx;
			line-height: 1.4;
		}
	}

	.no-logs {
		text-align: center;
		padding: 60upx 0;
		color: #999;
		font-size: 26upx;
	}

	.help-section {
		background-color: #fff;
		border-radius: 16upx;
		padding: 30upx;
		
		.help-title {
			font-size: 30upx;
			font-weight: bold;
			color: #333;
			margin-bottom: 20upx;
		}
		
		.help-content {
			text {
				display: block;
				font-size: 26upx;
				color: #666;
				line-height: 1.6;
				margin-bottom: 10upx;
			}
		}
	}
</style> 