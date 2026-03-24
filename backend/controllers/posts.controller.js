import Profile from "../models/profile.model.js";
import Post from "../models/posts.model.js";
import User from "../models/user.model.js";
import Comment from "../models/comments.model.js";

import bcrypt from "bcrypt";

export const activeCheck = async (req, res) => {
  return res.status(200).json({ message: "RUNNING" });
};

export const createPost = async (req, res) => {
  const { token } = req.body;
  try {
    const user = await User.findOne({ token: token });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const post = Post({
      userId: user._id,
      body: req.body.body,
      media: req.file != undefined ? req.file.filename : "",
      fileType: req.file != undefined ? req.file.mimetype.split("/")[1] : "",
    });
    await post.save();
    return res.status(200).json({ message: "Post Created" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createAt: -1 })
      .populate("userId", "name username email profilePicture")
      .populate("likedBy", "_id");
    return res.json({ posts });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deletePost = async (req, res) => {
  const { token, post_id } = req.body;
  try {
    const user = await User.findOne({ token: token }).select("_id");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const post = await Post.findOne({ _id: post_id });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (post.userId.toString() !== user._id.toString()) {
      return res.status(404).json({ message: "Unauthorized" });
    }
    await Post.deleteOne({ _id: post_id });
    return res.json({ message: "Post Deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const get_comments_by_post = async (req, res) => {
  const { post_id } = req.query;
  try {
    const post = await Post.findOne({ _id: post_id });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const comments = await Comment.find({ postId: post_id })
      .populate("userId", "name username profilePicture")
      .sort({ createdAt: -1 });
    return res.json(comments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
export const delete_comment_of_user = async (req, res) => {
  const { token, comment_id } = req.body;
  try {
    const user = await User.findOne({ token: token }).select("_id");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const comment = await Comment.findOne({ _id: comment_id });
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    if (comment.userId.toString() !== user._id.toString()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    await Comment.deleteOne({ _id: comment_id });
    return res.json({ message: "Comment Deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const toggle_like = async (req, res) => {
  const { post_id, token } = req.body;
  try {
    const user = await User.findOne({ token: token }).select("_id");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const post = await Post.findOne({ _id: post_id });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const userLiked = post.likedBy.includes(user._id);

    if (userLiked) {
      // User already liked, so unlike
      post.likedBy = post.likedBy.filter(
        (id) => id.toString() !== user._id.toString()
      );
      post.likes = Math.max(0, post.likes - 1);
    } else {
      // User hasn't liked, so like
      post.likedBy.push(user._id);
      post.likes = post.likes + 1;
    }

    await post.save();

    return res.json({
      message: userLiked ? "Post Unliked" : "Post Liked",
      likes: post.likes,
      isLiked: !userLiked,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
