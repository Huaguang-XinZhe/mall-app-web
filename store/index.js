import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    hasLogin: false,
    userInfo: {},
    inviteCode: "", // 用户的分享邀请码
    inviteFrom: "", // 用户注册时使用的邀请码
  },
  mutations: {
    login(state, provider) {
      state.hasLogin = true;
      state.userInfo = provider;
      uni.setStorage({
        //缓存用户登陆状态
        key: "userInfo",
        data: provider,
      });
      console.log(
        "Vuex login 方法 - 存储用户信息:",
        JSON.stringify(provider).substring(0, 100) + "..."
      );

      // 检查 token 存储状态
      const token = uni.getStorageSync("token");
      if (token) {
        console.log("Vuex login 方法 - 当前 token 存在，长度:", token.length);
        // 确保 token 不包含 Bearer 前缀
        if (token.startsWith("Bearer ")) {
          console.log("Vuex login 方法 - 移除 token 的 Bearer 前缀");
          uni.setStorageSync("token", token.replace("Bearer ", ""));
        }
      } else {
        console.log("Vuex login 方法 - 未找到 token 存储");
      }
    },
    logout(state) {
      state.hasLogin = false;
      state.userInfo = {};
      state.inviteCode = "";
      state.inviteFrom = "";
      uni.removeStorage({
        key: "userInfo",
      });
      uni.removeStorage({
        key: "token",
      });
      uni.removeStorage({
        key: "inviteCode",
      });
    },
    setInviteCode(state, inviteCode) {
      state.inviteCode = inviteCode;
      uni.setStorage({
        key: "inviteCode",
        data: inviteCode,
      });
    },
    setInviteFrom(state, inviteFrom) {
      state.inviteFrom = inviteFrom;
    },
  },
  actions: {},
});

export default store;
