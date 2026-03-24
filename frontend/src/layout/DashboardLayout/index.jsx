import React, { useEffect } from "react";
import styles from "./style.module.css";
import Link from "next/link";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { setTokenIsThere } from "@/config/redux/reducer/authReducer";
import {
  getAllUserProfiles,
  getConnectionsRequest,
  getMyConnectionsRequests,
} from "@/config/redux/action/authAction";

const DashboardLayout = ({ children }) => {
  const authState = useSelector((state) => state.auth);

  const router = useRouter();
  const dispatch = useDispatch();
  useEffect(() => {
    if (localStorage.getItem("token") === null) {
      router.push("/login");
    } else {
      dispatch(setTokenIsThere());
      // Fetch all user profiles for top profiles section
      if (!authState.allUsersFetched) {
        dispatch(getAllUserProfiles());
      }
      // Always refresh connections so status is accurate app-wide
      const token = localStorage.getItem("token");
      if (token) {
        dispatch(getConnectionsRequest({ token }));
        dispatch(getMyConnectionsRequests({ token }));
      }
    }
  }, [router, dispatch, authState.allUsersFetched]);
  return (
    <div className={styles.Container}>
      <div className={styles.homeContainer}>
        {/* LEFT SIDEBAR */}
        <div>
          <div className={styles.homeContainer__leftBar}>
            {/* Scroll */}
            <Link href="/dashboard" legacyBehavior>
              <a className={styles.sideBarOption}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m2.25 12 8.954-8.955c.44-.439 
                    1.152-.439 1.591 0L21.75 12M4.5 
                    9.75v10.125c0 .621.504 1.125 
                    1.125 1.125H9.75v-4.875c0-.621.504-1.125 
                    1.125-1.125h2.25c.621 0 1.125.504 
                    1.125 1.125V21h4.125c.621 0 1.125-.504 
                    1.125-1.125V9.75M8.25 21h8.25"
                  />
                </svg>
                <p>Home</p>
              </a>
            </Link>

            {/* Discover */}
            <Link href="/discover" legacyBehavior>
              <a className={styles.sideBarOption}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 
                    7.5 0 1 0 5.196 5.196a7.5 
                    7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
                <p>Discover</p>
              </a>
            </Link>

            {/* My Connections */}
            <Link href="/my_connections" legacyBehavior>
              <a className={styles.sideBarOption}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 
                    0 3.75 3.75 0 0 1 7.5 0ZM4.501 
                    20.118a7.5 7.5 0 0 1 14.998 
                    0A17.933 17.933 0 0 1 12 
                    21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
                <p>My Connections</p>
              </a>
            </Link>
          </div>
        </div>

        {/* CENTER CONTENT */}
        <div className={styles.feedContainer}>{children}</div>

        {/* RIGHT SIDEBAR */}
        <div className={styles.extraContainer}>
          <h3>Top Profiles</h3>
          {authState.allUsersFetched && authState.allUsers ? (
            authState.allUsers
              .filter((user) => user.userId) // Only show profiles with valid userId
              .slice(0, 5) // Show only top 5 profiles
              .map((profile) => (
                <div
                  key={profile._id}
                  style={{
                    marginBottom: "10px",
                    padding: "8px",
                    border: "1px solid #eee",
                    borderRadius: "4px",
                  }}
                >
                  <p style={{ fontWeight: "bold", margin: "0" }}>
                    {profile.userId?.name || "Unknown User"}
                  </p>
                  <p
                    style={{ margin: "2px 0", fontSize: "12px", color: "#666" }}
                  >
                    {profile.userId?.username || "N/A"}
                  </p>
                  <p
                    style={{ margin: "2px 0", fontSize: "12px", color: "#666" }}
                  >
                    {profile.currentPost || "No position"}
                  </p>
                </div>
              ))
          ) : (
            <p>Loading profiles...</p>
          )}
        </div>
      </div>
      <div className={styles.mobileNavbar}>
        <div
          onClick={() => router.push("/dashboard")}
          className={styles.singleNavItemHolder_mobilView}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m2.25 12 8.954-8.955c.44-.439 
                    1.152-.439 1.591 0L21.75 12M4.5 
                    9.75v10.125c0 .621.504 1.125 
                    1.125 1.125H9.75v-4.875c0-.621.504-1.125 
                    1.125-1.125h2.25c.621 0 1.125.504 
                    1.125 1.125V21h4.125c.621 0 1.125-.504 
                    1.125-1.125V9.75M8.25 21h8.25"
            />
          </svg>
        </div>
        <div
          onClick={() => router.push("/discover")}
          className={styles.singleNavItemHolder_mobilView}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 
                    7.5 0 1 0 5.196 5.196a7.5 
                    7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
        </div>
        <div
          onClick={() => router.push("/my_connections")}
          className={styles.singleNavItemHolder_mobilView}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 1 1-7.5 
                    0 3.75 3.75 0 0 1 7.5 0ZM4.501 
                    20.118a7.5 7.5 0 0 1 14.998 
                    0A17.933 17.933 0 0 1 12 
                    21.75c-2.676 0-5.216-.584-7.499-1.632Z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
