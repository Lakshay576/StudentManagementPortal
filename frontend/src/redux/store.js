import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/authSlice'
import schoolReducer from "../features/schoolSlice"
import profileReducer from "../features/profileSlice"
import videoReducer from "../features/videoSlice"
import dashboardReducer from "../features/dashboardSlice"
import studentsReducer from "../features/studentSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    schools: schoolReducer,
    profile: profileReducer,
    videos: videoReducer,
    dashboard: dashboardReducer,
    students: studentsReducer
  },
})

export default store