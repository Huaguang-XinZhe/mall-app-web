<template>
	<view class="content">
				<!-- 地址列表展示 -->
		<view class="address-list" v-if="addressList.length > 0">
			<view class="list b-b" v-for="(item, index) in addressList" :key="index" @click="checkAddress(item)">
				<view class="wrapper">
					<view class="address-box">
						<text v-if="item.defaultStatus==1" class="tag">默认</text>
						<text class="address">{{item.province}} {{item.city}} {{item.region}} {{item.detailAddress}}</text>
					</view>
					<view class="u-box">
						<text class="name">{{item.name}}</text>
						<text class="mobile">{{item.phoneNumber}}</text>
					</view>
				</view>
				<text class="yticon icon-bianji" @click.stop="editAddress(item)"></text>
				<text class="yticon icon-iconfontshanchu1" @click.stop="handleDeleteAddress(item.id)"></text>
			</view>
		</view>
		
		<!-- 空状态 -->
		<view class="empty-state" v-else>
			<image class="empty-icon" src="https://boyangchuanggu-mall.oss-cn-guangzhou.aliyuncs.com/static/empty-address.png" mode="aspectFit"></image>
			<text class="empty-text">暂无收货地址</text>
			<text class="empty-tips">添加收货地址，享受便捷购物体验</text>
		</view>
		
		<!-- 添加新地址表单 -->
		<view class="add-address-form" v-if="showAddForm">
			<view class="form-title">
				<text class="title-text">{{isEdit ? '编辑收货地址' : '新增收货地址'}}</text>
				<text class="yticon icon-guanbi" @click="hideAddForm"></text>
			</view>
			
			<!-- 基础信息 -->
			<view class="row b-b">
				<text class="tit">姓名</text>
				<input class="input" type="text" v-model="addressData.name" placeholder="收货人姓名" placeholder-class="placeholder" />
			</view>
			<view class="row b-b">
				<text class="tit">手机号码</text>
				<input class="input" type="number" v-model="addressData.phoneNumber" placeholder="收货人手机号码" placeholder-class="placeholder" />
			</view>
			
			<!-- 省市区选择 -->
			<view class="row b-b">
				<text class="tit">所在地区</text>
				<picker mode="region" @change="regionChange" :value="[addressData.province, addressData.city, addressData.region]" class="input">
					<view>{{addressData.province || '省'}} {{addressData.city || '市'}} {{addressData.region || '区/县'}}</view>
				</picker>
				<text class="yticon icon-you"></text>
			</view>
			
			<view class="row b-b">
				<text class="tit">详细地址</text>
				<input class="input" type="text" v-model="addressData.detailAddress" placeholder="街道/乡镇/小区/楼栋/门牌号等" placeholder-class="placeholder" />
			</view>
			<view class="row default-row">
				<text class="tit">设为默认</text>
				<switch :checked="addressData.defaultStatus==1" color="#fa436a" @change="switchChange" />
			</view>
			
			<!-- 地址粘贴解析功能 -->
			<view class="paste-section">
				<view class="paste-header">
					<text class="paste-title">快速添加地址</text>
					<text class="yticon icon-bangzhu" @click="showAddressTips"></text>
				</view>
				<view class="row paste-row">
					<textarea 
						class="paste-input" 
						placeholder="粘贴完整地址自动识别（如：张三 13800138000 浙江省杭州市西湖区文三路100号）" 
						placeholder-class="placeholder" 
						@input="parseAddress" 
						auto-height 
						maxlength="500"
					/>
				</view>
			</view>
			
			<view class="form-actions">
				<button class="cancel-btn" @click="hideAddForm">取消</button>
				<button class="submit-btn" @click="confirm">{{isEdit ? '保存' : '添加'}}</button>
			</view>
		</view>

		<!-- 底部按钮 -->
		<view class="bottom-actions" v-if="!showAddForm">
			<button class="add-btn" @click="showAddressForm">新增收货地址</button>
		</view>
	</view>
