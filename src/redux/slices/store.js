import { configureStore } from '@reduxjs/toolkit';
import courseReducer from '../../redux/slices/courseSlice';
const store = configureStore({
    reducer: {
        courses: courseReducer,
    }
});

export default store;