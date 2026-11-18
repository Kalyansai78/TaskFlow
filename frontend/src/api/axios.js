import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:1000/api/v2"
});

// Automatically attach JWT
api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Handle expired or invalid JWT
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            sessionStorage.clear();

            window.location.assign("/signin");
        }

        return Promise.reject(error);
    }
);

export default api;