</template>

<script>
	import {
		fetchAddressList,
		addAddress,
		updateAddress,
		deleteAddress,
		fetchAddressDetail
	} from '@/api/address.js';
	
	export default {
		data() {
			return {
				source: 0,
				addressList: [],
				showAddForm: false,
				isEdit: false,
				addressData: {
					name: '',
					phoneNumber: '',
					postCode: '',
					detailAddress: '',
					defaultStatus: 0,
					province: '',
					city: '',
					region: '',
					prefixAddress: ''
				}
			}
		},
		onLoad(option) {
			console.log(option.source);
			this.source = option.source;
			this.loadData();
		},
		methods: {
			async loadData() {
				fetchAddressList().then(response => {
					this.addressList = response.data || [];
				});
			},
			
			// 选择地址（来自订单页面时）
			checkAddress(item) {
				if (this.source == 1) {
					this.$api.prePage().currentAddress = item;
					uni.navigateBack();
				}
			},
			
			// 显示添加地址表单
			showAddressForm() {
				this.isEdit = false;
				this.resetAddressData();
				this.showAddForm = true;
			},
			
			// 编辑地址
			editAddress(item) {
				this.isEdit = true;
				this.showAddForm = true;
				// 获取地址详情
				fetchAddressDetail(item.id).then(response => {
					this.addressData = { ...response.data };
				});
			},
			
			// 隐藏添加地址表单
			hideAddForm() {
				this.showAddForm = false;
				this.resetAddressData();
			},
			
			// 重置地址数据
			resetAddressData() {
				this.addressData = {
					name: '',
					phoneNumber: '',
					postCode: '',
					detailAddress: '',
					defaultStatus: 0,
					province: '',
					city: '',
					region: '',
					prefixAddress: ''
				};
			},
			
			// 删除地址
			handleDeleteAddress(id) {
				let superThis = this;
				uni.showModal({
				    title: '提示',
				    content: '是否要删除该地址',
				    success: function (res) {
				        if (res.confirm) {
							deleteAddress(id).then(response => {
								superThis.loadData();
								superThis.$api.msg('地址删除成功');
							});
				        }
				    }
				});
			},
			
			// 开关变化
			switchChange(e) {
				this.addressData.defaultStatus = e.detail.value ? 1 : 0;
			},
			
			// 地区选择器变化
			regionChange(e) {
				const regions = e.detail.value;
				this.addressData.province = regions[0] || '';
				this.addressData.city = regions[1] || '';
				this.addressData.region = regions[2] || '';
				this.updatePrefixAddress();
			},
			
			// 更新前缀地址
			updatePrefixAddress() {
				this.addressData.prefixAddress = this.addressData.province + this.addressData.city + this.addressData.region;
			},
			
			// 显示地址粘贴提示
			showAddressTips() {
				uni.showModal({
					title: '智能地址识别',
					content: '支持识别以下格式的地址信息：\n\n1. 标准格式：张三 13800138000 浙江省杭州市西湖区文三路100号\n\n2. 快递格式：收件人: 李四 手机号码: 13900139000 所在地区: 北京市朝阳区三里屯街道 详细地址: 工体北路8号\n\n系统将自动提取姓名、手机号和地址信息填入表单。',
					showCancel: false,
					confirmText: '知道了'
				});
			},
			
			// 解析粘贴的地址
			parseAddress(e) {
				const text = e.detail.value;
				if (!text || text.length < 10) return;
				
				console.log("解析地址:", text);
				
				// 清空之前的地址数据，避免残留
				this.addressData.name = '';
				this.addressData.phoneNumber = '';
				this.addressData.province = '';
				this.addressData.city = '';
				this.addressData.region = '';
				this.addressData.detailAddress = '';
				
				// 提取手机号
				const phoneReg = /(1[3-9]\d{9})/;
				const phoneMatch = text.match(phoneReg);
				if (phoneMatch && phoneMatch[1]) {
					this.addressData.phoneNumber = phoneMatch[1];
				}
				
				// 去除手机号后的文本
				let remainText = text.replace(phoneReg, ' ').trim();
				
				// 尝试从格式化的文本中提取信息
				let nameMatch = remainText.match(/收件人[:：\s]+([^手机\d]{2,4})/);
				if (nameMatch && nameMatch[1]) {
					this.addressData.name = nameMatch[1].trim();
				} else {
					// 尝试提取姓名（假设姓名在地址前面，2-4个字符）
					nameMatch = remainText.match(/^([\u4e00-\u9fa5]{2,4})/);
					if (nameMatch && nameMatch[1]) {
						this.addressData.name = nameMatch[1].trim();
					}
				}
				
				// 移除已提取的姓名
				if (this.addressData.name) {
					remainText = remainText.replace(this.addressData.name, ' ').trim();
					remainText = remainText.replace(/收件人[:：\s]+/, ' ').trim();
				}
				
				// 提取省市区县街道
				this.smartExtractRegions(remainText);
				
				// 提示用户地址已解析
				if (this.addressData.name || this.addressData.phoneNumber || this.addressData.province) {
					this.$api.msg('地址信息已自动识别，请核对');
				}
			},
			
			// 智能提取地区信息
			smartExtractRegions(address) {
				// 移除可能存在的标签文本
				address = address.replace(/所在地区[:：\s]+/, ' ')
								 .replace(/详细地址[:：\s]+/, ' ')
								 .replace(/手机号码[:：\s]+/, ' ')
								 .trim();
				
				console.log("提取地区信息:", address);
				
				// 优先尝试完整的省市区解析（针对紧凑格式如"福建省泉州市南安市美林街道"）
				const fullAddressReg = /([\u4e00-\u9fa5]{2,3}省|北京市|天津市|上海市|重庆市)([\u4e00-\u9fa5]{2,4}市)([\u4e00-\u9fa5]{2,4}[区县市])/;
				const fullMatch = address.match(fullAddressReg);
				
				if (fullMatch) {
					this.addressData.province = fullMatch[1];
					this.addressData.city = fullMatch[2];
					this.addressData.region = fullMatch[3];
					
					// 移除已提取的省市区，保留剩余部分作为详细地址
					let remainingAddress = address.replace(fullMatch[0], '').trim();
					
					// 清理详细地址中重复的省市区信息
					remainingAddress = this.cleanDuplicateRegions(remainingAddress);
					
					if (remainingAddress && remainingAddress.length > 0) {
						this.addressData.detailAddress = remainingAddress;
					}
				} else {
					// 如果完整匹配失败，尝试分步提取
					this.stepByStepExtract(address);
				}
				
				// 更新前缀地址
				this.updatePrefixAddress();
			},
			
			// 分步提取省市区信息
			stepByStepExtract(address) {
				// 省级提取
				const provinceReg = /(北京市|天津市|上海市|重庆市|河北省|山西省|辽宁省|吉林省|黑龙江省|江苏省|浙江省|安徽省|福建省|江西省|山东省|河南省|湖北省|湖南省|广东省|海南省|四川省|贵州省|云南省|陕西省|甘肃省|青海省|台湾省|内蒙古自治区|广西壮族自治区|西藏自治区|宁夏回族自治区|新疆维吾尔自治区|香港特别行政区|澳门特别行政区)/;
				const provinceMatch = address.match(provinceReg);
				
				if (provinceMatch && provinceMatch[1]) {
					this.addressData.province = provinceMatch[1];
					address = address.replace(provinceMatch[1], ' ').trim();
					
					// 直辖市特殊处理
					if (this.addressData.province.includes('市') && 
						(this.addressData.province.includes('北京') || 
						 this.addressData.province.includes('上海') || 
						 this.addressData.province.includes('天津') || 
						 this.addressData.province.includes('重庆'))) {
						this.addressData.city = this.addressData.province;
					}
				}
				
				// 市级提取
				if (!this.addressData.city) {
					const cityReg = /([^省]+市)/;
					const cityMatch = address.match(cityReg);
					if (cityMatch && cityMatch[1]) {
						this.addressData.city = cityMatch[1];
						address = address.replace(cityMatch[1], ' ').trim();
					}
				}
				
				// 区/县提取
				const regionReg = /([^市]+区|.+县|.+旗)/;
				const regionMatch = address.match(regionReg);
				if (regionMatch && regionMatch[1]) {
					this.addressData.region = regionMatch[1];
					address = address.replace(regionMatch[1], ' ').trim();
				}
				
				// 清理详细地址中重复的省市区信息
				address = this.cleanDuplicateRegions(address);
				
				// 将剩余内容作为详细地址
				if (address && address.length > 2) {
					this.addressData.detailAddress = address;
				}
				
				// 如果没有提取到省市区，尝试从详细地址中二次提取
				if ((!this.addressData.province || !this.addressData.city || !this.addressData.region) && 
					this.addressData.detailAddress && this.addressData.detailAddress.length > 5) {
					this.extractFromDetailAddress();
				}
			},
			
			// 清理详细地址中重复的省市区信息
			cleanDuplicateRegions(address) {
				if (!address) return '';
				
				let cleanedAddress = address;
				
				// 移除重复的省份信息
				if (this.addressData.province) {
					const provinceName = this.addressData.province.replace(/省|市$/, '');
					cleanedAddress = cleanedAddress.replace(new RegExp(provinceName + '[省市]?', 'g'), '').trim();
				}
				
				// 移除重复的城市信息
				if (this.addressData.city) {
					const cityName = this.addressData.city.replace(/市$/, '');
					cleanedAddress = cleanedAddress.replace(new RegExp(cityName + '市?', 'g'), '').trim();
				}
				
				// 移除重复的区县信息
				if (this.addressData.region) {
					const regionName = this.addressData.region.replace(/[区县市]$/, '');
					cleanedAddress = cleanedAddress.replace(new RegExp(regionName + '[区县市]?', 'g'), '').trim();
				}
				
				// 清理重复的街道/乡镇信息
				cleanedAddress = this.removeDuplicateStreets(cleanedAddress);
				
				// 清理多余的空格
				cleanedAddress = cleanedAddress.replace(/\s+/g, ' ').trim();
				
				return cleanedAddress;
			},
			
			// 清理重复的街道信息
			removeDuplicateStreets(address) {
				if (!address) return '';
				
				// 提取所有街道/乡镇信息，包含完整的名称
				const streetPatterns = [
					/([\u4e00-\u9fa5]+街道)/g,
					/([\u4e00-\u9fa5]+镇)/g,
					/([\u4e00-\u9fa5]+乡)/g,
					/([\u4e00-\u9fa5]+办事处)/g
				];
				
				let cleanedAddress = address;
				let foundStreets = [];
				
				// 收集所有街道信息（保持顺序）
				streetPatterns.forEach(pattern => {
					const matches = address.match(pattern);
					if (matches) {
						matches.forEach(match => {
							if (!foundStreets.includes(match)) {
								foundStreets.push(match);
							}
						});
					}
				});
				
				// 对每个找到的街道，移除重复出现的
				foundStreets.forEach(street => {
					const escapedStreet = street.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
					const streetRegex = new RegExp(escapedStreet, 'g');
					const matches = cleanedAddress.match(streetRegex);
					
					if (matches && matches.length > 1) {
						// 保留第一个，移除其他重复的
						let count = 0;
						cleanedAddress = cleanedAddress.replace(streetRegex, (match) => {
							count++;
							return count === 1 ? match : '';
						});
					}
				});
				
				// 清理多余的空格
				cleanedAddress = cleanedAddress.replace(/\s+/g, ' ').trim();
				
				return cleanedAddress;
			},
			
			// 从详细地址中二次提取省市区信息
			extractFromDetailAddress() {
				const detailAddr = this.addressData.detailAddress;
				
				// 省级提取
				if (!this.addressData.province) {
					const provinceReg = /([\u4e00-\u9fa5]{2,3}省|北京市|天津市|上海市|重庆市)/;
					const provinceMatch = detailAddr.match(provinceReg);
					if (provinceMatch && provinceMatch[1]) {
						this.addressData.province = provinceMatch[1];
						if (this.addressData.province.includes('市') && 
							(this.addressData.province.includes('北京') || 
							 this.addressData.province.includes('上海') || 
							 this.addressData.province.includes('天津') || 
							 this.addressData.province.includes('重庆'))) {
							this.addressData.city = this.addressData.province;
						}
					}
				}
				
				// 市级提取
				if (!this.addressData.city) {
					const cityReg = /([\u4e00-\u9fa5]{2,4}市)(?!.*市)/;
					const cityMatch = detailAddr.match(cityReg);
					if (cityMatch && cityMatch[1]) {
						this.addressData.city = cityMatch[1];
					}
				}
				
				// 区/县提取
				if (!this.addressData.region) {
					const regionReg = /([\u4e00-\u9fa5]{2,4}区|[\u4e00-\u9fa5]{2,4}县|[\u4e00-\u9fa5]{2,4}旗)/;
					const regionMatch = detailAddr.match(regionReg);
					if (regionMatch && regionMatch[1]) {
						this.addressData.region = regionMatch[1];
					}
				}
				
				// 清理详细地址，去除已提取的省市区信息
				let newDetailAddr = detailAddr;
				if (this.addressData.province) {
					newDetailAddr = newDetailAddr.replace(this.addressData.province, '');
				}
				if (this.addressData.city) {
					newDetailAddr = newDetailAddr.replace(this.addressData.city, '');
				}
				if (this.addressData.region) {
					newDetailAddr = newDetailAddr.replace(this.addressData.region, '');
				}
				
				this.addressData.detailAddress = newDetailAddr.trim();
			},
			

			
			// 提交地址
			confirm() {
				let data = this.addressData;
				if (!data.name) {
					this.$api.msg('请填写收货人姓名');
					return;
				}
				if (!/(^1[3-9][0-9]{9}$)/.test(data.phoneNumber)) {
					this.$api.msg('请输入正确的手机号码');
					return;
				}
				if (!data.province || !data.city || !data.region) {
					this.$api.msg('请选择所在地区');
					return;
				}
				if (!data.detailAddress) {
					this.$api.msg('请填写详细地址信息');
					return;
				}
				
				// 更新前缀地址
				this.updatePrefixAddress();
				
				if (this.isEdit) {
					updateAddress(this.addressData).then(response => {
						this.loadData();
						this.$api.msg("地址修改成功！");
						this.hideAddForm();
					});
				} else {
					addAddress(this.addressData).then(response => {
						this.loadData();
						this.$api.msg("地址添加成功！");
						this.hideAddForm();
					});
				}
			},
			
			// 添加或修改成功之后回调（兼容其他页面调用）
			refreshList(data, type) {
				this.loadData();
				console.log(data, type);
			}
		}
	}
