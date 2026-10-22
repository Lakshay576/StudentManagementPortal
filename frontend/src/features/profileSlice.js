import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getProfileService, updateProfileService, changePasswordService } from '../APIs/profileServices'

const errMsg = (err, fallback) => err.response?.data?.message || fallback

export const fetchProfile = createAsyncThunk('profile/fetch', async (_, { rejectWithValue }) => {
  try { return (await getProfileService()).data }
  catch (err) { return rejectWithValue(errMsg(err, 'Failed to load profile')) }
})

export const updateProfile = createAsyncThunk('profile/update', async (payload, { rejectWithValue }) => {
  try { return (await updateProfileService(payload)).data }
  catch (err) { return rejectWithValue(errMsg(err, 'Failed to update profile')) }
})

export const changePassword = createAsyncThunk('profile/changePassword', async (payload, { rejectWithValue }) => {
  try { return (await changePasswordService(payload)).message }
  catch (err) { return rejectWithValue(errMsg(err, 'Failed to change password')) }
})

const slice = createSlice({
  name: 'profile',
  initialState: { data: null, loading: false, saving: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchProfile.pending, (s) => { s.loading = true; s.error = null })
      .addCase(fetchProfile.fulfilled, (s, a) => { s.loading = false; s.data = a.payload })
      .addCase(fetchProfile.rejected, (s, a) => { s.loading = false; s.error = a.payload })

      .addCase(updateProfile.pending, (s) => { s.saving = true })
      .addCase(updateProfile.fulfilled, (s, a) => { s.saving = false; s.data = { ...s.data, ...a.payload } })
      .addCase(updateProfile.rejected, (s) => { s.saving = false })

      .addCase(changePassword.pending, (s) => { s.saving = true })
      .addCase(changePassword.fulfilled, (s) => { s.saving = false })
      .addCase(changePassword.rejected, (s) => { s.saving = false })
  },
})

export default slice.reducer