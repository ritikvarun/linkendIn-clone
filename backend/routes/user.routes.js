import { Router } from "express";
import {
  downloadProfile,
  getUserAndProfile,
  getUserProfile,
  login,
  register,
  updateProfileData,
  getMyConnectionsRequests,
  sendConnetionRequest,
  whatAreMyConnection,
  acceptConnectionRequest,
} from "../controllers/user.controller.js";
import { uploadProfilePicture, updateBackgroundPicture } from "../controllers/user.controller.js";
import { updateUserProfile } from "../controllers/user.controller.js";
import multer from "multer";
import { profilePictureStorage } from "../cloudinary.config.js";
const router = Router();

const upload = multer({ storage: profilePictureStorage });

router
  .route("/update_profile_picture")
  .post(upload.single("profile_picture"), uploadProfilePicture);
router
  .route("/update_background_picture")
  .post(upload.single("background_picture"), updateBackgroundPicture);
router.route("/register").post(register);
router.route("/login").post(login);
router.route("/user_update").post(updateUserProfile);
router.route("/get_user_and_profile").get(getUserAndProfile);
router.route("/update_profile_data").post(updateProfileData);
router.route("/user/get_user_profile").get(getUserProfile);
router.route("/user/download_resume").get(downloadProfile);
router.route("/user/send_connetion_request").post(sendConnetionRequest);
router.route("/user/getConnectionRequests").get(getMyConnectionsRequests);
router.route("/user/user_connection_request").get(whatAreMyConnection);
router.route("/user/accept_connetion_request").post(acceptConnectionRequest);

export default router;
