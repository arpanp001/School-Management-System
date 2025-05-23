import { createSlice } from '@reduxjs/toolkit';

const courseSlice = createSlice({
    name: 'courses',
    initialState: {
        courses: [],
        subjects: [],
        assignments: [],
        loading: false,
        error: null
    },
    reducers: {
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setCourses: (state, action) => {
            state.courses = action.payload;
        },
        setSubjects: (state, action) => {
            state.subjects = action.payload;
        },
        setAssignments: (state, action) => {
            state.assignments = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        }
    }
});

export const { setLoading, setCourses, setSubjects, setAssignments, setError } = courseSlice.actions;
export default courseSlice.reducer;