<template>
	<view class="content">
		<view class="row b-b">
			<text class="tit">姓名</text>
			<input class="input" type="text" v-model="addressData.name" placeholder="收货人姓名" placeholder-class="placeholder" />
		</view>
		<view class="row b-b">
			<text class="tit">手机号码</text>
			<input class="input" type="number" v-model="addressData.phoneNumber" placeholder="收货人手机号码" placeholder-class="placeholder" />
		</view>
		<view class="row b-b">
			<text class="tit">邮政编码</text>
			<input class="input" type="number" v-model="addressData.postCode" placeholder="收货人邮政编码" placeholder-class="placeholder" />
		</view>
		
		<!-- 地址粘贴解析功能 -->
		<view class="row b-b">
			<text class="tit">粘贴地址</text>
			<input class="input" type="text" placeholder="粘贴完整地址自动识别" placeholder-class="placeholder" @input="parseAddress" />
			<text class="yticon icon-bianji" @click="showAddressTips"></text>
		</view>
		
		<!-- 省市区选择 -->
		<view class="row b-b">
			<text class="tit">所在地区</text>
			<picker mode="region" @change="regionChange" :value="[addressData.province, addressData.city, addressData.region]" class="input">
				<view>{{addressData.province || '省'}} {{addressData.city || '市'}} {{addressData.region || '区/县'}}</view>
			</picker>
			<text class="yticon icon-you"></text>
		</view>
		
		<!-- 街道选择 -->
		<view class="row b-b">
			<text class="tit">所在街道</text>
			<input class="input" type="text" v-model="addressData.street" placeholder="街道/乡镇" placeholder-class="placeholder" />
		</view>
		
		<view class="row b-b">
			<text class="tit">详细地址</text>
			<input class="input" type="text" v-model="addressData.detailAddress" placeholder="小区/楼栋/门牌号等" placeholder-class="placeholder" />
		</view>

		<view class="row default-row">
			<text class="tit">设为默认</text>
			<switch :checked="addressData.defaultStatus==1" color="#fa436a" @change="switchChange" />
		</view>
		<button class="add-btn" @click="confirm">提交</button>
	</view>
</template>

