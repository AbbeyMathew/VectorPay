import instance, { setAuthToken } from "../api/axios";

export async function register(credentials) {
    const res = await instance.post("/auth/register", credentials);

    const token = res?.data?.token;
    if (token) {
        localStorage.setItem("token", token);
        setAuthToken(token);
        window.dispatchEvent(new Event("auth:changed"));
    }
    return res;
}

export async function login(credentials) {
    const res = await instance.post("/auth/login", credentials);

    const token = res?.data?.token;
    if (token) {
        localStorage.setItem("token", token);
        setAuthToken(token);
        window.dispatchEvent(new Event("auth:changed"));
    }
    return res;
}

export function requestPasswordReset(email) {
    return instance.post("/auth/forgot", { email });
}

export function verifyOtp(email, otp) {
    return instance.post("/auth/verify-otp", { email, otp });
}

export function resetPassword(email, password) {
    return instance.post("/auth/reset", { email, password });
}

export default {
    register,
    login,
    requestPasswordReset,
    verifyOtp,
    resetPassword,
};