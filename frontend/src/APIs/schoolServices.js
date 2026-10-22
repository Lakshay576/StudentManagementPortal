import api from './axios'
import {  SCHOOL_ENDPOINTS, ADMIN_ENDPOINTS  } from './Routes'

export const createSchoolService = async (payload) => {
  const { data } = await api.post(SCHOOL_ENDPOINTS.CREATE_SCHOOL, payload)
  return data
}

export const getSchoolsService = async (params) => {
  const { data } = await api.get(SCHOOL_ENDPOINTS.GET_SCHOOLS, { params })
  return data
}

export const getSchoolService = async (id) => {
  const { data } = await api.get(`${SCHOOL_ENDPOINTS.GET_SCHOOL}/${id}`)
  return data
}

export const updateSchoolService = async (id, payload) => {
  const { data } = await api.put(`${SCHOOL_ENDPOINTS.UPDATE_SCHOOL}/${id}`, payload)
  return data
}

export const deleteSchoolService = async (id) => {
  const { data } = await api.delete(`${SCHOOL_ENDPOINTS.DELETE_SCHOOL}/${id}`)
  return data
}

export const createAdminService = async (payload) => {
  const { data } = await api.post(ADMIN_ENDPOINTS.CREATE_ADMIN, payload)
  return data
}

export const toggleAdminStatusService = async (id) => {
  const { data } = await api.put(`${ADMIN_ENDPOINTS.TOGGLE_ADMIN_STATUS}/${id}`)
  return data
}