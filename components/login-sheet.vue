<template>
	<view v-if="show" class="login-sheet-wrapper" @click="hideSheet">
		<view class="login-sheet" @click.stop>
			<view class="sheet-header">
				<text class="title">欢迎使用商城</text>
				<text class="close-btn" @click="hideSheet">×</text>
			</view>

			<view class="sheet-content">
				<phone-login v-if="!showInviteInput" :pendingInviteCode="pendingInviteCode"
					@login-success="handleLoginSuccess" @need-invite-code="showInviteInput = true" />

				<invite-code-input v-else :encryptedData="encryptedData" :iv="iv" :pendingInviteCode="pendingInviteCode"
					@back="backToLogin" @register-success="handleLoginSuccess" />
			</view>
		</view>
	</view>
</template>

<script>
import PhoneLogin from '@/components/user/phone-login.vue';
import InviteCodeInput from '@/components/user/invite-code-input.vue';

export default {
	components: {
		PhoneLogin,
		InviteCodeInput
	},
	props: {
		show: {
			type: Boolean,
			default: false
		}
	},
	data() {
		return {
			showInviteInput: false,
			pendingInviteCode: '', // 从URL或本地存储中获取的邀请码
			encryptedData: '',
			iv: ''
		}
	},
	watch: {
		show(newVal) {
			if (newVal) {
				// 检查本地存储中是否有邀请码
				this.checkPendingInviteCode();

				// 检查 URL 中是否有邀请码参数
				this.checkInviteCodeFromUrl();
			} else {
				this.resetData();
			}
		}
	},
	methods: {
		hideSheet() {
			this.$emit('hide');
		},

		resetData() {
			this.showInviteInput = false;
			// 不重置 pendingInviteCode，因为可能还需要使用
		},

		// 检查本地存储中是否有邀请码
		checkPendingInviteCode() {
			const storedInviteCode = uni.getStorageSync('pendingInviteCode');
			if (storedInviteCode) {
				console.log('从本地存储中获取到邀请码:', storedInviteCode);
				this.pendingInviteCode = storedInviteCode;
			}
		},

		checkInviteCodeFromUrl() {
			// 从页面参数中获取邀请码
			const pages = getCurrentPages();
			const currentPage = pages[pages.length - 1];
			if (currentPage && currentPage.options && currentPage.options.inviteCode) {
				console.log('从URL参数中获取到邀请码:', currentPage.options.inviteCode);
				this.pendingInviteCode = currentPage.options.inviteCode;

				// 保存到本地存储，以便在其他页面使用
				uni.setStorageSync('pendingInviteCode', currentPage.options.inviteCode);
			}
		},

		handleLoginSuccess() {
			// 清除待处理的邀请码
			if (this.pendingInviteCode) {
				uni.removeStorageSync('pendingInviteCode');
				console.log('已清除待处理的邀请码');
			}

			// 关闭登录弹窗
			this.hideSheet();
		},

		backToLogin() {
			this.showInviteInput = false;
		},

		// 这些方法用于子组件传递数据
		setEncryptedData(data) {
			this.encryptedData = data;
		},

		setIv(iv) {
			this.iv = iv;
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

.sheet-content {
	// 子组件会处理内部样式
}
</style>