import api from './axios'
import { DASHBOARD_ROUTES } from './Routes'

export const getDashboardSummaryService = async () => {
  const { data } = await api.get(DASHBOARD_ROUTES.DASHBOARD_SUMMARY)
  return data // { success, data: { schools, admins, students, videos } }
}