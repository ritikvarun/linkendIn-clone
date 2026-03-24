import clintServer from "@/config";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const getAllPosts = createAsyncThunk(
  "post/getAllPosts",
  async (_, thunkAPI) => {
    try {
      const response = await clintServer.get("/posts");
      return thunkAPI.fulfillWithValue(response.data);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const createPost = createAsyncThunk(
  "post/createPost",
  async (userData, thunkAPI) => {
    const { file, body } = userData;
    try {
      const formData = new FormData();
      formData.append("token", localStorage.getItem("token"));
      formData.append("body", body);
      formData.append("media", file);
      const response = await clintServer.post("/post", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (response.status === 200) {
        return thunkAPI.fulfillWithValue("Post Upload");
      } else {
        return thunkAPI.rejectWithValue("Post not Upload");
      }
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);
export const deletePost = createAsyncThunk(
  "post/deletePost",
  async (post_id, thunkAPI) => {
    try {
      const response = await clintServer.delete("/delete_post", {
        data: {
          token: localStorage.getItem("token"),
          post_id: post_id.post_id,
        },
      });
      return thunkAPI.fulfillWithValue(response.data);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);
export const togglePostLike = createAsyncThunk(
  "post/togglePostLike",
  async (post_id, thunkAPI) => {
    try {
      const response = await clintServer.post("/toggle_post_like", {
        token: localStorage.getItem("token"),
        post_id: post_id.post_id,
      });
      return thunkAPI.fulfillWithValue(response.data);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const getAllComments = createAsyncThunk(
  "post/getAllComments",
  async (postData, thunkAPI) => {
    try {
      const response = await clintServer.get(`/get_comments`, {
        params: { post_id: postData.post_id },
      });
      return thunkAPI.fulfillWithValue({
        comments: response.data,
        post_id: postData.post_id,
      });
    } catch (error) {
      return thunkAPI.rejectWithValue("Somting went wrong");
    }
  }
);

export const postComments = createAsyncThunk(
  "post/postComment",
  async (commentData, thunkAPI) => {
    try {
      console.log({
        post_id: commentData.post_id,
        body: commentData.body,
      });
      const response = await clintServer.post("/comment", {
        token: localStorage.getItem("token"),
        post_id: commentData.post_id,
        comment_text: commentData.body,
      });
      return thunkAPI.fulfillWithValue(response.data);
    } catch (error) {
      return thunkAPI.rejectWithValue("Something went wrong")
    }
  }
);
