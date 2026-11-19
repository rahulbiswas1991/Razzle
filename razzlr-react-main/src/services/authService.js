import api from "./api";
import { getCookie } from "../utils/cookieUtils";

// Get Facebook App ID
export const getFacebookAppId = async () => {
  return await api.get("/facebook-app-id");
};

// Login with Facebook access token
export const loginWithFacebook = async (accessToken) => {
  const response = await api.post("/login-with-facebook", {
    access_token: accessToken,
  });
  return response;
};

// Get user profile (protected endpoint)
export const getUserProfile = async () => {
  const token = getCookie("access_token");
  try {
    const response = await api.get("/user", {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    });
    return response;
  } catch (error) {
    throw error;
  }
};