import Axios from "axios";
import { ElMessage } from "element-plus";
function getTimestamp() {
  return Axios.request({
    baseURL: import.meta.env.VITE_FILE,
    url: "/common/getTimestamp",
    method: "post"
  });
}

const Common = {
  getUserInfo() {
    return {
      operatorId: "319390",
      operatorName: "杨增勋",
      userId: "6c7057467444384f346944576968664b582b486436513d3d",
      userName: "杨增勋",
      userImg: "avatar/2024/02/26/275fd667-37b0-4452-8acd-c5901d95904d.jpg",
      agentOrWriter: 2
    };
  }
};

const requestParams = {
  appKey: "quandashi4940841937",
  signMethod: "md5",
  executor: Common.getUserInfo().userId
};

const axios = Axios.create({
  baseURL: import.meta.env.VITE_FILE,
  timeout: 30000
});

axios.interceptors.request.use(
  async config => {
    config.data = { ...requestParams, ...config.data };
    config.data.timestamp = (await getTimestamp()).data.data.timestamp;
    config.data.sign =
      new Date().getTime() + "" + Math.floor(Math.random() * 10000 + 1);
    config.headers["client"] = "v2";
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  res => {
    if (res.data.code == 9091 && res.data.subCode == 10002) {
      return res.data;
    } else if (res.data.subCode == 10004) {
      return (window.location.href = `${process.env.VUE_APP_LOGIN_QDS}/?callback=${window.location.href}`);
    } else {
      ElMessage.error(res.data.subElMessage || "系统错误,请稍后重试");
      return Promise.reject(new Error(res.data.subElMessage));
    }
  },
  error => {
    console.log(error, "eee");
    if (error.ElMessage.includes("timeout")) {
      ElMessage.error("网络超时,请稍后重试");
    }
    return Promise.reject(error);
  }
);

export async function getData(data, url, method, tips) {
  const res = await axios({
    url,
    method,
    data
  });
  if (res.subCode === 10002 && res.code === 9091) {
    if (tips) {
      ElMessage.success(`${tips}成功！`);
    }
    return res.data;
  } else {
    ElMessage.error(res.subMessage);
    throw res.subMessage;
  }
}
export default getData;
