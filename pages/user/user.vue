<template>  
    <view class="container">  
		
		<view class="user-section">
			<image class="bg" src="https://boyangchuanggu-mall.oss-cn-guangzhou.aliyuncs.com/static/user-bg.jpg"></image>
			<view class="user-info-box">
				<view class="portrait-box">
					<image class="portrait" :src="userInfo.icon || 'https://boyangchuanggu-mall.oss-cn-guangzhou.aliyuncs.com/static/missing-face.png'"></image>
				</view>
				<view class="info-box">
					<text class="username">{{userInfo.nickname || (userInfo.phone_number ? formatPhone(userInfo.phone_number) : '游客')}}</text>
					<!-- #ifdef MP-WEIXIN -->
					<text class="phone" v-if="userInfo.phone_number && userInfo.nickname">{{formatPhone(userInfo.phone_number)}}</text>
					<!-- #endif -->
				</view>
			</view>
			<!-- <view class="vip-card-box">
				<image class="card-bg" src="https://boyangchuanggu-mall.oss-cn-guangzhou.aliyuncs.com/static/vip-card-bg.png" mode=""></image>
				<view class="b-btn">
					立即开通
				</view>
				<view class="tit">
					<text class="yticon icon-iLinkapp-"></text>
					黄金会员
				</view>
				<text class="e-m">mall移动端商城</text>
				<text class="e-b">黄金及以上会员可享有会员价优惠商品。</text>
			</view> -->
		</view>
		
		<view 
			class="cover-container"
			:style="[{
				transform: coverTransform,
				transition: coverTransition
			}]"
			@touchstart="coverTouchstart"
			@touchmove="coverTouchmove"
			@touchend="coverTouchend"
		>
			<image class="arc" src="https://boyangchuanggu-mall.oss-cn-guangzhou.aliyuncs.com/static/arc.png"></image>
			
			<view class="tj-sction">
				<view class="tj-item" @click="copyInviteCode">
					<text class="num">{{userInviteCode || '暂无'}}</text>
					<text>我的邀请码</text>
				</view>
				<view class="tj-item share-btn-container">
					<view class="share-btn" @click="shareWithFriends" :class="{ disabled: !userInviteCode }">
						<text class="yticon icon-haoyou"></text>
						<text>邀请好友</text>
					</view>
				</view>
				<view class="tj-item" @click="navTo('/pages/coupon/couponList')">
					<text class="num">{{couponCount || '暂无'}}</text>
					<text>优惠券</text>
				</view>
			</view>
			<!-- 订单 -->
			<view class="order-section">
				<view class="order-item" @click="navTo('/pages/order/order?state=0')" hover-class="common-hover"  :hover-stay-time="50">
					<text class="yticon icon-shouye"></text>
					<text>全部订单</text>
				</view>
				<view class="order-item" @click="navTo('/pages/order/order?state=1')"  hover-class="common-hover" :hover-stay-time="50">
					<text class="yticon icon-daifukuan"></text>
					<text>待付款</text>
				</view>
				<view class="order-item" @click="navTo('/pages/order/order?state=2')" hover-class="common-hover"  :hover-stay-time="50">
					<text class="yticon icon-yishouhuo"></text>
					<text>待收货</text>
				</view>
			</view>
			<!-- 浏览历史 -->
			<view class="history-section icon">
				<!-- #ifdef MP-WEIXIN -->
				<list-cell icon="icon-fenxiang2" iconColor="#FA436A" title="邀请统计" @eventClick="navTo('/pages/user/inviteStats')"></list-cell>
				<!-- #endif -->
				<list-cell icon="icon-dizhi" iconColor="#5fcda2" title="地址管理" @eventClick="navTo('/pages/address/address')"></list-cell>
				<!-- <list-cell icon="icon-lishijilu" iconColor="#e07472" title="我的足迹" @eventClick="navTo('/pages/user/readHistory')"></list-cell>
				<list-cell icon="icon-shoucang" iconColor="#5fcda2" title="我的关注" @eventClick="navTo('/pages/user/brandAttention')"></list-cell>
				<list-cell icon="icon-shoucang_xuanzhongzhuangtai" iconColor="#54b4ef" title="我的收藏" @eventClick="navTo('/pages/user/productCollection')"></list-cell> -->
				<list-cell icon="icon-shezhi1" iconColor="#e07472" title="设置" border="" @eventClick="navTo('/pages/set/set')"></list-cell>
			</view>
		</view>
			
		
    </view>  
