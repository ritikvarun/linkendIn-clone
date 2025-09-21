import { createSlice } from "@reduxjs/toolkit";
import {
  getAboutUser,
  loginUser,
  registerUser,
  getAllUserProfiles,
  getMyConnectionsRequests,
  getConnectionsRequest,
} from "../../action/authAction";

const initialState = {
  user: {},
  allUsers: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  loggedIn: false,
  message: false,
  isTokenThere: false,
  profileFetched: false,
  allUsersFetched: false,
  connections: [],
  connectionRequest: [],
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    reset: () => initialState,
    handleLoginUser: (state) => {
      state.message = "hello";
    },
    emptyMessage: (state) => {
      state.message = "";
    },
    setTokenIsThere: (state) => {
      state.isTokenThere = true;
    },
    setTokenIsNotThere: (state) => {
      state.isTokenThere = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.message = "Knocking the door....";
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.loggedIn = true;
        state.message = "Login is Successfull";
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.message = "Register You...";
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.loggedIn = false;
        state.message = {
          message: "Register is Successfull , please Login ",
        };
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getAboutUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.profileFetched = true;
        state.user = action.payload;
      })
      .addCase(getAllUserProfiles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.allUsersFetched = true;
        state.allUsers = action.payload.profiles;
      })
      .addCase(getConnectionsRequest.rejected, (state, action) => {
        state.message = action.payload;
      })
      .addCase(getMyConnectionsRequests.fulfilled, (state, action) => {
        // Endpoint `/user/user_connection_request` returns an array, not { connections }
        state.connectionRequest =
          action.payload?.connections || action.payload || [];
      })
      .addCase(getMyConnectionsRequests.rejected, (state, action) => {
        state.message = action.payload;
      })
      .addCase(getConnectionsRequest.fulfilled, (state, action) => {
        state.connections = action.payload?.connections || [];
      })
      ;
  },
});

export const {
  reset,
  handleLoginUser,
  emptyMessage,
  setTokenIsThere,
  setTokenIsNotThere,
} = authSlice.actions;
export default authSlice.reducer;
