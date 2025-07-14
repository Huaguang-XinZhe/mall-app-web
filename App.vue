<script>
	/**
	 * vuex管理登陆状态，具体可以参考官方登陆模板示例
	 */
	import {
		mapMutations
	} from 'vuex';
	export default {
		data() {
			return {
				tokenRefreshTimer: null
			}
		},
		methods: {
			...mapMutations(['login']),
			
			// 检查认证状态
			async checkAuthStatus() {
				const token = uni.getStorageSync('token');
				const userInfo = uni.getStorageSync('userInfo');
				
				console.log('App checkAuthStatus - token:', token);
				console.log('App checkAuthStatus - userInfo:', userInfo ? JSON.stringify(userInfo) : '无');
				
				if (token && userInfo && (userInfo.id || userInfo.openid)) {
					console.log('App checkAuthStatus - 检测到本地认证数据，验证 token...');
					// 验证 token 是否有效
					try {
						const { verifyToken } = require('@/api/user.js');
						
						// 添加超时处理
						const timeoutPromise = new Promise((_, reject) => {
							setTimeout(() => reject(new Error('Token 验证请求超时')), 10000);
						});
						
						const responsePromise = verifyToken();
						const response = await Promise.race([responsePromise, timeoutPromise]);
						
						console.log('App checkAuthStatus - verifyToken 响应:', JSON.stringify(response));
						
						if (response.success) {
							// Token 有效，恢复登录状态
							console.log('App checkAuthStatus - Token 有效，恢复登录状态');
							
							// 确保有用户信息
							if (response.data && response.data.userInfo) {
								console.log('App checkAuthStatus - 使用后端返回的用户信息');
								this.login(response.data.userInfo);
							} else {
								console.log('App checkAuthStatus - 使用本地存储的用户信息');
								this.login(userInfo);
							}
							
							// 恢复邀请码状态
							if (response.data && response.data.inviteCode) {
								console.log('App checkAuthStatus - 设置邀请码:', response.data.inviteCode);
								this.$store.commit('setInviteCode', response.data.inviteCode);
							} else if (userInfo.invite_code) {
								console.log('App checkAuthStatus - 使用用户信息中的邀请码:', userInfo.invite_code);
								this.$store.commit('setInviteCode', userInfo.invite_code);
							}
							
							// 确保 token 正确存储（不要包含 Bearer 前缀）
							const currentToken = uni.getStorageSync('token');
							if (currentToken && currentToken.startsWith('Bearer ')) {
								console.log('App checkAuthStatus - 修正 token 格式（移除 Bearer 前缀）');
								uni.setStorageSync('token', currentToken.replace('Bearer ', ''));
							}
							
							console.log('App checkAuthStatus - 验证完成，登录状态:', this.$store.state.hasLogin);
						} else {
							// Token 无效，清除本地数据
							console.log('App checkAuthStatus - Token 无效，清除本地数据:', response.message);
							this.clearLocalAuth();
						}
					} catch (error) {
						console.error('验证 token 失败:', error.message || error);
						console.error('错误详情:', JSON.stringify(error));
						
						// 判断是否为网络错误，网络错误不清除登录状态
						if (error.message && (
							error.message.includes('timeout') || 
							error.message.includes('network') || 
							error.message.includes('超时')
						)) {
							console.log('网络错误，使用本地缓存的用户信息');
							this.login(userInfo);
							return;
						}
						
						// Token 验证失败，清除本地数据
						console.log('App checkAuthStatus - Token 验证失败，清除本地数据');
						this.clearLocalAuth();
					}
				} else {
					console.log('App checkAuthStatus - 没有本地认证数据');
				}
			},
			
			// 定期刷新 token
			startTokenRefresh() {
				// 如果已经有定时器，先清除
				if (this.tokenRefreshTimer) {
					clearInterval(this.tokenRefreshTimer);
				}
				
				// 每30分钟刷新一次 token（1800000毫秒）
				this.tokenRefreshTimer = setInterval(async () => {
					const token = uni.getStorageSync('token');
					if (token) {
						console.log('定期刷新 token 开始...');
						try {
							const { verifyToken } = require('@/api/user.js');
							const response = await verifyToken();
							console.log('token 刷新成功');
						} catch (error) {
							console.error('token 刷新失败:', error);
						}
					} else {
						console.log('无token，跳过定期刷新');
					}
				}, 1800000);
			},
			
			// 清除本地认证数据
			clearLocalAuth() {
				uni.removeStorageSync('token');
				uni.removeStorageSync('userInfo');
				uni.removeStorageSync('myInviteCode');
			}
		},
		onLaunch: function() {
			this.checkAuthStatus();
			// 启动定期刷新 token
			this.startTokenRefresh();
		},
		onShow: function(options) {
			console.log('App Show', options);
			console.log('App Show', options.referrerInfo);
			if (options.referrerInfo.appId === 'wx1183b055aeec94d1') {
				console.log('收到微信确认收货回调');
				const extraData = options.referrerInfo.extraData;
				const { handleWxConfirmReceive } = require('@/utils/orderUtils.js');
				handleWxConfirmReceive(extraData).catch(err => {
					console.error('处理微信确认收货失败:', err);
				});
			}
		},
		onHide: function() {
			console.log('App Hide')
		},
	}
