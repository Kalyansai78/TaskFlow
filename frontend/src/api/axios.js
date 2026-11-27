import axios from "axios";

const API_ROOT = (
    import.meta.env.VITE_API_URL || "http://localhost:1000"
).replace(/\/+$/, "");

const createApi = (version) => {
    const instance = axios.create({
        baseURL: `${API_ROOT}/api/${version}`
    });

    instance.interceptors.request.use(
        (config) => {
            const token = sessionStorage.getItem("token");

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            return config;
        },
        (error) => Promise.reject(error)
    );

    instance.interceptors.response.use(
        (response) => response,
        (error) => {
            const isSigninRequest = error.config?.url?.includes("/signin");

            if (error.response?.status === 401 && !isSigninRequest) {
                sessionStorage.removeItem("token");
                sessionStorage.removeItem("id");
                sessionStorage.removeItem("username");
                sessionStorage.removeItem("email");

                window.location.assign("/signin");
            }

            return Promise.reject(error);
        }
    );

    return instance;
};

export const apiV1 = createApi("v1");
export const apiV2 = createApi("v2");
export const apiV3 = createApi("v3");

export default apiV2;