<script>
	import {
		addAddress,
		updateAddress,
		fetchAddressDetail
	} from '@/api/address.js';
	export default {
		data() {
			return {
				addressData: {
					name: '',
					phoneNumber: '',
					postCode: '',
					detailAddress: '',
					default: false,
					province: '',
					city: '',
					region: '',
					street: '', // 新增街道字段
					prefixAddress: ''
				}
			}
		},
		onLoad(option) {
			let title = '新增收货地址';
			if (option.type === 'edit') {
				title = '编辑收货地址'
				fetchAddressDetail(option.id).then(response=>{
					this.addressData = response.data;
					// 处理街道信息，如果后端返回的数据没有街道字段，可以从详细地址中提取或留空
					if (!this.addressData.street && this.addressData.detailAddress) {
						// 尝试从详细地址中提取街道信息
						this.tryExtractStreet();
					}
				});
			}
			this.manageType = option.type;
			uni.setNavigationBarTitle({
				title
			})
		},
		methods: {
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
				this.addressData.prefixAddress = this.addressData.province + this.addressData.city + this.addressData.region + (this.addressData.street || '');
			},
			// 地图选择地址
			chooseLocation() {
				uni.chooseLocation({
					success: (data) => {
						this.parseAddress({detail:{value: data.address}});
						// 如果详细地址为空，则使用地图选择的名称
						if (!this.addressData.detailAddress) {
						this.addressData.detailAddress = data.name;
						}
					}
				})
			},
			// 显示地址粘贴提示
			showAddressTips() {
				uni.showModal({
					title: '地址粘贴提示',
					content: '您可以粘贴完整的收货地址，系统将自动识别姓名、手机号和地址信息。\n\n例如：张三 13800138000 浙江省杭州市西湖区文三路100号',
					showCancel: false
				});
			},
			// 解析粘贴的地址
			parseAddress(e) {
				const text = e.detail.value;
				if (!text || text.length < 10) return; // 太短的文本不处理
				
				console.log("解析地址:", text);
				
				// 提取手机号
				const phoneReg = /(1[3-9]\d{9})/;
				const phoneMatch = text.match(phoneReg);
				if (phoneMatch && phoneMatch[1]) {
					this.addressData.phoneNumber = phoneMatch[1];
				}
				
				// 去除手机号后的文本
				let remainText = text.replace(phoneReg, ' ').trim();
				
				// 尝试从格式化的文本中提取信息
				// 例如："收件人: 刘志辉 手机号码: 16607069152 所在地区: 福建省泉州市南安市美林街道 详细地址: 福建南安市金顺达鞋业有限公司"
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
			},
			
			// 智能提取地区信息
			smartExtractRegions(address) {
				// 移除可能存在的标签文本
				address = address.replace(/所在地区[:：\s]+/, ' ')
								 .replace(/详细地址[:：\s]+/, ' ')
								 .replace(/手机号码[:：\s]+/, ' ')
								 .trim();
				
				console.log("提取地区信息:", address);
				
				// 尝试按照标准格式提取地址
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
				
				// 街道/乡镇提取
				const streetReg = /([^区县旗]+街道|.+镇|.+乡)/;
				const streetMatch = address.match(streetReg);
				if (streetMatch && streetMatch[1]) {
					this.addressData.street = streetMatch[1];
					address = address.replace(streetMatch[1], ' ').trim();
				}
				
				// 尝试进行更智能的省市区解析 - 针对"福建省泉州市南安市美林街道"这样紧凑的格式
				if (!this.addressData.province && !this.addressData.city && !this.addressData.region) {
					// 尝试解析完整地址字符串
					const fullAddressReg = /([\u4e00-\u9fa5]{2,3}[省市])([\u4e00-\u9fa5]{2,4}市)([\u4e00-\u9fa5]{2,4}[区县市])([\u4e00-\u9fa5]{2,5}[街道镇乡])?/;
					const fullMatch = address.match(fullAddressReg);
					
					if (fullMatch) {
						this.addressData.province = fullMatch[1];
						this.addressData.city = fullMatch[2];
						this.addressData.region = fullMatch[3];
						if (fullMatch[4]) {
							this.addressData.street = fullMatch[4];
							address = address.replace(fullMatch[0], ' ').trim();
						} else {
							address = address.replace(fullMatch[1] + fullMatch[2] + fullMatch[3], ' ').trim();
						}
					}
				}
				
				// 将剩余内容作为详细地址
				if (address && address.length > 2) {
					// 如果详细地址已有内容，则进行合并
					if (this.addressData.detailAddress && this.addressData.detailAddress.length > 0) {
						if (!this.addressData.detailAddress.includes(address)) {
							this.addressData.detailAddress += ' ' + address;
						}
					} else {
						this.addressData.detailAddress = address;
					}
				}
				
				// 如果没有提取到省市区，但详细地址包含这些信息，尝试二次提取
				if ((!this.addressData.province || !this.addressData.city || !this.addressData.region) && 
					this.addressData.detailAddress && this.addressData.detailAddress.length > 5) {
					this.extractFromDetailAddress();
				}
				
				// 更新前缀地址
				this.updatePrefixAddress();
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
						// 直辖市特殊处理
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
				
				// 更新详细地址
				this.addressData.detailAddress = newDetailAddr.trim();
			},
			// 尝试从详细地址中提取街道信息
			tryExtractStreet() {
				if (!this.addressData.detailAddress) return;
				
				const streetReg = /^(.+街道|.+镇|.+乡)/;
				const streetMatch = this.addressData.detailAddress.match(streetReg);
				if (streetMatch && streetMatch[1]) {
					this.addressData.street = streetMatch[1];
					this.addressData.detailAddress = this.addressData.detailAddress.replace(streetMatch[1], '').trim();
					this.updatePrefixAddress();
				}
			},
			//提交
			confirm() {
				let data = this.addressData;
				if (!data.name) {
					this.$api.msg('请填写收货人姓名');
					return;
				}
				if (!/(^1[3|4|5|7|8|9][0-9]{9}$)/.test(data.phoneNumber)) {
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
				
				if(this.manageType=='edit'){
					updateAddress(this.addressData).then(response=>{
						//this.$api.prePage()获取上一页实例，可直接调用上页所有数据和方法，在App.vue定义
						this.$api.prePage().refreshList(data, this.manageType);
						this.$api.msg("地址修改成功！");
						setTimeout(() => {
							uni.navigateBack()
						}, 800)
					});
				}else{
					addAddress(this.addressData).then(response=>{
						//this.$api.prePage()获取上一页实例，可直接调用上页所有数据和方法，在App.vue定义
						this.$api.prePage().refreshList(data, this.manageType);
						this.$api.msg("地址添加成功！");
						setTimeout(() => {
							uni.navigateBack()
						}, 800)
					});
				}
			},
		}
	}
</script>

<style lang="scss">
	page {
		background: $page-color-base;
		padding-top: 16upx;
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

		.icon-shouhuodizhi, .icon-bianji, .icon-you {
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

	.add-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 690upx;
		height: 80upx;
		margin: 60upx auto;
		font-size: $font-lg;
		color: #fff;
		background-color: $base-color;
		border-radius: 10upx;
		box-shadow: 1px 2px 5px rgba(219, 63, 96, 0.4);
	}
</style>