</script>

<style lang='scss'>
	/*
		全局公共样式和字体图标
	*/
	@font-face {
		font-family: yticon;
		font-weight: normal;
		font-style: normal;
		src: url('https://at.alicdn.com/t/font_1078604_w4kpxh0rafi.ttf') format('truetype');
	}

	.yticon {
		font-family: "yticon" !important;
		font-size: 16px;
		font-style: normal;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	.icon-yiguoqi1:before {
		content: "\e700";
	}

	.icon-iconfontshanchu1:before {
		content: "\e619";
	}

	.icon-iconfontweixin:before {
		content: "\e611";
	}

	.icon-alipay:before {
		content: "\e636";
	}

	.icon-shang:before {
		content: "\e624";
	}

	.icon-shouye:before {
		content: "\e626";
	}

	.icon-shanchu4:before {
		content: "\e622";
	}

	.icon-xiaoxi:before {
		content: "\e618";
	}

	.icon-jiantour-copy:before {
		content: "\e600";
	}

	.icon-fenxiang2:before {
		content: "\e61e";
	}

	.icon-pingjia:before {
		content: "\e67b";
	}

	.icon-daifukuan:before {
		content: "\e68f";
	}

	.icon-pinglun-copy:before {
		content: "\e612";
	}

	.icon-dianhua-copy:before {
		content: "\e621";
	}

	.icon-shoucang:before {
		content: "\e645";
	}

	.icon-xuanzhong2:before {
		content: "\e62f";
	}

	.icon-gouwuche_:before {
		content: "\e630";
	}

	.icon-icon-test:before {
		content: "\e60c";
	}

	.icon-icon-test1:before {
		content: "\e632";
	}

	.icon-bianji:before {
		content: "\e646";
	}

	.icon-jiazailoading-A:before {
		content: "\e8fc";
	}

	.icon-zuoshang:before {
		content: "\e613";
	}

	.icon-jia2:before {
		content: "\e60a";
	}

	.icon-huifu:before {
		content: "\e68b";
	}

	.icon-sousuo:before {
		content: "\e7ce";
	}

	.icon-arrow-fine-up:before {
		content: "\e601";
	}

	.icon-hot:before {
		content: "\e60e";
	}

	.icon-lishijilu:before {
		content: "\e6b9";
	}

	.icon-zhengxinchaxun-zhifubaoceping-:before {
		content: "\e616";
	}

	.icon-naozhong:before {
		content: "\e64a";
	}

	.icon-xiatubiao--copy:before {
		content: "\e608";
	}

	.icon-shoucang_xuanzhongzhuangtai:before {
		content: "\e6a9";
	}

	.icon-jia1:before {
		content: "\e61c";
	}

	.icon-bangzhu1:before {
		content: "\e63d";
	}

	.icon-arrow-left-bottom:before {
		content: "\e602";
	}

	.icon-arrow-right-bottom:before {
		content: "\e603";
	}

	.icon-arrow-left-top:before {
		content: "\e604";
	}

	.icon-icon--:before {
		content: "\e744";
	}

	.icon-zuojiantou-up:before {
		content: "\e605";
	}

	.icon-xia:before {
		content: "\e62d";
	}

	.icon--jianhao:before {
		content: "\e60b";
	}

	.icon-weixinzhifu:before {
		content: "\e61a";
	}

	.icon-comment:before {
		content: "\e64f";
	}

	.icon-weixin:before {
		content: "\e61f";
	}

	.icon-fenlei1:before {
		content: "\e620";
	}

	.icon-erjiye-yucunkuan:before {
		content: "\e623";
	}

	.icon-Group-:before {
		content: "\e688";
	}

	.icon-you:before {
		content: "\e606";
	}

	.icon-forward:before {
		content: "\e607";
	}

	.icon-tuijian:before {
		content: "\e610";
	}

	.icon-bangzhu:before {
		content: "\e679";
	}

	.icon-share:before {
		content: "\e656";
	}

	.icon-yiguoqi:before {
		content: "\e997";
	}

	.icon-shezhi1:before {
		content: "\e61d";
	}

	.icon-fork:before {
		content: "\e61b";
	}

	.icon-kafei:before {
		content: "\e66a";
	}

	.icon-iLinkapp-:before {
		content: "\e654";
	}

	.icon-saomiao:before {
		content: "\e60d";
	}

	.icon-shezhi:before {
		content: "\e60f";
	}

	.icon-shouhoutuikuan:before {
		content: "\e631";
	}

	.icon-gouwuche:before {
		content: "\e609";
	}

	.icon-dizhi:before {
		content: "\e614";
	}

	.icon-fenlei:before {
		content: "\e706";
	}

	.icon-xingxing:before {
		content: "\e70b";
	}

	.icon-tuandui:before {
		content: "\e633";
	}

	.icon-zuanshi:before {
		content: "\e615";
	}

	.icon-zuo:before {
		content: "\e63c";
	}

	.icon-shoucang2:before {
		content: "\e62e";
	}

	.icon-shouhuodizhi:before {
		content: "\e712";
	}

	.icon-yishouhuo:before {
		content: "\e71a";
	}

	.icon-dianzan-ash:before {
		content: "\e617";
	}





	view,
	scroll-view,
	swiper,
	swiper-item,
	cover-view,
	cover-image,
	icon,
	text,
	rich-text,
	progress,
	button,
	checkbox,
	form,
	input,
	label,
	radio,
	slider,
	switch,
	textarea,
	navigator,
	audio,
	camera,
	image,
	video {
		box-sizing: border-box;
	}
	/* 骨架屏替代方案 */
	.Skeleton {
		background: #f3f3f3;
		padding: 20upx 0;
		border-radius: 8upx;
	}

	/* 图片载入替代方案 */
	.image-wrapper {
		font-size: 0;
		background: #f3f3f3;
		border-radius: 4px;

		image {
			width: 100%;
			height: 100%;
			transition: .6s;
			opacity: 0;

			&.loaded {
				opacity: 1;
			}
		}
	}

	.clamp {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		display: block;
	}

	.common-hover {
		background: #f5f5f5;
	}

	/*边框*/
	.b-b:after,
	.b-t:after {
		position: absolute;
		z-index: 3;
		left: 0;
		right: 0;
		height: 0;
		content: '';
		transform: scaleY(.5);
		border-bottom: 1px solid $border-color-base;
	}

	.b-b:after {
		bottom: 0;
	}

	.b-t:after {
		top: 0;
	}

	/* button样式改写 */
	uni-button,
	button {
		height: 80upx;
		line-height: 80upx;
		font-size: $font-lg + 2upx;
		font-weight: normal;

		&.no-border:before,
		&.no-border:after {
			border: 0;
		}
	}

	uni-button[type=default],
	button[type=default] {
		color: $font-color-dark;
	}

	/* input 样式 */
	.input-placeholder {
		color: #999999;
	}

	.placeholder {
		color: #999999;
	}
</style>
