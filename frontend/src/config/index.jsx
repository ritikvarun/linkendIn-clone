import axios from "axios";
export const BASE_URL = "https://linkendin-clone.onrender.com/";
const clintServer = axios.create({
  baseURL: BASE_URL,
});

export default clintServer;
