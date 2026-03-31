import {
  acceptConnection,
  getMyConnectionsRequests,
  getConnectionsRequest,
} from "@/config/redux/action/authAction";
import DashboardLayout from "@/layout/DashboardLayout";
import UserLayout from "@/layout/UserLayout";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import style from "./style.module.css";
import { BASE_URL } from "@/config";
import { useRouter } from "next/router";
import clintServer from "@/config";

const getImageUrl = (path) => {
  if (!path || path === "default.jpg") return "/default.jpg";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BASE_URL}/${path}`;
};

const MyConnectionPage = () => {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  const router = useRouter();
  // unread: { [userId]: count }
  const [unread, setUnread] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    dispatch(getMyConnectionsRequests({ token }));
    dispatch(getConnectionsRequest({ token }));
    // Fetch inbox to get unread counts
    fetchUnread(token);
  }, [dispatch]);

  const fetchUnread = async (token) => {
    try {
      const res = await clintServer.get("/messages/inbox", { params: { token } });
      const map = {};
      (res.data.inbox || []).forEach((item) => {
        if (item.unreadCount > 0) map[item.partnerId] = item.unreadCount;
      });
      setUnread(map);
    } catch (_) {}
  };

  // Build lists
  const pendingRequests = (authState.connectionRequest || []).filter(
    (conn) => conn.status_accepted === null
  );
  const acceptedIncoming = (authState.connectionRequest || []).filter(
    (conn) => conn.status_accepted === true
  );
  const acceptedOutgoing = (authState.connections || []).filter(
    (conn) => conn.status_accepted === true
  );

  const mergedAcceptedMap = new Map();
  [...acceptedIncoming, ...acceptedOutgoing].forEach((item) => {
    const other = (item.userId && item.userId.name) ? item.userId : item.connectionId;
    const myCurrentId = authState.user?.userId?._id;
    if (other && other._id && !mergedAcceptedMap.has(other._id) && String(other._id) !== String(myCurrentId)) {
      mergedAcceptedMap.set(other._id, item);
    }
  });
  const acceptedNetwork = Array.from(mergedAcceptedMap.values());

  return (
    <UserLayout>
      <DashboardLayout>
        <h2 className={style.pageTitle}>My Connections</h2>
        <div className={style.cardsContainer}>
          {pendingRequests.length === 0 && (
            <p className={style.noRequestText}>No Connection Request Pending</p>
          )}
          {pendingRequests.length !== 0 &&
            pendingRequests.map((user, index) => (
              <div
                onClick={() => router.push(`/view_profile/${user.userId.username}`)}
                className={style.userCard}
                key={index}
              >
                <div className={style.cardInner}>
                  <div className={style.profilePicture}>
                    <img
                      className={style.profileImage}
                      src={getImageUrl(user.userId.profilePicture)}
                      alt="connectionImage"
                    />
                  </div>
                  <div className={style.userInfo}>
                    <h3 className={style.userName}>{user.userId?.name}</h3>
                    <p className={style.userUsername}>{user.userId?.username}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(acceptConnection({
                        token: localStorage.getItem("token"),
                        connectionId: user._id,
                        action: "accept",
                      }));
                    }}
                    className={style.btn}
                  >
                    Accept
                  </button>
                </div>
              </div>
            ))}

          <h3 className={style.sectionTitle}>My Network</h3>
          {acceptedNetwork.map((item, index) => {
            const displayUser = (item.userId && item.userId.name) ? item.userId : item.connectionId;
            const unreadCount = unread[displayUser?._id] || 0;
            return (
              <div
                onClick={() => router.push(`/view_profile/${displayUser.username}`)}
                className={style.userCard}
                key={index}
              >
                <div className={style.cardInner}>
                  {/* Avatar with red unread dot */}
                  <div className={style.profilePicture} style={{ position: "relative" }}>
                    <img
                      className={style.profileImage}
                      src={getImageUrl(displayUser.profilePicture)}
                      alt="connectionImage"
                    />
                    {unreadCount > 0 && (
                      <span className={style.unreadDot}>{unreadCount}</span>
                    )}
                  </div>
                  <div className={style.userInfo}>
                    <h3 className={style.userName}>{displayUser?.name}</h3>
                    <p className={style.userUsername}>@{displayUser?.username}</p>
                  </div>
                  {/* Message button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(
                        `/messages?userId=${displayUser._id}&name=${encodeURIComponent(displayUser.name)}&username=${displayUser.username}&pic=${encodeURIComponent(displayUser.profilePicture || "")}`
                      );
                    }}
                    className={style.msgBtn}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                    </svg>
                    {unreadCount > 0 && <span className={style.msgBadge}>{unreadCount}</span>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </DashboardLayout>
    </UserLayout>
  );
};

export default MyConnectionPage;
