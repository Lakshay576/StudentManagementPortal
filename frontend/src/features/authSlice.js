import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { loginService, logoutService } from '../APIs/authServices'
import { updateProfile } from './profileSlice'

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await loginService(credentials) // { email, password, role }
      return data.user
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed')
    }
  }
)

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try { await logoutService() } catch { /* clear client state regardless */ }
})

const slice = createSlice({
  name: 'auth',
  initialState: {
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (s) => { s.error = null },
  },
  extraReducers: (b) => {
    b.addCase(loginUser.pending, (s) => { s.loading = true; s.error = null })
      .addCase(loginUser.fulfilled, (s, a) => {
        s.loading = false
        s.user = a.payload
        localStorage.setItem('user', JSON.stringify(a.payload))
      })
      .addCase(loginUser.rejected, (s, a) => { s.loading = false; s.error = a.payload })
      .addCase(logoutUser.fulfilled, (s) => {
        s.user = null
        localStorage.removeItem('user')
      })
      .addCase(updateProfile.fulfilled, (s, a) => {
        s.user = { ...s.user, ...a.payload }
        localStorage.setItem('user', JSON.stringify(s.user)) // use your USER_KEY if you renamed it
      })
  },
})

export const { clearError } = slice.actions
export default slice.reducer