import api from './axios'
import { STUDENT_ENDPOINTS } from './Routes'

export const createStudentService = async (payload) => {
  const { data } = await api.post(STUDENT_ENDPOINTS.CREATE_STUDENT, payload)
  return data
}

export const getStudentsService = async (params) => {
  const { data } = await api.get(STUDENT_ENDPOINTS.GET_STUDENTS, { params }) // page, limit, search, className, section, status
  return data
}

export const getStudentService = async (id) => {
  const { data } = await api.get(`${STUDENT_ENDPOINTS.GET_STUDENT}/${id}`)
  return data
}

export const updateStudentService = async (id, payload) => {
  const { data } = await api.put(`${STUDENT_ENDPOINTS.UPDATE_STUDENT}/${id}`, payload)
  return data
}

export const deleteStudentService = async (id) => {
  const { data } = await api.delete(`${STUDENT_ENDPOINTS.DELETE_STUDENT}/${id}`)
  return data
}