import request from "@/utils/requestUtil";

// 获取用户邀请码
export function fetchInviteCode() {
  return request({
    method: "GET",
    url: "/member/inviteCode",
  });
}

// 生成邀请分享链接
export function generateShareLink(inviteCode) {
  return request({
    method: "GET",
    url: "/member/shareLink",
    params: { inviteCode },
  });
}