</template>  
<script>  
	import listCell from '@/components/mix-list-cell';
	import {
		fetchMemberCouponList
	} from '@/api/coupon.js';
	import {
		getUserProfile,
		getInviteStats,
		verifyToken
	} from '@/api/user.js';
    import {  
        mapState, mapMutations
    } from 'vuex';  
	let startY = 0, moveY = 0, pageAtTop = true;
    export default {
		components: {
			listCell
		},
		data(){
			return {
				coverTransform: 'translateY(0px)',
				coverTransition: '0s',
				moving: false,
				couponCount: null,
				userInviteCode: null,
				baseShareUrl: '#/pages/index/index?inviteCode='
			}
		},
		onLoad(){
		},
		// #ifdef MP-WEIXIN
		onShareAppMessage() {
			if (this.hasLogin && this.userInviteCode) {
				return {
					title: '邀请您加入商城，注册即享优惠',
					path: `/pages/index/index?inviteCode=${this.userInviteCode}`,
					imageUrl: 'https://boyangchuanggu-mall.oss-cn-guangzhou.aliyuncs.com/static/user-bg.jpg'
				};
			}
			return {
				title: '商城小程序',
				path: '/pages/index/index'
			};
		},
		// #endif
		
		// #ifdef MP-WEIXIN
		onShareTimeline() {
			if (this.hasLogin && this.userInviteCode) {
				return {
					title: '邀请您加入商城，注册即享优惠',
					query: `inviteCode=${this.userInviteCode}`,
					imageUrl: 'https://boyangchuanggu-mall.oss-cn-guangzhou.aliyuncs.com/static/user-bg.jpg'
				};
			}
			return {
				title: '商城小程序'
			};
		},
		// #endif
		onShow(){
			// 调试信息：检查登录状态和存储的数据
			console.log('用户页面 onShow - hasLogin:', this.hasLogin);
			console.log('用户页面 onShow - userInfo:', JSON.stringify(this.userInfo));
			console.log('用户页面 onShow - 本地存储的 token:', uni.getStorageSync('token'));
			console.log('用户页面 onShow - 本地存储的 userInfo:', JSON.stringify(uni.getStorageSync('userInfo')));
			
			// 检查登录状态一致性
			const token = uni.getStorageSync('token');
			const storedUserInfo = uni.getStorageSync('userInfo');
			
			// 如果有 token 但 Vuex 中显示未登录，尝试恢复登录状态
			if (token && !this.hasLogin && storedUserInfo) {
				console.log('用户页面 onShow - 检测到 token 存在但未登录，尝试恢复登录状态');
				this.login(storedUserInfo);
				
				// 获取邀请码
				if (storedUserInfo.invite_code) {
					this.userInviteCode = storedUserInfo.invite_code;
					this.setInviteCode(storedUserInfo.invite_code);
				}
			}
			
			if(this.hasLogin){
				// 获取优惠券数量
				fetchMemberCouponList(0).then(response=>{
					if(response.data!=null&&response.data.length>0){
						this.couponCount = response.data.length;
					}
				});
				
				// 刷新邀请统计信息
				this.refreshInviteStats().catch(error => {
					console.error('刷新邀请统计失败:', error);
					
					// 如果是 401 错误，但是本地仍有 token，可能是临时网络问题
					if (error.code === 401 && token) {
						console.log('检测到 401 错误但本地有 token，可能是临时网络问题，不执行登出');
						// 可以尝试静默重新验证 token
						this.silentVerifyToken();
					}
				});
			}else{
				this.couponCount = null;
				this.userInviteCode = null;
			}
		},
		// #ifndef MP
		onNavigationBarButtonTap(e) {
			const index = e.index;
			if (index === 0) {
				this.navTo('/pages/set/set');
			}else if(index === 1){
				// #ifdef APP-PLUS
				const pages = getCurrentPages();
				const page = pages[pages.length - 1];
				const currentWebview = page.$getAppWebview();
				currentWebview.hideTitleNViewButtonRedDot({
					index
				});
				// #endif
				uni.navigateTo({
					url: '/pages/notice/notice'
				})
			}
		},
		// #endif
        computed: {
			...mapState(['hasLogin','userInfo','inviteCode'])
		},
        methods: {
			...mapMutations(['setInviteCode', 'login', 'logout']),
			
			/**
			 * 刷新用户信息（完整版，现在不使用）
			 */
			async refreshUserInfo() {
				console.log('开始刷新用户信息...');
				console.log('当前 token:', uni.getStorageSync('token'));
				
				try {
					// 获取用户基本信息
					console.log('调用 getUserProfile...');
					const userRes = await getUserProfile();
					console.log('getUserProfile 响应:', userRes);
					
					if (userRes.success && userRes.data.user) {
						// 更新 Vuex 中的用户信息
						this.login(userRes.data.user);
					}
					
					// 获取邀请统计信息
					await this.refreshInviteStats();
				} catch (error) {
					console.error('刷新用户信息失败:', error);
					console.error('错误详情:', error.code, error.message, error.data);
					
					// 如果是认证错误，可能需要重新登录
					if (error.code === 401) {
						console.log('检测到 401 错误，执行登出操作');
						this.logout();
						
						// 显示重新登录提示
						uni.showModal({
							title: '提示',
							content: '您已被登出，可以取消继续留在该页面，或者重新登录',
							confirmText: '重新登录',
							cancelText: '取消',
							success: (res) => {
								if (res.confirm) {
									uni.reLaunch({
										url: '/pages/index/index'
									});
								}
							}
						});
					}
				}
			},
			
			/**
			 * 只刷新邀请统计信息
			 */
			async refreshInviteStats() {
				try {
					// 获取邀请统计信息
					console.log('调用 getInviteStats...');
					const inviteRes = await getInviteStats();
					console.log('getInviteStats 响应:', JSON.stringify(inviteRes));
					
					if (inviteRes.success && inviteRes.data) {
						this.userInviteCode = inviteRes.data.inviteCode;
						this.setInviteCode(inviteRes.data.inviteCode);
					}
					return inviteRes;
				} catch (error) {
					console.error('获取邀请统计失败:', error);
					console.error('错误详情:', error.code, error.message, error.data);
					
					// 如果是认证错误，可能需要重新登录
					if (error.code === 401) {
						console.log('检测到 401 错误，检查本地 token...');
						const token = uni.getStorageSync('token');
						
						// 如果本地没有 token，执行登出
						if (!token) {
							console.log('本地无 token，执行登出操作');
							this.logout();
							
							// 显示重新登录提示
							uni.showModal({
								title: '提示',
								content: '您的登录已过期，请重新登录',
								confirmText: '重新登录',
								cancelText: '取消',
								success: (res) => {
									if (res.confirm) {
										uni.reLaunch({
											url: '/pages/index/index'
										});
									}
								}
							});
						} else {
							console.log('本地仍有 token，可能是临时网络问题，不执行登出');
							// 抛出错误让上层处理
							throw error;
						}
					}
					return error;
				}
			},
			
			/**
			 * 格式化手机号显示
			 */
			formatPhone(phone) {
				if (!phone) return '';
				return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
			},
			
			/**
			 * 复制邀请码
			 */
			copyInviteCode() {
				if (!this.userInviteCode) {
					uni.showToast({
						title: '暂无邀请码',
						icon: 'none'
					});
					return;
				}
				
				uni.setClipboardData({
					data: this.userInviteCode,
					success: () => {
						uni.showToast({
							title: '邀请码已复制',
							icon: 'success'
						});
					}
				});
			},
			
			/**
			 * 分享邀请码
			 */
			shareWithFriends() {
				if(!this.hasLogin) {
					this.navTo('/pages/public/login');
					return;
				}
				
				if(!this.userInviteCode) {
					uni.showToast({
						title: '获取邀请码失败，请重试',
						icon: 'none'
					});
					return;
				}
				
				// #ifdef MP-WEIXIN
				// 微信小程序分享
				uni.showModal({
					title: '分享邀请',
					content: '点击右上角"···"按钮，然后点击"转发"即可分享给好友',
					showCancel: false,
					confirmText: '我知道了'
				});
				// #endif
				
				// #ifndef MP-WEIXIN
				// 其他平台，显示分享选项
				uni.showActionSheet({
					itemList: ['复制邀请码', '生成分享链接'],
					success: (res) => {
						if (res.tapIndex === 0) {
							this.copyInviteCode();
						} else if (res.tapIndex === 1) {
							this.generateShareLink();
						}
					}
				});
				// #endif
			},
			
			/**
			 * 生成分享链接
			 */
			generateShareLink() {
				const shareLink = this.baseShareUrl + this.userInviteCode;
				uni.setClipboardData({
					data: shareLink,
					success: () => {
						uni.showToast({
							title: '分享链接已复制',
							icon: 'success'
						});
					}
				});
			},

			/**
			 * 统一跳转接口,拦截未登录路由
			 * navigator标签现在默认没有转场动画，所以用view
			 */
			navTo(url){
				if(!this.hasLogin){
					url = '/pages/public/login';
				}
				uni.navigateTo({  
					url
				})  
			}, 
	
			/**
			 *  会员卡下拉和回弹
			 *  1.关闭bounce避免ios端下拉冲突
			 *  2.由于touchmove事件的缺陷（以前做小程序就遇到，比如20跳到40，h5反而好很多），下拉的时候会有掉帧的感觉
			 *    transition设置0.1秒延迟，让css来过渡这段空窗期
			 *  3.回弹效果可修改曲线值来调整效果，推荐一个好用的bezier生成工具 http://cubic-bezier.com/
			 */
			coverTouchstart(e){
				if(pageAtTop === false){
					return;
				}
				this.coverTransition = 'transform .1s linear';
				startY = e.touches[0].clientY;
			},
			coverTouchmove(e){
				moveY = e.touches[0].clientY;
				let moveDistance = moveY - startY;
				if(moveDistance < 0){
					this.moving = false;
					return;
				}
				this.moving = true;
				if(moveDistance >= 80 && moveDistance < 100){
					moveDistance = 80;
				}
		
				if(moveDistance > 0 && moveDistance <= 80){
					this.coverTransform = `translateY(${moveDistance}px)`;
				}
			},
			coverTouchend(){
				if(this.moving === false){
					return;
				}
				this.moving = false;
				this.coverTransition = 'transform 0.3s cubic-bezier(.21,1.93,.53,.64)';
				this.coverTransform = 'translateY(0px)';
			},
			/**
			 * 静默验证 token，不弹出提示
			 */
			async silentVerifyToken() {
				try {
					const response = await verifyToken();
					
					if (response.success) {
						console.log('静默验证 token 成功，更新用户信息');
						this.login(response.data.userInfo);
						if (response.data.inviteCode) {
							this.setInviteCode(response.data.inviteCode);
							this.userInviteCode = response.data.inviteCode;
						}
					}
				} catch (error) {
					console.error('静默验证 token 失败:', error);
					// 失败时不做任何处理，保持当前状态
				}
			},
        }  
    }  
