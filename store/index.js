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

      // 从用户信息中获取邀请码
      if (provider.invite_code) {
        console.log(
          "Vuex login 方法 - 从用户信息中获取邀请码:",
          provider.invite_code
        );
        state.inviteCode = provider.invite_code;
        uni.setStorageSync("inviteCode", provider.invite_code);
      } else {
        // 如果用户信息中没有邀请码，尝试从本地存储恢复
        const storedInviteCode = uni.getStorageSync("inviteCode");
        if (storedInviteCode) {
          console.log(
            "Vuex login 方法 - 从本地存储恢复邀请码:",
            storedInviteCode
          );
          state.inviteCode = storedInviteCode;
        }
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
      console.log("Vuex setInviteCode 方法 - 存储邀请码:", inviteCode);
    },
    setInviteFrom(state, inviteFrom) {
      state.inviteFrom = inviteFrom;
    },
  },
  actions: {},
});

export default store;