</script>

<style lang='scss'>
	page {
		background: $page-color-base;
		padding-bottom: 120upx;
	}

	.content {
		position: relative;
	}

	.address-list {
		background: #fff;
		margin-bottom: 16upx;
	}

	.list {
		display: flex;
		align-items: center;
		padding: 20upx 30upx;
		background: #fff;
		position: relative;
	}

	.wrapper {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.address-box {
		display: flex;
		align-items: center;

		.tag {
			font-size: 24upx;
			color: $base-color;
			margin-right: 10upx;
			background: #fffafb;
			border: 1px solid #ffb4c7;
			border-radius: 4upx;
			padding: 4upx 10upx;
			line-height: 1;
		}

		.address {
			font-size: 30upx;
			color: $font-color-dark;
			line-height: 1.4;
		}
	}

	.u-box {
		font-size: 28upx;
		color: $font-color-light;
		margin-top: 16upx;

		.name {
			margin-right: 30upx;
		}
	}

	.icon-bianji, .icon-iconfontshanchu1 {
		display: flex;
		align-items: center;
		height: 80upx;
		font-size: 40upx;
		color: $font-color-light;
		padding-left: 30upx;
	}
	
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 100upx 30upx;
		background: #fff;
		margin-bottom: 16upx;

		.empty-icon {
			width: 200upx;
			height: 200upx;
			margin-bottom: 30upx;
		}

		.empty-text {
			font-size: 32upx;
			color: $font-color-base;
			margin-bottom: 16upx;
		}

		.empty-tips {
			font-size: 28upx;
			color: $font-color-light;
		}
	}

	.add-address-form {
		background: #fff;
		padding-top: 16upx;

		.form-title {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 20upx 30upx;
			border-bottom: 1px solid #f5f5f5;

			.title-text {
				font-size: 36upx;
				color: $font-color-dark;
				font-weight: bold;
			}

			.icon-guanbi {
		font-size: 40upx;
		color: $font-color-light;
			}
		}
	}

	.row {
		display: flex;
		align-items: center;
		position: relative;
		padding: 0 30upx;
		height: 110upx;
		background: #fff;

		.tit {
			flex-shrink: 0;
			width: 150upx;
			font-size: 30upx;
			color: $font-color-dark;
		}

		.input {
			flex: 1;
			font-size: 30upx;
			color: $font-color-dark;
		}

		.icon-you {
			font-size: 36upx;
			color: $font-color-light;
			padding: 0 10upx;
		}
	}

	.default-row {
		margin-top: 16upx;

		.tit {
			flex: 1;
		}

		switch {
			transform: translateX(16upx) scale(.9);
		}
	}

	.paste-section {
		margin-top: 30upx;
		border-top: 1px solid #f5f5f5;
		padding-top: 30upx;

		.paste-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 0 30upx 20upx;

			.paste-title {
				font-size: 32upx;
				color: $font-color-dark;
				font-weight: bold;
			}

			.icon-bangzhu {
				font-size: 36upx;
				color: $base-color;
			}
		}

		.paste-row {
			height: auto;
			min-height: 120upx;
			align-items: flex-start;
			padding-top: 20upx;
			padding-bottom: 20upx;

			.paste-input {
				width: 100%;
				min-height: 80upx;
				max-height: 200upx;
				font-size: 28upx;
				color: $font-color-dark;
				line-height: 1.6;
				background: #f8f8f8;
				border-radius: 8upx;
				padding: 16upx;
				box-sizing: border-box;
			}
		}
	}

	.form-actions {
		display: flex;
		padding: 30upx;
		gap: 20upx;

		.cancel-btn {
			flex: 1;
			height: 80upx;
			font-size: 32upx;
			color: $font-color-base;
			background: #f5f5f5;
			border-radius: 10upx;
			border: none;
		}

		.submit-btn {
			flex: 2;
			height: 80upx;
			font-size: 32upx;
			color: #fff;
			background-color: $base-color;
			border-radius: 10upx;
			border: none;
			box-shadow: 1px 2px 5px rgba(219, 63, 96, 0.4);
		}
	}

	.bottom-actions {
		position: fixed;
		left: 30upx;
		right: 30upx;
		bottom: 16upx;
		z-index: 95;
	}

	.add-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 80upx;
		font-size: 32upx;
		color: #fff;
		background-color: $base-color;
		border-radius: 10upx;
		border: none;
		box-shadow: 1px 2px 5px rgba(219, 63, 96, 0.4);
	}

	.b-b {
		border-bottom: 1px solid #f5f5f5;
	}

	.placeholder {
		color: #ccc;
	}
</style>
