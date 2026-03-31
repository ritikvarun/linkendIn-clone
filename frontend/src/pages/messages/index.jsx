import { useEffect, useRef, useState, useCallback } from "react";
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
let typingTimer;

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
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);
  const selectedUserRef = useRef(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const myUserId = authState.user?.userId?._id;

  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);

  // Auto-open chat from URL params (coming from view_profile Message button)
  useEffect(() => {
    const { userId, name, username, pic } = router.query;
    if (userId && name) {
      setSelectedUser({
        _id: userId,
        name: decodeURIComponent(name),
        username: username || "",
        profilePicture: pic ? decodeURIComponent(pic) : "default.jpg",
      });
    }
  }, [router.query]);

  // Fetch connections on mount
  useEffect(() => {
    const t = localStorage.getItem("token");
    dispatch(getMyConnectionsRequests({ token: t }));
    dispatch(getConnectionsRequest({ token: t }));
  }, [dispatch]);

  // Build connected users list — filter out self
  useEffect(() => {
    const incoming = (authState.connectionRequest || []).filter((c) => c.status_accepted === true);
    const outgoing = (authState.connections || []).filter((c) => c.status_accepted === true);

    const map = new Map();
    [...incoming, ...outgoing].forEach((item) => {
      const other = (item.userId && item.userId.name) ? item.userId : item.connectionId;
      if (other && other._id && !map.has(other._id) && String(other._id) !== String(myUserId)) {
        map.set(other._id, other);
      }
    });
    setConnectedUsers(Array.from(map.values()));
  }, [authState.connectionRequest, authState.connections, myUserId]);

  // Setup Socket.io
  useEffect(() => {
    if (!token) return;

    const socketUrl = BASE_URL.replace(/\/$/, "");
    socket = io(socketUrl, { transports: ["polling", "websocket"] });

    socket.on("connect", () => {
      if (myUserId) {
        socket.emit("register", myUserId);
        setMyId(myUserId);
      }
    });

    socket.on("newMessage", (msg) => {
      setMessages((prev) => {
        if (prev.find((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      setIsTyping(false);
      // Mark seen if this chat is currently open
      if (selectedUserRef.current && String(msg.senderId) === String(selectedUserRef.current._id)) {
        socket.emit("markSeen", { senderId: msg.senderId });
      }
    });

    socket.on("messageSaved", (msg) => {
      setMessages((prev) =>
        prev.map((m) => (m._tempId && m.message === msg.message ? { ...msg } : m))
      );
    });

    // Other person saw our messages — update seen status
    socket.on("messagesSeen", ({ by }) => {
      setMessages((prev) =>
        prev.map((m) =>
          String(m.receiverId) === String(by) ? { ...m, seen: true } : m
        )
      );
    });

    socket.on("typing", ({ senderId }) => {
      if (selectedUserRef.current && String(senderId) === String(selectedUserRef.current._id)) {
        setIsTyping(true);
      }
    });

    socket.on("stopTyping", ({ senderId }) => {
      if (selectedUserRef.current && String(senderId) === String(selectedUserRef.current._id)) {
        setIsTyping(false);
      }
    });

    return () => { socket.disconnect(); };
  }, [token, myUserId]);

  // Re-register if userId loads after socket connect
  useEffect(() => {
    if (socket && socket.connected && myUserId) {
      socket.emit("register", myUserId);
      setMyId(myUserId);
    }
  }, [myUserId]);

  // Fetch chat history when user selected + mark seen
  useEffect(() => {
    if (!selectedUser || !token) return;
    setIsLoading(true);
    setIsTyping(false);
    clintServer
      .get(`/messages/${selectedUser._id}`, { params: { token } })
      .then((res) => {
        setMessages(res.data.messages || []);
        if (res.data.myId) setMyId(res.data.myId);
        // Mark all their messages as seen
        if (socket && socket.connected) {
          socket.emit("markSeen", { senderId: selectedUser._id });
        }
      })
      .catch(() => setMessages([]))
      .finally(() => setIsLoading(false));
  }, [selectedUser]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Send message — optimistic
  const sendMessage = useCallback(() => {
    if (!input.trim() || !selectedUser || !socket) return;

    const tempId = Date.now().toString();
    const optimisticMsg = {
      _tempId: tempId,
      _id: tempId,
      senderId: myId,
      receiverId: selectedUser._id,
      message: input.trim(),
      createdAt: new Date().toISOString(),
      seen: false,
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    socket.emit("sendMessage", { token, receiverId: selectedUser._id, message: input.trim() });
    socket.emit("stopTyping", { receiverId: selectedUser._id });
    setInput("");
  }, [input, selectedUser, myId, token]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!socket || !selectedUser) return;
    socket.emit("typing", { receiverId: selectedUser._id });
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      socket.emit("stopTyping", { receiverId: selectedUser._id });
    }, 1500);
  };

  // Last sent message for "Seen" indicator
  const lastSentMsgId = [...messages].reverse().find(
    (m) => String(m.senderId) === String(myId)
  )?._id;

  return (
    <UserLayout>
      <DashboardLayout>
        <div className={styles.container}>
          {/* Left Sidebar */}
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
                  className={`${styles.userItem} ${selectedUser?._id === user._id ? styles.userItemActive : ""}`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className={styles.avatarWrapper}>
                    <img src={getImageUrl(user.profilePicture)} alt={user.name} className={styles.avatar} />
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

          {/* Chat Panel */}
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
                    <img src={getImageUrl(selectedUser.profilePicture)} alt={selectedUser.name} className={styles.chatAvatar} />
                    <div>
                      <p className={styles.chatUserName}>{selectedUser.name}</p>
                      <p className={styles.chatUserStatus}>
                        {isTyping ? "✍️ typing..." : "● Online"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className={styles.messagesArea}>
                  {isLoading && <div className={styles.loadingMessages}>Loading messages...</div>}
                  {!isLoading && messages.length === 0 && (
                    <div className={styles.noMessages}>
                      <p>👋 {selectedUser.name} ko pehla message bhejo!</p>
                    </div>
                  )}
                  {messages.map((msg, i) => {
                    const isMine = String(msg.senderId) === String(myId);
                    const isPending = !!msg._tempId;
                    const isLastMine = isMine && msg._id === lastSentMsgId;
                    return (
                      <div
                        key={msg._id || i}
                        className={`${styles.messageBubbleWrapper} ${isMine ? styles.myMessage : styles.theirMessage}`}
                      >
                        <div className={`${styles.messageBubble} ${isPending ? styles.pending : ""}`}>
                          <p className={styles.messageText}>{msg.message}</p>
                          <div className={styles.messageMeta}>
                            <span className={styles.messageTime}>
                              {isPending ? "sending..." : new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {/* Seen indicator — only on last sent message */}
                            {isMine && isLastMine && !isPending && (
                              <span className={`${styles.seenTick} ${msg.seen ? styles.seenBlue : ""}`}>
                                {msg.seen ? "✓✓ Seen" : "✓✓"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing bubble */}
                  {isTyping && (
                    <div className={`${styles.messageBubbleWrapper} ${styles.theirMessage}`}>
                      <div className={styles.typingBubble}>
                        <span className={styles.dot} />
                        <span className={styles.dot} />
                        <span className={styles.dot} />
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className={styles.inputArea}>
                  <textarea
                    className={styles.messageInput}
                    placeholder={`${selectedUser.name} ko message karo...`}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    rows={1}
                  />
                  <button className={styles.sendButton} onClick={sendMessage} disabled={!input.trim()}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.sendIcon}>
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
