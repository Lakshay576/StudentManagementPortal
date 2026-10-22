import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  createStudentService, getStudentsService, getStudentService,
  updateStudentService, deleteStudentService,
} from '../APIs/studentServices'

const errMsg = (err, fallback) => err.response?.data?.message || fallback

export const fetchStudents = createAsyncThunk('students/fetchAll', async (params, { rejectWithValue }) => {
  try { return await getStudentsService(params) }
  catch (err) { return rejectWithValue(errMsg(err, 'Failed to load students')) }
})

export const fetchStudent = createAsyncThunk('students/fetchOne', async (id, { rejectWithValue }) => {
  try { return (await getStudentService(id)).data }
  catch (err) { return rejectWithValue(errMsg(err, 'Failed to load student')) }
})

export const createStudent = createAsyncThunk('students/create', async (payload, { rejectWithValue }) => {
  try { return (await createStudentService(payload)).data }
  catch (err) { return rejectWithValue(errMsg(err, 'Failed to create student')) }
})

export const updateStudent = createAsyncThunk('students/update', async ({ id, payload }, { rejectWithValue }) => {
  try { return (await updateStudentService(id, payload)).data }
  catch (err) { return rejectWithValue(errMsg(err, 'Failed to update student')) }
})

export const deleteStudent = createAsyncThunk('students/delete', async (id, { rejectWithValue }) => {
  try {
    await deleteStudentService(id)
    return id
  } catch (err) { return rejectWithValue(errMsg(err, 'Failed to delete student')) }
})

const slice = createSlice({
  name: 'students',
  initialState: {
    list: [],
    pagination: {},
    total: 0,
    current: null,
    loading: false,  // list
    viewing: false,  // single fetch
    saving: false,   // create / update / delete
    error: null,
  },
  reducers: {
    clearStudentError: (s) => { s.error = null },
    clearCurrentStudent: (s) => { s.current = null },
  },
  extraReducers: (b) => {
    b
      // list
      .addCase(fetchStudents.pending, (s) => { s.loading = true; s.error = null })
      .addCase(fetchStudents.fulfilled, (s, a) => {
        s.loading = false
        s.list = a.payload.data
        s.pagination = a.payload.pagination
        s.total = a.payload.total
      })
      .addCase(fetchStudents.rejected, (s, a) => { s.loading = false; s.error = a.payload })

      // single
      .addCase(fetchStudent.pending, (s) => { s.viewing = true; s.error = null })
      .addCase(fetchStudent.fulfilled, (s, a) => { s.viewing = false; s.current = a.payload })
      .addCase(fetchStudent.rejected, (s, a) => { s.viewing = false; s.error = a.payload })

      // create (the page refetches the list so pagination stays correct)
      .addCase(createStudent.pending, (s) => { s.saving = true })
      .addCase(createStudent.fulfilled, (s) => { s.saving = false })
      .addCase(createStudent.rejected, (s) => { s.saving = false })

      // update
      .addCase(updateStudent.pending, (s) => { s.saving = true })
      .addCase(updateStudent.fulfilled, (s, a) => {
        s.saving = false
        const i = s.list.findIndex((x) => x._id === a.payload._id)
        if (i !== -1) s.list[i] = a.payload
        if (s.current?._id === a.payload._id) s.current = { ...s.current, ...a.payload }
      })
      .addCase(updateStudent.rejected, (s) => { s.saving = false })

      // delete
      .addCase(deleteStudent.pending, (s) => { s.saving = true })
      .addCase(deleteStudent.fulfilled, (s, a) => {
        s.saving = false
        s.list = s.list.filter((x) => x._id !== a.payload)
      })
      .addCase(deleteStudent.rejected, (s) => { s.saving = false })
  },
})

export const { clearStudentError, clearCurrentStudent } = slice.actions
export default slice.reducer