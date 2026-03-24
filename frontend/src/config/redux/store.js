import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./reducer/authReducer/index.js";
import postReducer from "./reducer/postReducer/index.js";
// 1 Steps for state management
// 2 Submit action
// 3 Handle action it's reducer
// 4 Register here reducer

export const store = configureStore({
  reducer: {
    auth: authReducer,
    postReducer:postReducer
  },
});
