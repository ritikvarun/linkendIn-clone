import { Router } from "express";
import { getMessages, getInbox } from "../controllers/message.controller.js";

const router = Router();

router.route("/messages/inbox").get(getInbox);
router.route("/messages/:otherUserId").get(getMessages);

export default router;
