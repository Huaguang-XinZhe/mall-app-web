<template>
	<view class="content">
		<view class="search-box">
			<view class="search-form">
				<input class="input" type="text" v-model="keyword" placeholder="请输入关键字搜索" @confirm="search" confirm-type="search" focus/>
				<button class="search-btn" @click="search">搜索</button>
			</view>
		</view>
		
		<!-- 搜索历史 -->
		<view class="history-box" v-if="historyList.length>0 && !keyword">
			<view class="title-box">
				<text>搜索历史</text>
				<text class="clear-btn" @click="clearHistory">清除</text>
			</view>
			<view class="history-list">
				<view class="item" v-for="(item, index) in historyList" :key="index" @click="historySearch(item)">
					{{item}}
				</view>
			</view>
		</view>
		
		<!-- 热门搜索 -->
		<view class="hot-box" v-if="!keyword">
			<view class="title-box">
				<text>热门搜索</text>
			</view>
			<view class="hot-list">
				<view class="item" v-for="(item, index) in hotList" :key="index" @click="historySearch(item)">
					{{item}}
				</view>
			</view>
		</view>
		
		<!-- 搜索结果 -->
		<view class="result-box" v-if="keyword">
			<view class="loading" v-if="loading">
				<text>正在加载...</text>
			</view>
			<view class="no-result" v-else-if="productList.length === 0">
				<text>没有找到相关商品</text>
			</view>
			<view class="product-list" v-else>
				<view class="product-item" v-for="(item, index) in productList" :key="index" @click="navToDetail(item)">
					<view class="image-wrapper">
						<image :src="item.pic" mode="aspectFill"></image>
					</view>
					<view class="item-info">
						<text class="title">{{item.name}}</text>
						<text class="subtitle">{{item.subTitle}}</text>
						<text class="price">￥{{item.price}}</text>
					</view>
				</view>
			</view>
			
			<uni-load-more :status="loadingType"></uni-load-more>
		</view>
	</view>
</template>

<script>
	import uniLoadMore from '@/components/uni-load-more/uni-load-more.vue';
	
	export default {
		components: {
			uniLoadMore
		},
		data() {
			return {
				keyword: '',
				loading: false,
				loadingType: 'more',
				productList: [],
				historyList: [],
				hotList: ['手机', '电脑', '耳机', '衣服', '鞋子', '包包'],
				params: {
					keyword: '',
					pageNum: 1,
					pageSize: 10
				}
			}
		},
		onLoad() {
			// 获取本地存储的搜索历史
			let historyList = uni.getStorageSync('searchHistory');
			if (historyList) {
				this.historyList = JSON.parse(historyList);
			}
		},
		onReachBottom() {
			if (this.loadingType === 'nomore') return;
			
			this.params.pageNum++;
			this.loadingType = 'loading';
			this.searchProducts();
		},
		methods: {
			// 搜索商品
			search() {
				if (!this.keyword) return;
				
				// 将关键词加入历史
				this.addHistory(this.keyword);
				
				// 重置搜索参数
				this.params.keyword = this.keyword;
				this.params.pageNum = 1;
				this.productList = [];
				this.loading = true;
				
				this.searchProducts();
			},
			
			// 执行搜索请求
			searchProducts() {
				// 这里应该调用后端API搜索商品
				// 这里用setTimeout模拟网络请求
				setTimeout(() => {
					// 模拟搜索结果
					let resultList = [];
					for (let i = 0; i < 10; i++) {
						resultList.push({
							id: this.params.pageNum * 10 + i,
							name: `${this.params.keyword}商品${this.params.pageNum * 10 + i}`,
							subTitle: `${this.params.keyword}的详细描述信息${this.params.pageNum * 10 + i}`,
							price: Math.floor(Math.random() * 1000) + 1,
							pic: 'https://img14.360buyimg.com/n0/jfs/t1/101062/37/21949/137860/61f23eb2E3d4089e5/0b27b38c4c4c1732.jpg'
						});
					}
					
					this.productList = this.productList.concat(resultList);
					this.loading = false;
					
					// 如果是第3页，模拟没有更多数据
					if (this.params.pageNum >= 3) {
						this.loadingType = 'nomore';
					} else {
						this.loadingType = 'more';
					}
				}, 1000);
			},
			
			// 添加搜索历史
			addHistory(keyword) {
				let index = this.historyList.indexOf(keyword);
				if (index !== -1) {
					this.historyList.splice(index, 1);
				}
				this.historyList.unshift(keyword);
				if (this.historyList.length > 10) {
					this.historyList.pop();
				}
				uni.setStorageSync('searchHistory', JSON.stringify(this.historyList));
			},
			
			// 清除搜索历史
			clearHistory() {
				uni.showModal({
					title: '提示',
					content: '确定要清除搜索历史吗？',
					success: (res) => {
						if (res.confirm) {
							this.historyList = [];
							uni.removeStorageSync('searchHistory');
						}
					}
				});
			},
			
			// 点击历史或热门搜索项
			historySearch(item) {
				this.keyword = item;
				this.search();
			},
			
			// 跳转到商品详情
			navToDetail(item) {
				uni.navigateTo({
					url: `/pages/product/product?id=${item.id}`
				});
			}
		}
	}