</script>  
<style lang='scss'>
	%flex-center {
	 display:flex;
	 flex-direction: column;
	 justify-content: center;
	 align-items: center;
	}
	%section {
	  display:flex;
	  justify-content: space-around;
	  align-content: center;
	  background: #fff;
	  border-radius: 10upx;
	}

	.user-section{
		height: 520upx;
		padding: 100upx 30upx 0;
		position:relative;
		.bg{
			position:absolute;
			left: 0;
			top: 0;
			width: 100%;
			height: 100%;
		}
	}
	.user-info-box{
		height: 180upx;
		display:flex;
		align-items:center;
		position:relative;
		z-index: 1;
		.portrait{
			width: 130upx;
			height: 130upx;
			border:5upx solid #fff;
			border-radius: 50%;
		}
		.info-box {
			margin-left: 20upx;
			display: flex;
			flex-direction: column;
		}
		.username{
			font-size: $font-lg + 6upx;
			color: white;
			margin-bottom: 8upx;
		}
		.phone {
			font-size: $font-base;
			color: rgba(255, 255, 255, 0.8);
		}
	}

	.vip-card-box{
		display:flex;
		flex-direction: column;
		color: #f7d680;
		height: 240upx;
		background: linear-gradient(left, rgba(0,0,0,.7), rgba(0,0,0,.8));
		border-radius: 16upx 16upx 0 0;
		overflow: hidden;
		position: relative;
		padding: 20upx 24upx;
		.card-bg{
			position:absolute;
			top: 20upx;
			right: 0;
			width: 380upx;
			height: 260upx;
		}
		.b-btn{
			position: absolute;
			right: 20upx;
			top: 16upx;
			width: 132upx;
			height: 40upx;
			text-align: center;
			line-height: 40upx;
			font-size: 22upx;
			color: #36343c;
			border-radius: 20px;
			background: linear-gradient(left, #f9e6af, #ffd465);
			z-index: 1;
		}
		.tit{
			font-size: $font-base+2upx;
			color: #f7d680;
			margin-bottom: 28upx;
			.yticon{
				color: #f6e5a3;
				margin-right: 16upx;
			}
		}
		.e-b{
			font-size: $font-sm;
			color: #d8cba9;
			margin-top: 10upx;
		}
	}
	.cover-container{
		background: $page-color-base;
		margin-top: -150upx;
		padding: 0 30upx;
		position:relative;
		background: #f5f5f5;
		padding-bottom: 20upx;
		.arc{
			position:absolute;
			left: 0;
			top: -34upx;
			width: 100%;
			height: 36upx;
		}
	}
	.tj-sction{
		@extend %section;
		.tj-item{
			@extend %flex-center;
			flex-direction: column;
			height: 140upx;
			font-size: $font-sm;
			color: #75787d;
		}
		.num{
			font-size: $font-lg;
			color: $font-color-dark;
			margin-bottom: 8upx;
		}
		.share-btn-container {
			@extend %flex-center;
			height: 140upx;
		}
		.share-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 28upx;
			background: #FA436A;
			color: #fff;
			border-radius: 50upx;
			padding: 12upx 30upx;
			box-shadow: 0 4upx 8upx rgba(250, 67, 106, 0.3);
			height: auto;
			
			&.disabled {
				background: #ccc;
				box-shadow: none;
			}
			
			.yticon {
				margin-right: 8upx;
				font-size: 24upx;
			}
		}
	}
	.order-section{
		@extend %section;
		padding: 28upx 0;
		margin-top: 20upx;
		.order-item{
			@extend %flex-center;
			width: 120upx;
			height: 120upx;
			border-radius: 10upx;
			font-size: $font-sm;
			color: $font-color-dark;
		}
		.yticon{
			font-size: 48upx;
			margin-bottom: 18upx;
			color: #fa436a;
		}
		.icon-shouhoutuikuan{
			font-size:44upx;
		}
	}
	.history-section{
		padding: 30upx 0 0;
		margin-top: 20upx;
		background: #fff;
		border-radius:10upx;
		.sec-header{
			display:flex;
			align-items: center;
			font-size: $font-base;
			color: $font-color-dark;
			line-height: 40upx;
			margin-left: 30upx;
			.yticon{
				font-size: 44upx;
				color: #5eba8f;
				margin-right: 16upx;
				line-height: 40upx;
			}
		}
		.h-list{
			white-space: nowrap;
			padding: 30upx 30upx 0;
			image{
				display:inline-block;
				width: 160upx;
				height: 160upx;
				margin-right: 20upx;
				border-radius: 10upx;
			}
		}
	}
	
</style>