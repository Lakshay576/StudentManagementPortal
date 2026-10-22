import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getDashboardSummaryService } from '../APIs/dashboardServices'

const errMsg = (err, fallback) => err.response?.data?.message || fallback

export const fetchDashboardSummary = createAsyncThunk(
  'dashboard/fetchSummary',
  async (_, { rejectWithValue }) => {
    try { return (await getDashboardSummaryService()).data }
    catch (err) { return rejectWithValue(errMsg(err, 'Failed to load dashboard')) }
  }
)

const slice = createSlice({
  name: 'dashboard',
  initialState: {
    summary: null,   // { schools, admins, students, videos }
    loading: false,
    error: null,
  },
  reducers: {
    clearDashboardError: (s) => { s.error = null },
  },
  extraReducers: (b) => {
    b
      .addCase(fetchDashboardSummary.pending, (s) => { s.loading = true; s.error = null })
      .addCase(fetchDashboardSummary.fulfilled, (s, a) => {
        s.loading = false
        s.summary = a.payload
      })
      .addCase(fetchDashboardSummary.rejected, (s, a) => {
        s.loading = false
        s.error = a.payload
      })
  },
})

export const { clearDashboardError } = slice.actions
export default slice.reducer