</script>

<style lang="scss">
	.content {
		background-color: #f8f8f8;
		min-height: 100vh;
	}
	
	.search-box {
		background-color: #ffffff;
		padding: 20rpx 30rpx;
		
		.search-form {
			display: flex;
			align-items: center;
			background-color: #f5f5f5;
			border-radius: 40rpx;
			padding: 0 30rpx;
			
			.input {
				flex: 1;
				font-size: 28rpx;
			}
			
			.search-btn {
				height: 60rpx;
				line-height: 60rpx;
				font-size: 28rpx;
				margin: 0;
				margin-left: 10rpx;
				padding: 0 30rpx;
				background-color: $uni-color-primary;
				color: #fff;
				border-radius: 40rpx;
			}
		}
	}
	
	.title-box {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 30rpx;
		font-size: 28rpx;
		color: #303133;
		
		.clear-btn {
			color: #999;
			font-size: 24rpx;
		}
	}
	
	.history-box, .hot-box {
		margin-top: 20rpx;
		background-color: #ffffff;
	}
	
	.history-list, .hot-list {
		display: flex;
		flex-wrap: wrap;
		padding: 0 20rpx 20rpx;
		
		.item {
			padding: 10rpx 20rpx;
			margin: 10rpx;
			background-color: #f5f5f5;
			border-radius: 30rpx;
			font-size: 24rpx;
			color: #606266;
		}
	}
	
	.result-box {
		margin-top: 20rpx;
		
		.loading, .no-result {
			padding: 30rpx 0;
			text-align: center;
			font-size: 28rpx;
			color: #909399;
		}
		
		.product-list {
			background-color: #ffffff;
			
			.product-item {
				display: flex;
				padding: 20rpx 30rpx;
				border-bottom: 1px solid #f5f5f5;
				
				.image-wrapper {
					width: 180rpx;
					height: 180rpx;
					flex-shrink: 0;
					
					image {
						width: 100%;
						height: 100%;
						border-radius: 8rpx;
					}
				}
				
				.item-info {
					flex: 1;
					padding-left: 30rpx;
					display: flex;
					flex-direction: column;
					justify-content: space-between;
					
					.title {
						font-size: 28rpx;
						color: #303133;
						line-height: 40rpx;
					}
					
					.subtitle {
						font-size: 24rpx;
						color: #909399;
						line-height: 36rpx;
					}
					
					.price {
						font-size: 32rpx;
						color: $uni-color-primary;
					}
				}
			}
		}
	}
</style> 