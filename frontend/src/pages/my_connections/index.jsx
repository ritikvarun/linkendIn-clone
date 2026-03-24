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
    const other = item.userId || item.connectionId; // normalize
    if (other && other._id && !mergedAcceptedMap.has(other._id)) {
      mergedAcceptedMap.set(other._id, item);
    }
  });
  const acceptedNetwork = Array.from(mergedAcceptedMap.values());
  return (
    <UserLayout>
      <DashboardLayout>
        <h4>My Connections</h4>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.7rem" }}
        >
          {pendingRequests.length === 0 && (
            <h1>No Connection Request Pending</h1>
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1.2rem",
                    }}
                  >
                    <div className={style.profilePicture}>
                      <img
                        src={`${BASE_URL}/${user.userId.profilePicture}`}
                        alt="connectionImage"
                      />
                    </div>
                    <div className={style.userInfo}>
                      <h3>{user.userId?.name}</h3>
                      <p>{user.userId?.username}</p>
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
          <h4>My Network</h4>
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1.2rem",
                    }}
                  >
                    <div className={style.profilePicture}>
                      <img
                        src={`${BASE_URL}/${displayUser.profilePicture}`}
                        alt="connectionImage"
                      />
                    </div>
                    <div className={style.userInfo}>
                      <h3>{displayUser?.name}</h3>
                      <p>{displayUser?.username}</p>
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
