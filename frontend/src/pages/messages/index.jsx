import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import UserLayout from "@/layout/UserLayout";
import DashboardLayout from "@/layout/DashboardLayout";
import { getMyConnectionsRequests, getConnectionsRequest } from "@/config/redux/action/authAction";
import clintServer, { BASE_URL } from "@/config";
import { io } from "socket.io-client";
import styles from "./style.module.css";

const getImageUrl = (path) => {
  if (!path || path === "default.jpg") return "/default.jpg";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BASE_URL}/${path}`;
};

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
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
  // unread: { [userId]: count }
  const [unread, setUnread] = useState({});
  // lastMsg: { [userId]: { text, time, isMine } }
  const [lastMsg, setLastMsg] = useState({});
  const bottomRef = useRef(null);
  const selectedUserRef = useRef(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const myUserId = authState.user?.userId?._id;

  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);

  // Auto-open from URL params (from view_profile Message button)
  useEffect(() => {
    const { userId, name, username, pic } = router.query;
    if (userId && name) {
      setSelectedUser({ _id: userId, name: decodeURIComponent(name), username: username || "", profilePicture: pic ? decodeURIComponent(pic) : "default.jpg" });
    }
  }, [router.query]);

  // Fetch connections
  useEffect(() => {
    const t = localStorage.getItem("token");
    dispatch(getMyConnectionsRequests({ token: t }));
    dispatch(getConnectionsRequest({ token: t }));
  }, [dispatch]);

  // Build connected users list
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

  // Fetch inbox (last messages + unread counts)
  const fetchInbox = useCallback(async () => {
    if (!token) return;
    try {
      const res = await clintServer.get("/messages/inbox", { params: { token } });
      const newLast = {};
      const newUnread = {};
      (res.data.inbox || []).forEach((item) => {
        newLast[item.partnerId] = {
          text: item.isMine ? `You: ${item.lastMessage}` : item.lastMessage,
          time: item.lastMessageTime,
          isMine: item.isMine,
        };
        if (item.unreadCount > 0) newUnread[item.partnerId] = item.unreadCount;
      });
      setLastMsg(newLast);
      setUnread(newUnread);
    } catch (_) {}
  }, [token]);

  useEffect(() => { fetchInbox(); }, [fetchInbox]);

  // Setup Socket.io
  useEffect(() => {
    if (!token) return;
    const socketUrl = BASE_URL.replace(/\/$/, "");
    socket = io(socketUrl, { transports: ["polling", "websocket"] });

    socket.on("connect", () => {
      if (myUserId) { socket.emit("register", myUserId); setMyId(myUserId); }
    });

    socket.on("newMessage", (msg) => {
      const currentChat = selectedUserRef.current;
      const senderId = String(msg.senderId);

      // Update lastMsg preview in sidebar
      setLastMsg((prev) => ({
        ...prev,
        [senderId]: { text: msg.message, time: msg.createdAt, isMine: false },
      }));

      // If this chat is open — show message, mark seen
      if (currentChat && senderId === String(currentChat._id)) {
        setMessages((prev) => {
          if (prev.find((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        setIsTyping(false);
        socket.emit("markSeen", { senderId: msg.senderId });
      } else {
        // Not open — increment unread badge
        setUnread((prev) => ({ ...prev, [senderId]: (prev[senderId] || 0) + 1 }));
      }
    });

    socket.on("messageSaved", (msg) => {
      setMessages((prev) =>
        prev.map((m) => (m._tempId && m.message === msg.message ? { ...msg } : m))
      );
      // Update lastMsg for sent
      const recvId = String(msg.receiverId);
      setLastMsg((prev) => ({
        ...prev,
        [recvId]: { text: `You: ${msg.message}`, time: msg.createdAt, isMine: true },
      }));
    });

    socket.on("messagesSeen", ({ by }) => {
      setMessages((prev) =>
        prev.map((m) => String(m.receiverId) === String(by) ? { ...m, seen: true } : m)
      );
    });

    socket.on("typing", ({ senderId }) => {
      if (selectedUserRef.current && String(senderId) === String(selectedUserRef.current._id)) setIsTyping(true);
    });
    socket.on("stopTyping", ({ senderId }) => {
      if (selectedUserRef.current && String(senderId) === String(selectedUserRef.current._id)) setIsTyping(false);
    });

    return () => { socket.disconnect(); };
  }, [token, myUserId]);

  useEffect(() => {
    if (socket && socket.connected && myUserId) { socket.emit("register", myUserId); setMyId(myUserId); }
  }, [myUserId]);

  // Fetch chat history + mark seen when user selected
  useEffect(() => {
    if (!selectedUser || !token) return;
    setIsLoading(true);
    setIsTyping(false);
    // Clear unread for this user
    setUnread((prev) => { const n = { ...prev }; delete n[selectedUser._id]; return n; });

    clintServer.get(`/messages/${selectedUser._id}`, { params: { token } })
      .then((res) => {
        setMessages(res.data.messages || []);
        if (res.data.myId) setMyId(res.data.myId);
        if (socket && socket.connected) socket.emit("markSeen", { senderId: selectedUser._id });
      })
      .catch(() => setMessages([]))
      .finally(() => setIsLoading(false));
  }, [selectedUser]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  const sendMessage = useCallback(() => {
    if (!input.trim() || !selectedUser || !socket) return;
    const tempId = Date.now().toString();
    setMessages((prev) => [...prev, {
      _tempId: tempId, _id: tempId, senderId: myId,
      receiverId: selectedUser._id, message: input.trim(),
      createdAt: new Date().toISOString(), seen: false,
    }]);
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
    typingTimer = setTimeout(() => socket.emit("stopTyping", { receiverId: selectedUser._id }), 1500);
  };

  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0);
  const lastSentMsgId = [...messages].reverse().find((m) => String(m.senderId) === String(myId))?._id;

  // Sort users: those with unread first, then by last msg time
  const sortedUsers = [...connectedUsers].sort((a, b) => {
    const ua = unread[a._id] || 0;
    const ub = unread[b._id] || 0;
    if (ua !== ub) return ub - ua;
    const ta = lastMsg[a._id]?.time ? new Date(lastMsg[a._id].time) : new Date(0);
    const tb = lastMsg[b._id]?.time ? new Date(lastMsg[b._id].time) : new Date(0);
    return tb - ta;
  });

  return (
    <UserLayout>
      <DashboardLayout>
        <div className={styles.container}>

          {/* ── LEFT: Conversation List ── */}
          <div className={`${styles.sidebar} ${selectedUser ? styles.sidebarHiddenMobile : ""}`}>
            <div className={styles.sidebarHeader}>
              <h2 className={styles.sidebarTitle}>Messages</h2>
              {totalUnread > 0 && <span className={styles.totalBadge}>{totalUnread}</span>}
            </div>

            <div className={styles.userList}>
              {sortedUsers.length === 0 && (
                <div className={styles.emptyConnections}>
                  <div className={styles.emptyIcon}>💬</div>
                  <p>Koi connection nahi mila</p>
                  <small>Pehle kisi se connect karo</small>
                </div>
              )}
              {sortedUsers.map((user) => {
                const unreadCount = unread[user._id] || 0;
                const last = lastMsg[user._id];
                const isActive = selectedUser?._id === user._id;
                return (
                  <div
                    key={user._id}
                    className={`${styles.userItem} ${isActive ? styles.userItemActive : ""} ${unreadCount > 0 ? styles.userItemUnread : ""}`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className={styles.avatarWrapper}>
                      <img src={getImageUrl(user.profilePicture)} alt={user.name} className={styles.avatar} />
                      <span className={styles.onlineDot} />
                    </div>
                    <div className={styles.userInfo}>
                      <div className={styles.userInfoTop}>
                        <p className={`${styles.userName} ${unreadCount > 0 ? styles.userNameBold : ""}`}>{user.name}</p>
                        {last?.time && <span className={styles.lastTime}>{timeAgo(last.time)}</span>}
                      </div>
                      <div className={styles.userInfoBottom}>
                        <p className={`${styles.lastMsgPreview} ${unreadCount > 0 ? styles.lastMsgBold : ""}`}>
                          {last?.text || `@${user.username}`}
                        </p>
                        {unreadCount > 0 && <span className={styles.unreadBadge}>{unreadCount}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT: Chat Panel ── */}
          <div className={`${styles.chatPanel} ${!selectedUser ? styles.chatPanelHiddenMobile : ""}`}>
            {!selectedUser ? (
              <div className={styles.noChatSelected}>
                <div className={styles.noChatIcon}>✉️</div>
                <h3>Koi conversation select karo</h3>
                <p>Left side se kisi connection ke saath baat karo</p>
              </div>
            ) : (
              <>
                <div className={styles.chatHeader}>
                  {/* Back button — mobile only */}
                  <button className={styles.backBtn} onClick={() => setSelectedUser(null)}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <img src={getImageUrl(selectedUser.profilePicture)} alt={selectedUser.name} className={styles.chatAvatar} />
                  <div>
                    <p className={styles.chatUserName}>{selectedUser.name}</p>
                    <p className={styles.chatUserStatus}>{isTyping ? "✍️ typing..." : "● Online"}</p>
                  </div>
                </div>

                <div className={styles.messagesArea}>
                  {isLoading && <div className={styles.loadingMessages}>Loading...</div>}
                  {!isLoading && messages.length === 0 && (
                    <div className={styles.noMessages}><p>👋 {selectedUser.name} ko pehla message bhejo!</p></div>
                  )}
                  {messages.map((msg, i) => {
                    const isMine = String(msg.senderId) === String(myId);
                    const isPending = !!msg._tempId;
                    const isLastMine = isMine && msg._id === lastSentMsgId;
                    return (
                      <div key={msg._id || i} className={`${styles.messageBubbleWrapper} ${isMine ? styles.myMessage : styles.theirMessage}`}>
                        <div className={`${styles.messageBubble} ${isPending ? styles.pending : ""}`}>
                          <p className={styles.messageText}>{msg.message}</p>
                          <div className={styles.messageMeta}>
                            <span className={styles.messageTime}>
                              {isPending ? "sending..." : new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
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
                  {isTyping && (
                    <div className={`${styles.messageBubbleWrapper} ${styles.theirMessage}`}>
                      <div className={styles.typingBubble}>
                        <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                <div className={styles.inputArea}>
                  <textarea
                    className={styles.messageInput}
                    placeholder={`Message ${selectedUser.name}...`}
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
