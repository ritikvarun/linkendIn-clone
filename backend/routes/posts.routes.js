import { Router } from "express";
import {
  activeCheck,
  createPost,
  delete_comment_of_user,
  deletePost,
  get_comments_by_post,
  getAllPosts,
  toggle_like,
} from "../controllers/posts.controller.js";
import multer from "multer";
import { commentPost } from "../controllers/user.controller.js";
import { postMediaStorage } from "../cloudinary.config.js";

const router = Router();

const upload = multer({ storage: postMediaStorage });

router.route("/").get(activeCheck);
router.route("/post").post(upload.single("media"), createPost);
router.route("/posts").get(getAllPosts);
router.route("/delete_post").delete(deletePost);
router.route("/comment").post(commentPost);
router.route("/get_comments").get(get_comments_by_post);
router.route("/delete_comment").delete(delete_comment_of_user);
router.route("/toggle_post_like").post(toggle_like);

export default router;
