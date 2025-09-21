import { createAsyncThunk } from "@reduxjs/toolkit";
// import clintServer from "@/config";
import clintServer from "@/config";
export const loginUser = createAsyncThunk(
  "user/login",
  async (user, thunkApi) => {
    try {
      const response = await clintServer.post("/login", {
        email: user.email,
        password: user.password,
      });
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      } else {
        return thunkApi.rejectWithValue({
          message: "token not provided",
        });
      }
      return thunkApi.fulfillWithValue(response.data.token);
    } catch (error) {
      return thunkApi.rejectWithValue(error.response.data);
    }
  }
);

export const registerUser = createAsyncThunk(
  "user/register",
  async (user, thunkApi) => {
    try {
      const response = await clintServer.post("/register", {
        username: user.username,
        password: user.password,
        email: user.email,
        name: user.name,
      });

      return thunkApi.fulfillWithValue(response.data);
    } catch (error) {
      return thunkApi.rejectWithValue(error.response.data);
    }
  }
);

export const getAboutUser = createAsyncThunk(
  "user/getAboutUser",
  async (user, thunkApi) => {
    try {
      const response = await clintServer.get("/get_user_and_profile", {
        params: {
          token: user.token,
        },
      });
      return thunkApi.fulfillWithValue(response.data);
    } catch (error) {
      return thunkApi.rejectWithValue(error.response.data);
    }
  }
);

export const getAllUserProfiles = createAsyncThunk(
  "user/getAllUserProfiles",
  async (_, thunkApi) => {
    try {
      const response = await clintServer.get("/user/get_user_profile");
      return thunkApi.fulfillWithValue(response.data);
    } catch (error) {
      return thunkApi.rejectWithValue(error.response.data);
    }
  }
);
export const sendConnectionRequest = createAsyncThunk(
  "user/sendConnectionRequest",
  async (user, thunkAPI) => {
    try {
      const response = await clintServer.post("/user/send_connetion_request", {
        token: user.token,
        connectionId: user.user_id,
      })
      thunkAPI.dispatch(getConnectionsRequest({token:user.token}))
      return thunkAPI.fulfillWithValue(response.data);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || { message: "Request failed" }
      );
    }
  }
);

export const getConnectionsRequest = createAsyncThunk(
  "user/getConnectionsRequest",
  async (user, thunkApi) => {
    try {
      const response = await clintServer.get("/user/getConnectionRequests", {
        params: {
          token: user.token,
        },
      });
      return thunkApi.fulfillWithValue(response.data);
    } catch (error) {
      return thunkApi.rejectWithValue(error.response.data);
    }
  }
);

export const getMyConnectionsRequests = createAsyncThunk(
  "user/getMyConnectionsRequests",
  async (user, thunkApi) => {
    try {
      const response = await clintServer.get("/user/user_connection_request", {
        params: {
          token: user.token,
        },
      });
      return thunkApi.fulfillWithValue(response.data);
    } catch (error) {
      return thunkApi.rejectWithValue(error.response.data);
    }
  }
);

export const acceptConnection = createAsyncThunk(
  "user/acceptConnection",
  async (user, thunkApi) => {
    try {
      const response = await clintServer.post(
        "/user/accept_connetion_request",
        {
          token: user.token,
          requestId: user.connectionId,
          action_type: user.action,
        }
      );
      thunkApi.dispatch(getConnectionsRequest({token:user.token}));
      thunkApi.dispatch(getMyConnectionsRequests({token:user.token}));
      return thunkApi.fulfillWithValue(response.data);
    } catch (error) {
      return thunkApi.rejectWithValue(error.response.data);
    }
  }
);
