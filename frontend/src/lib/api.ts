import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api"
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || "Unknown error";
    console.error(`[API Error] ${error.config.url}:`, message);
    // You could trigger a toast here if a toast library was available
    return Promise.reject(error);
  }
);

