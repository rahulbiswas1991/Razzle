import api from './api';
import { getCookie } from '../utils/cookieUtils';

export const fetchUserProfileApi = async () => {
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
