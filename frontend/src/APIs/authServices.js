import api from './axios'
import { USER_ENDPOINTS } from './Routes'

export const loginService = async (credentials) => {
  const { data } = await api.post(USER_ENDPOINTS.LOGIN_USER, credentials)
  return data
}

export const logoutService = async () => {
  const { data } = await api.post(USER_ENDPOINTS.LOGOUT_USER)
  return data
}