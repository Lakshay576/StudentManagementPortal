export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const USER_ENDPOINTS = {
  LOGIN_USER: `${API_BASE_URL}/auth/login`,
  LOGOUT_USER: `${API_BASE_URL}/auth/logout`,
}


export const SCHOOL_ENDPOINTS = {
  CREATE_SCHOOL: `${API_BASE_URL}/schools/create-school`,
  GET_SCHOOLS: `${API_BASE_URL}/schools/get-schools`,
  GET_SCHOOL: `${API_BASE_URL}/schools/single-school`,     // /:id
  UPDATE_SCHOOL: `${API_BASE_URL}/schools/update-school`,  // /:id
  DELETE_SCHOOL: `${API_BASE_URL}/schools/delete-school`,  // /:id
}

export const ADMIN_ENDPOINTS = {
  CREATE_ADMIN: `${API_BASE_URL}/users/create-admin`,
  TOGGLE_ADMIN_STATUS: `${API_BASE_URL}/users/toggle-status`, // /:id
}


export const PROFILE_ENDPOINTS = {
  PROFILE: `${API_BASE_URL}/users/profile`,
  CHANGE_PASSWORD: `${API_BASE_URL}/users/change-password`,
}


export const VIDEO_ENDPOINTS = {
  UPLOAD_VIDEO: `${API_BASE_URL}/videos/upload`,
  GET_VIDEOS: `${API_BASE_URL}/videos/get-videos`,
  GET_VIDEO: `${API_BASE_URL}/videos/single-video`,     // /:id
  UPDATE_VIDEO: `${API_BASE_URL}/videos/update-video`,  // /:id
  DELETE_VIDEO: `${API_BASE_URL}/videos/delete-video`,  // /:id
}

export const DASHBOARD_ROUTES = {
  DASHBOARD_SUMMARY: `${API_BASE_URL}/dashboard/summary`,
}


export const STUDENT_ENDPOINTS = {
  CREATE_STUDENT: `${API_BASE_URL}/students/create-student`,
  GET_STUDENTS: `${API_BASE_URL}/students/get-students`,
  GET_STUDENT: `${API_BASE_URL}/students/single-student`,     // /:id
  UPDATE_STUDENT: `${API_BASE_URL}/students/update-student`,  // /:id
  DELETE_STUDENT: `${API_BASE_URL}/students/delete-student`,  // /:id
}

export const SCHOOL_VIDEO_ENDPOINTS = {
  UPLOAD_VIDEO: `${API_BASE_URL}/videos/school/upload`,
  GET_VIDEOS: `${API_BASE_URL}/videos/school/get-videos`,
  GET_VIDEO: `${API_BASE_URL}/videos/school/single-video`,     // /:id
  UPDATE_VIDEO: `${API_BASE_URL}/videos/school/update-video`,  // /:id
  DELETE_VIDEO: `${API_BASE_URL}/videos/school/delete-video`,  // /:id
}