import axios from "axios";
import { Cookies } from "react-cookie";
import { myHistory } from "../routes/history";
import { store } from "../store";
import { actionRemoveUserInfo } from "../store/actions/userInfoAction";
import { renewToken } from "./user.api";

export const baseURL =
  process.env.REACT_APP_HOST_BASE + "/api/" || "http://localhost:3002/api/";

const instance = axios.create({ baseURL });
const cookies = new Cookies();

instance.interceptors.request.use((config) => {
  const auth = cookies.get("u_auth");
  if (auth) {
    config.headers["Authorization"] = `Bearer ${auth.accessToken}`;
    return config;
  }
  return config;
});

instance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (err) => {
    const originalConfig = err.config;
    if (err.response)
      if (err.response?.status === 403) {
        store.dispatch(actionRemoveUserInfo());
        cookies.remove("u_auth", { path: "/" });
        window.location.reload();
      }
    if (err.response?.status === 401) {
      const res = await renewToken();
      const accessToken = res.data;
      cookies.set(
        "u_auth",
        { ...cookies.get("u_auth"), accessToken },
        { path: "/" }
      );
      return instance(originalConfig);
    }
    return Promise.reject(err);
  }
);

export default instance;
