import api from './axios'
import { VIDEO_ENDPOINTS, SCHOOL_VIDEO_ENDPOINTS } from './Routes'

export const uploadVideoService = async (formData, { onProgress, signal } = {}) => {
  const { data } = await api.post(VIDEO_ENDPOINTS.UPLOAD_VIDEO, formData, {
    onUploadProgress: (e) => onProgress?.(e.loaded, e.total), // no manual Content-Type
    signal,
    timeout: 0, // large files
  })
  return data
}

export const getVideosService = async (params) => {
  const { data } = await api.get(VIDEO_ENDPOINTS.GET_VIDEOS, { params }) // page, limit, search, status, schoolId
  return data
}

export const getVideoService = async (id) => {
  const { data } = await api.get(`${VIDEO_ENDPOINTS.GET_VIDEO}/${id}`)
  return data
}

export const updateVideoService = async (id, payload) => {
  const { data } = await api.put(`${VIDEO_ENDPOINTS.UPDATE_VIDEO}/${id}`, payload)
  return data
}

export const deleteVideoService = async (id) => {
  const { data } = await api.delete(`${VIDEO_ENDPOINTS.DELETE_VIDEO}/${id}`)
  return data
}

//SCHOOL ADMIN VIDEO SERVICES
export const uploadSchoolVideoService = async (formData, { onProgress, signal } = {}) => {
  const { data } = await api.post(SCHOOL_VIDEO_ENDPOINTS.UPLOAD_VIDEO, formData, {
    onUploadProgress: (e) => onProgress?.(e.loaded, e.total),
    signal,
    timeout: 0,
  })
  return data
}

export const getSchoolVideosService = async (params) => {
  const { data } = await api.get(SCHOOL_VIDEO_ENDPOINTS.GET_VIDEOS, { params }) // page, limit, search, status, source
  return data
}

export const getSchoolVideoService = async (id) => {
  const { data } = await api.get(`${SCHOOL_VIDEO_ENDPOINTS.GET_VIDEO}/${id}`)
  return data
}

export const updateSchoolVideoService = async (id, payload) => {
  const { data } = await api.put(`${SCHOOL_VIDEO_ENDPOINTS.UPDATE_VIDEO}/${id}`, payload)
  return data
}

export const deleteSchoolVideoService = async (id) => {
  const { data } = await api.delete(`${SCHOOL_VIDEO_ENDPOINTS.DELETE_VIDEO}/${id}`)
  return data
}