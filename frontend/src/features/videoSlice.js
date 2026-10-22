import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  uploadVideoService, getVideosService, getVideoService,
  updateVideoService, deleteVideoService, uploadSchoolVideoService, getSchoolVideosService, getSchoolVideoService,
  updateSchoolVideoService, deleteSchoolVideoService,
} from '../APIs/videoServices'

const errMsg = (err, fallback) => err.response?.data?.message || fallback
const IDLE = { percent: 0, loaded: 0, total: 0, speed: 0, eta: 0 }

export const fetchVideos = createAsyncThunk('videos/fetchAll', async (params, { rejectWithValue }) => {
  try { return await getVideosService(params) }
  catch (err) { return rejectWithValue(errMsg(err, 'Failed to load videos')) }
})

export const fetchVideo = createAsyncThunk('videos/fetchOne', async (id, { rejectWithValue }) => {
  try { return (await getVideoService(id)).data }
  catch (err) { return rejectWithValue(errMsg(err, 'Failed to load video')) }
})

export const uploadVideo = createAsyncThunk(
  'videos/upload',
  async (formData, { dispatch, signal, rejectWithValue }) => {
    let lastTime = Date.now()
    let lastLoaded = 0
    let speed = 0 // bytes/sec, smoothed
    try {
      const res = await uploadVideoService(formData, {
        signal,
        onProgress: (loaded, total) => {
          const now = Date.now()
          const dt = (now - lastTime) / 1000
          if (dt >= 0.5 || loaded === total) {
            const inst = (loaded - lastLoaded) / (dt || 1)
            speed = speed ? speed * 0.7 + inst * 0.3 : inst
            lastTime = now
            lastLoaded = loaded
          }
          dispatch(setProgress({
            loaded, total,
            percent: total ? Math.round((loaded / total) * 100) : 0,
            speed,
            eta: speed > 0 ? Math.ceil((total - loaded) / speed) : 0,
          }))
        },
      })
      return res.data
    } catch (err) {
      if (err.code === 'ERR_CANCELED') return rejectWithValue('Upload cancelled')
      return rejectWithValue(errMsg(err, 'Upload failed'))
    }
  }
)

export const updateVideo = createAsyncThunk('videos/update', async ({ id, payload }, { rejectWithValue }) => {
  try { return (await updateVideoService(id, payload)).data }
  catch (err) { return rejectWithValue(errMsg(err, 'Failed to update video')) }
})

export const deleteVideo = createAsyncThunk('videos/delete', async (id, { rejectWithValue }) => {
  try {
    await deleteVideoService(id)
    return id
  } catch (err) { return rejectWithValue(errMsg(err, 'Failed to delete video')) }
})

// ---------- School Admin ----------
export const fetchSchoolVideos = createAsyncThunk('videos/school/fetchAll', async (params, { rejectWithValue }) => {
  try { return await getSchoolVideosService(params) }
  catch (err) { return rejectWithValue(errMsg(err, 'Failed to load videos')) }
})

export const fetchSchoolVideo = createAsyncThunk('videos/school/fetchOne', async (id, { rejectWithValue }) => {
  try { return (await getSchoolVideoService(id)).data }
  catch (err) { return rejectWithValue(errMsg(err, 'Failed to load video')) }
})

export const uploadSchoolVideo = createAsyncThunk(
  'videos/school/upload',
  async (formData, { dispatch, signal, rejectWithValue }) => {
    let lastTime = Date.now()
    let lastLoaded = 0
    let speed = 0
    try {
      const res = await uploadSchoolVideoService(formData, {
        signal,
        onProgress: (loaded, total) => {
          const now = Date.now()
          const dt = (now - lastTime) / 1000
          if (dt >= 0.5 || loaded === total) {
            const inst = (loaded - lastLoaded) / (dt || 1)
            speed = speed ? speed * 0.7 + inst * 0.3 : inst
            lastTime = now
            lastLoaded = loaded
          }
          dispatch(setProgress({
            loaded, total,
            percent: total ? Math.round((loaded / total) * 100) : 0,
            speed,
            eta: speed > 0 ? Math.ceil((total - loaded) / speed) : 0,
          }))
        },
      })
      return res.data
    } catch (err) {
      if (err.code === 'ERR_CANCELED') return rejectWithValue('Upload cancelled')
      return rejectWithValue(errMsg(err, 'Upload failed'))
    }
  }
)

export const updateSchoolVideo = createAsyncThunk('videos/school/update', async ({ id, payload }, { rejectWithValue }) => {
  try { return (await updateSchoolVideoService(id, payload)).data }
  catch (err) { return rejectWithValue(errMsg(err, 'Failed to update video')) }
})

export const deleteSchoolVideo = createAsyncThunk('videos/school/delete', async (id, { rejectWithValue }) => {
  try {
    await deleteSchoolVideoService(id)
    return id
  } catch (err) { return rejectWithValue(errMsg(err, 'Failed to delete video')) }
})

