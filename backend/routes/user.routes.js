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
import { uploadProfilePicture } from "../controllers/user.controller.js";
import { updateUserProfile } from "../controllers/user.controller.js";
import multer from "multer";
const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

router
  .route("/update_profile_picture")
  .post(upload.single("profile_picture"), uploadProfilePicture);
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
