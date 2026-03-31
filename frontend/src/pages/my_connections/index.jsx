import {
  acceptConnection,
  getMyConnectionsRequests,
  getConnectionsRequest,
} from "@/config/redux/action/authAction";
import DashboardLayout from "@/layout/DashboardLayout";
import UserLayout from "@/layout/UserLayout";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import style from "./style.module.css";
import { BASE_URL } from "@/config";
import { useRouter } from "next/router";

// Helper: handles both old local paths and new Cloudinary full URLs
const getImageUrl = (path) => {
  if (!path || path === "default.jpg") return "/default.jpg";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BASE_URL}/${path}`;
};


const MyConnectionPage = () => {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    dispatch(getMyConnectionsRequests({ token }));
    dispatch(getConnectionsRequest({ token }));
  }, [dispatch]);
  useEffect(() => {
    if (
      authState.connectionRequest &&
      authState.connectionRequest.length !== 0
    ) {
      console.log(authState.connectionRequest);
    }
  }, [authState.connectionRequest]);
  
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
  // Merge and deduplicate by the other user's id
  const mergedAcceptedMap = new Map();
  [...acceptedIncoming, ...acceptedOutgoing].forEach((item) => {
    // acceptedIncoming: userId = other person (populated), connectionId = me
    // acceptedOutgoing: connectionId = other person (populated), userId = raw ObjectId
    const other = (item.userId && item.userId.name) ? item.userId : item.connectionId;
    if (other && other._id && !mergedAcceptedMap.has(other._id)) {
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
            pendingRequests.map((user, index) => {
              return (
                <div
                  onClick={() => {
                    router.push(`/view_profile/${user.userId.username}`);
                  }}
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
                        dispatch(
                          acceptConnection({
                            token: localStorage.getItem("token"),
                            connectionId: user._id,
                            action: "accept",
                          })
                        );
                      }}
                      className={style.btn}
                    >
                      Accept
                    </button>
                  </div>
                </div>
              );
            })}
          <h3 className={style.sectionTitle}>My Network</h3>
          {acceptedNetwork.map((item, index) => {
              const displayUser = item.userId || item.connectionId;
              return (
                <div
                  onClick={() => {
                    router.push(`/view_profile/${displayUser.username}`);
                  }}
                  className={style.userCard}
                  key={index}
                >
                  <div className={style.cardInner}>
                    <div className={style.profilePicture}>
                      <img
                        className={style.profileImage}
                        src={getImageUrl(displayUser.profilePicture)}
                        alt="connectionImage"
                      />
                    </div>
                    <div className={style.userInfo}>
                      <h3 className={style.userName}>{displayUser?.name}</h3>
                      <p className={style.userUsername}>{displayUser?.username}</p>
                    </div>
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
