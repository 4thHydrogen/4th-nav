import axios from "axios";

export const http = axios.create({});

http.interceptors.request.use((config) => {
    const token = window.localStorage.getItem("_token");
    if (token) {
        config.headers.Authorization = token;
    }
    return config;
});

http.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            window.localStorage.removeItem("_token");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    errorMessage?: string;
}
