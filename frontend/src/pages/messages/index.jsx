import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import UserLayout from "@/layout/UserLayout";
import DashboardLayout from "@/layout/DashboardLayout";
import {
  getMyConnectionsRequests,
  getConnectionsRequest,
} from "@/config/redux/action/authAction";
import clintServer, { BASE_URL } from "@/config";
import { io } from "socket.io-client";
import styles from "./style.module.css";

const getImageUrl = (path) => {
  if (!path || path === "default.jpg") return "/default.jpg";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BASE_URL}/${path}`;
};

let socket;

const MessagesPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const authState = useSelector((state) => state.auth);

  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [myId, setMyId] = useState(null);
  const [input, setInput] = useState("");
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Build connected users list
  useEffect(() => {
    const token = localStorage.getItem("token");
    dispatch(getMyConnectionsRequests({ token }));
    dispatch(getConnectionsRequest({ token }));
  }, [dispatch]);

  useEffect(() => {
    const incoming = (authState.connectionRequest || []).filter(
      (c) => c.status_accepted === true
    );
    const outgoing = (authState.connections || []).filter(
      (c) => c.status_accepted === true
    );

    const map = new Map();
    [...incoming, ...outgoing].forEach((item) => {
      // incoming: userId = other person (populated), outgoing: connectionId = other person
      const other = (item.userId && item.userId.name) ? item.userId : item.connectionId;
      if (other && other._id && !map.has(other._id)) {
        map.set(other._id, other);
      }
    });
    setConnectedUsers(Array.from(map.values()));
  }, [authState.connectionRequest, authState.connections]);

  // Setup Socket.io
  useEffect(() => {
    if (!token) return;

    // Remove trailing slash for socket.io
    const socketUrl = BASE_URL.replace(/\/$/, "");
    socket = io(socketUrl, {
      transports: ["polling", "websocket"], // polling first — works on Render free tier
    });

    socket.on("connect", () => {
      if (authState.user?.userId?._id) {
        socket.emit("register", authState.user.userId._id);
        setMyId(authState.user.userId._id);
      }
    });

    socket.on("newMessage", (msg) => {
      setMessages((prev) => {
        if (prev.find((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [token, authState.user?.userId?._id]);

  // Re-register if socket already connected but userId just loaded
  useEffect(() => {
    if (socket && socket.connected && authState.user?.userId?._id) {
      socket.emit("register", authState.user.userId._id);
      setMyId(authState.user.userId._id);
    }
  }, [authState.user?.userId?._id]);

  // Fetch chat history when user selected
  useEffect(() => {
    if (!selectedUser || !token) return;
    setIsLoading(true);
    clintServer
      .get(`/messages/${selectedUser._id}`, { params: { token } })
      .then((res) => {
        setMessages(res.data.messages || []);
        setMyId(res.data.myId);
      })
      .catch(() => setMessages([]))
      .finally(() => setIsLoading(false));
  }, [selectedUser]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !selectedUser || !socket) return;
    socket.emit("sendMessage", {
      token,
      receiverId: selectedUser._id,
      message: input.trim(),
    });
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <UserLayout>
      <DashboardLayout>
        <div className={styles.container}>
          {/* Left Panel - Connections List */}
          <div className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <h2 className={styles.sidebarTitle}>Messages</h2>
              <span className={styles.connectionCount}>{connectedUsers.length}</span>
            </div>
            <div className={styles.userList}>
              {connectedUsers.length === 0 && (
                <div className={styles.emptyConnections}>
                  <div className={styles.emptyIcon}>💬</div>
                  <p>Koi connection nahi mila</p>
                  <small>Pehle kisi se connect karo</small>
                </div>
              )}
              {connectedUsers.map((user) => (
                <div
                  key={user._id}
                  className={`${styles.userItem} ${
                    selectedUser?._id === user._id ? styles.userItemActive : ""
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className={styles.avatarWrapper}>
                    <img
                      src={getImageUrl(user.profilePicture)}
                      alt={user.name}
                      className={styles.avatar}
                    />
                    <span className={styles.onlineDot} />
                  </div>
                  <div className={styles.userInfo}>
                    <p className={styles.userName}>{user.name}</p>
                    <p className={styles.userHandle}>@{user.username}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Chat Window */}
          <div className={styles.chatPanel}>
            {!selectedUser ? (
              <div className={styles.noChatSelected}>
                <div className={styles.noChatIcon}>✉️</div>
                <h3>Koi conversation select karo</h3>
                <p>Left side se kisi connection ke saath baat karo</p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className={styles.chatHeader}>
                  <div className={styles.chatHeaderLeft}>
                    <img
                      src={getImageUrl(selectedUser.profilePicture)}
                      alt={selectedUser.name}
                      className={styles.chatAvatar}
                    />
                    <div>
                      <p className={styles.chatUserName}>{selectedUser.name}</p>
                      <p className={styles.chatUserStatus}>● Online</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className={styles.messagesArea}>
                  {isLoading && (
                    <div className={styles.loadingMessages}>Loading messages...</div>
                  )}
                  {!isLoading && messages.length === 0 && (
                    <div className={styles.noMessages}>
                      <p>👋 {selectedUser.name} ko pehla message bhejo!</p>
                    </div>
                  )}
                  {messages.map((msg, i) => {
                    const isMine = String(msg.senderId) === String(myId);
                    return (
                      <div
                        key={msg._id || i}
                        className={`${styles.messageBubbleWrapper} ${
                          isMine ? styles.myMessage : styles.theirMessage
                        }`}
                      >
                        <div className={styles.messageBubble}>
                          <p className={styles.messageText}>{msg.message}</p>
                          <span className={styles.messageTime}>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Input Box */}
                <div className={styles.inputArea}>
                  <textarea
                    className={styles.messageInput}
                    placeholder={`${selectedUser.name} ko message karo...`}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                  />
                  <button
                    className={styles.sendButton}
                    onClick={sendMessage}
                    disabled={!input.trim()}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className={styles.sendIcon}
                    >
                      <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </DashboardLayout>
    </UserLayout>
  );
};

export default MessagesPage;
