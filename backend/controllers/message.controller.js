import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import ConnectionRequest from "../models/connection.model.js";

// Get inbox — last message + unread count per conversation
export const getInbox = async (req, res) => {
  try {
    const { token } = req.query;
    const user = await User.findOne({ token });
    if (!user) return res.status(404).json({ message: "User not found" });

    const allMsgs = await Message.find({
      $or: [{ senderId: user._id }, { receiverId: user._id }],
    }).sort({ createdAt: -1 });

    const partnerMap = new Map();
    allMsgs.forEach((msg) => {
      const partnerId =
        String(msg.senderId) === String(user._id)
          ? String(msg.receiverId)
          : String(msg.senderId);

      if (!partnerMap.has(partnerId)) {
        partnerMap.set(partnerId, {
          partnerId,
          lastMessage: msg.message,
          lastMessageTime: msg.createdAt,
          unreadCount: 0,
          isMine: String(msg.senderId) === String(user._id),
        });
      }
      // Count unseen messages from this partner
      if (String(msg.receiverId) === String(user._id) && !msg.seen) {
        partnerMap.get(partnerId).unreadCount += 1;
      }
    });

    return res.json({ inbox: Array.from(partnerMap.values()) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get chat history between two users
export const getMessages = async (req, res) => {
  try {
    const { token } = req.query;
    const { otherUserId } = req.params;

    const me = await User.findOne({ token });
    if (!me) return res.status(404).json({ message: "User not found" });

    // Check if they are connected
    const connection = await ConnectionRequest.findOne({
      status_accepted: true,
      $or: [
        { userId: me._id, connectionId: otherUserId },
        { userId: otherUserId, connectionId: me._id },
      ],
    });
    if (!connection)
      return res.status(403).json({ message: "You are not connected with this user" });

    const messages = await Message.find({
      $or: [
        { senderId: me._id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: me._id },
      ],
    }).sort({ createdAt: 1 });

    return res.json({ messages, myId: me._id });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Save message to DB (called from socket handler)
export const saveMessage = async ({ token, receiverId, message }) => {
  const sender = await User.findOne({ token });
  if (!sender) return null;

  const newMessage = new Message({
    senderId: sender._id,
    receiverId,
    message,
  });
  await newMessage.save();

  return {
    _id: newMessage._id,
    senderId: sender._id,
    receiverId,
    message,
    createdAt: newMessage.createdAt,
  };
};