const slice = createSlice({
  name: 'videos',
  initialState: {
    list: [],
    pagination: {},
    total: 0,
    current: null,
    loading: false,   // list
    viewing: false,   // single fetch
    uploading: false,
    saving: false,    // update / delete
    progress: IDLE,
    error: null,
  },
  reducers: {
    setProgress: (s, a) => { s.progress = a.payload },
    resetProgress: (s) => { s.progress = IDLE },
    clearVideoError: (s) => { s.error = null },
    clearCurrentVideo: (s) => { s.current = null },
  },
 extraReducers: (b) => {
  b
    // ---------- Super Admin: list ----------
    .addCase(fetchVideos.pending, (s) => { s.loading = true; s.error = null })
    .addCase(fetchVideos.fulfilled, (s, a) => {
      s.loading = false
      s.list = a.payload.data
      s.pagination = a.payload.pagination
      s.total = a.payload.total
    })
    .addCase(fetchVideos.rejected, (s, a) => { s.loading = false; s.error = a.payload })

    // ---------- Super Admin: single ----------
    .addCase(fetchVideo.pending, (s) => { s.viewing = true; s.error = null })
    .addCase(fetchVideo.fulfilled, (s, a) => { s.viewing = false; s.current = a.payload })
    .addCase(fetchVideo.rejected, (s, a) => { s.viewing = false; s.error = a.payload })

    // ---------- Super Admin: upload ----------
    .addCase(uploadVideo.pending, (s) => { s.uploading = true; s.progress = IDLE })
    .addCase(uploadVideo.fulfilled, (s) => { s.uploading = false; s.progress = IDLE })
    .addCase(uploadVideo.rejected, (s) => { s.uploading = false; s.progress = IDLE })

    // ---------- Super Admin: update ----------
    .addCase(updateVideo.pending, (s) => { s.saving = true })
    .addCase(updateVideo.fulfilled, (s, a) => {
      s.saving = false
      const i = s.list.findIndex((x) => x._id === a.payload._id)
      if (i !== -1) s.list[i] = a.payload
      if (s.current?._id === a.payload._id) s.current = { ...s.current, ...a.payload }
    })
    .addCase(updateVideo.rejected, (s) => { s.saving = false })

    // ---------- Super Admin: delete ----------
    .addCase(deleteVideo.pending, (s) => { s.saving = true })
    .addCase(deleteVideo.fulfilled, (s, a) => {
      s.saving = false
      s.list = s.list.filter((x) => x._id !== a.payload)
    })
    .addCase(deleteVideo.rejected, (s) => { s.saving = false })

    // ---------- School Admin: list ----------
    .addCase(fetchSchoolVideos.pending, (s) => { s.loading = true; s.error = null })
    .addCase(fetchSchoolVideos.fulfilled, (s, a) => {
      s.loading = false
      s.list = a.payload.data
      s.pagination = a.payload.pagination
      s.total = a.payload.total
    })
    .addCase(fetchSchoolVideos.rejected, (s, a) => { s.loading = false; s.error = a.payload })

    // ---------- School Admin: single ----------
    .addCase(fetchSchoolVideo.pending, (s) => { s.viewing = true; s.error = null })
    .addCase(fetchSchoolVideo.fulfilled, (s, a) => { s.viewing = false; s.current = a.payload })
    .addCase(fetchSchoolVideo.rejected, (s, a) => { s.viewing = false; s.error = a.payload })

    // ---------- School Admin: upload ----------
    .addCase(uploadSchoolVideo.pending, (s) => { s.uploading = true; s.progress = IDLE })
    .addCase(uploadSchoolVideo.fulfilled, (s) => { s.uploading = false; s.progress = IDLE })
    .addCase(uploadSchoolVideo.rejected, (s) => { s.uploading = false; s.progress = IDLE })

    // ---------- School Admin: update ----------
    .addCase(updateSchoolVideo.pending, (s) => { s.saving = true })
    .addCase(updateSchoolVideo.fulfilled, (s, a) => {
      s.saving = false
      const i = s.list.findIndex((x) => x._id === a.payload._id)
      // merge so isOwn (not in the update response) is kept
      if (i !== -1) s.list[i] = { ...s.list[i], ...a.payload }
      if (s.current?._id === a.payload._id) s.current = { ...s.current, ...a.payload }
    })
    .addCase(updateSchoolVideo.rejected, (s) => { s.saving = false })

    // ---------- School Admin: delete ----------
    .addCase(deleteSchoolVideo.pending, (s) => { s.saving = true })
    .addCase(deleteSchoolVideo.fulfilled, (s, a) => {
      s.saving = false
      s.list = s.list.filter((x) => x._id !== a.payload)
    })
    .addCase(deleteSchoolVideo.rejected, (s) => { s.saving = false })
},
})

export const { setProgress, resetProgress, clearVideoError, clearCurrentVideo } = slice.actions
export default slice.reducer