import { createSlice } from "@reduxjs/toolkit";
import {
  getAllComments,
  getAllPosts,
  postComments,
  togglePostLike,
} from "../../action/postAction";
const initialState = {
  posts: [],
  isError: false,
  postFetched: false,
  isLoading: false,
  loggedIn: false,
  message: "",
  comments: [],
  postId: "",
};

const postSlice = createSlice({
  name: "post",
  initialState,
  reducers: {
    reset: () => initialState,
    resetPostId: (state) => {
      state.postId = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllPosts.pending, (state) => {
        state.isLoading = true;
        state.message = "Fetching all the posts...";
      })
      .addCase(getAllPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.postFetched = true;
        state.posts = action.payload.posts;
      })
      .addCase(getAllPosts.rejected, (state, action) => {
        state.isError = true;
        state.isLoading = false;
        state.message = action.payload;
      })
      .addCase(togglePostLike.fulfilled, (state, action) => {
        // Update the specific post's like count and likedBy status
        const { post_id } = action.meta.arg;
        const post = state.posts.find((p) => p._id === post_id);
        if (post) {
          post.likes = action.payload.likes;
          // You can also update the likedBy array if needed
        }
      })
      .addCase(getAllComments.fulfilled, (state, action) => {
        state.postId = action.payload.post_id;
        state.comments = action.payload.comments;
      })
      .addCase(postComments.fulfilled, (state, action) => {
        // Comment posted successfully, you can add a success message or update UI
        state.message = "Comment posted successfully";
      })
      .addCase(postComments.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload || "Failed to post comment";
      });
  },
});

export const { resetPostId } = postSlice.actions;

export default postSlice.reducer;
