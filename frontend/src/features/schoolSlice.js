import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  createSchoolService,
  getSchoolsService,
  getSchoolService,
  updateSchoolService,
  deleteSchoolService,
  createAdminService, toggleAdminStatusService,
} from '../APIs/schoolServices'

const errMsg = (err, fallback) => err.response?.data?.message || fallback

export const fetchSchools = createAsyncThunk('schools/fetchAll', async (params, { rejectWithValue }) => {
  try { return await getSchoolsService(params) }
  catch (err) { return rejectWithValue(errMsg(err, 'Failed to load schools')) }
})

export const fetchSchool = createAsyncThunk('schools/fetchOne', async (id, { rejectWithValue }) => {
  try { return (await getSchoolService(id)).data }
  catch (err) { return rejectWithValue(errMsg(err, 'Failed to load school')) }
})

export const createSchool = createAsyncThunk('schools/create', async (payload, { rejectWithValue }) => {
  try { return (await createSchoolService(payload)).data }
  catch (err) { return rejectWithValue(errMsg(err, 'Failed to create school')) }
})

export const updateSchool = createAsyncThunk('schools/update', async ({ id, payload }, { rejectWithValue }) => {
  try { return (await updateSchoolService(id, payload)).data }
  catch (err) { return rejectWithValue(errMsg(err, 'Failed to update school')) }
})

export const deleteSchool = createAsyncThunk('schools/delete', async (id, { rejectWithValue }) => {
  try {
    await deleteSchoolService(id)
    return id
  } catch (err) { return rejectWithValue(errMsg(err, 'Failed to delete school')) }
})

export const createAdmin = createAsyncThunk('schools/createAdmin', async (payload, { rejectWithValue }) => {
  try { return (await createAdminService(payload)).data }
  catch (err) { return rejectWithValue(errMsg(err, 'Failed to create admin')) }
})

export const toggleAdminStatus = createAsyncThunk('schools/toggleAdmin', async (id, { rejectWithValue }) => {
  try { return (await toggleAdminStatusService(id)).data }
  catch (err) { return rejectWithValue(errMsg(err, 'Failed to update admin status')) }
})

const slice = createSlice({
  name: 'schools',
  initialState: {
    list: [],
    pagination: {},
    current: null,      // single school (with admins)
    loading: false,     // list 
    loading2: false,    // single school
    saving: false,      // create / update / delete
    error: null,
    error2: null,
    adminSaving: false,
    togglingId: null,
  },
  reducers: {
    clearSchoolError: (s) => { s.error = null },
    clearSingleError: (s) => { s.error2 = null },
    clearCurrent: (s) => { s.current = null },
  },
  extraReducers: (b) => {
    b
      // list
      .addCase(fetchSchools.pending, (s) => { s.loading = true; s.error = null })
      .addCase(fetchSchools.fulfilled, (s, a) => {
        s.loading = false
        s.list = a.payload.data
        s.pagination = a.payload.pagination
      })
      .addCase(fetchSchools.rejected, (s, a) => { s.loading = false; s.error = a.payload })

      // single
      .addCase(fetchSchool.pending, (s) => { s.loading2 = true; s.error = null })
      .addCase(fetchSchool.fulfilled, (s, a) => { s.loading2 = false; s.current = a.payload })
      .addCase(fetchSchool.rejected, (s, a) => { s.loading2 = false; s.error = a.payload })

      // create
      .addCase(createSchool.pending, (s) => { s.saving = true; s.error2 = null })
      .addCase(createSchool.fulfilled, (s, a) => { s.saving = false; s.list.unshift(a.payload) })
      .addCase(createSchool.rejected, (s, a) => { s.saving = false; s.error2 = a.payload })

      // update
      .addCase(updateSchool.pending, (s) => { s.saving = true; s.error2 = null })
      .addCase(updateSchool.fulfilled, (s, a) => {
        s.saving = false
        const i = s.list.findIndex((x) => x._id === a.payload._id)
        if (i !== -1) s.list[i] = a.payload
        if (s.current?._id === a.payload._id) s.current = { ...s.current, ...a.payload }
      })
      .addCase(updateSchool.rejected, (s, a) => { s.saving = false; s.error2 = a.payload })

      // delete
      .addCase(deleteSchool.pending, (s) => { s.saving = true; s.error2 = null })
      .addCase(deleteSchool.fulfilled, (s, a) => {
        s.saving = false
        s.list = s.list.filter((x) => x._id !== a.payload)
      })
      .addCase(deleteSchool.rejected, (s, a) => { s.saving = false; s.error2 = a.payload })

      // create admin
        .addCase(createAdmin.pending, (s) => { s.adminSaving = true })
        .addCase(createAdmin.fulfilled, (s, a) => {
        s.adminSaving = false
        const { schoolId, phone } = a.meta.arg
        if (s.current?._id === schoolId) {
            s.current.admins = [
            ...(s.current.admins || []),
            { _id: a.payload.id, name: a.payload.name, email: a.payload.email, phone, schoolId, status: 'Active', profileImage: '' },
            ]
        }
        })
        .addCase(createAdmin.rejected, (s) => { s.adminSaving = false })

        // toggle admin
        .addCase(toggleAdminStatus.pending, (s, a) => { s.togglingId = a.meta.arg })
        .addCase(toggleAdminStatus.fulfilled, (s, a) => {
        s.togglingId = null
        const adm = s.current?.admins?.find((x) => x._id === a.payload.id)
        if (adm) adm.status = a.payload.status
        })
        .addCase(toggleAdminStatus.rejected, (s) => { s.togglingId = null })
  },
})

export const { clearSchoolError, clearSingleError, clearCurrent } = slice.actions
export default slice.reducer