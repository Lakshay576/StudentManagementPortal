import api from './axios'
import { PROFILE_ENDPOINTS } from './Routes'

export const getProfileService = async () => (await api.get(PROFILE_ENDPOINTS.PROFILE)).data
export const updateProfileService = async (payload) => (await api.put(PROFILE_ENDPOINTS.PROFILE, payload)).data
export const changePasswordService = async (payload) => (await api.put(PROFILE_ENDPOINTS.CHANGE_PASSWORD, payload)).data