import clintServer, { BASE_URL } from "@/config";
import DashboardLayout from "@/layout/DashboardLayout";
import UserLayout from "@/layout/UserLayout";
import style from "./style.module.css";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { getAllPosts } from "@/config/redux/action/postAction";
import { sendConnectionRequest } from "@/config/redux/action/authAction";

const getImageUrl = (path) => {
  if (!path || path === "default.jpg") return "/default.jpg";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BASE_URL}/${path}`;
};

const ViewProfilePage = ({ userProfile }) => {
  const router = useRouter();
  const postState = useSelector((state) => state.postReducer);
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);

  const [userPosts, setUserPosts] = useState([]);
  const [isCurrentUserInConnection, setIsCurrentUserInConnection] = useState(false);
  const [isConnectionNull, setIsConnectionNull] = useState(true);
  const [isConnected, setIsConnected] = useState(false); // fully accepted

  // Guard: profile not found
  if (!userProfile || !userProfile.userId) {
    return (
      <UserLayout>
        <DashboardLayout>
          <div style={{ padding: "3rem", textAlign: "center", color: "#555" }}>
            <h2>Profile not found</h2>
            <p>This user does not exist or their profile is not available.</p>
            <button
              onClick={() => router.back()}
              style={{
                marginTop: "1rem", padding: "0.6rem 1.5rem",
                background: "#0077b5", color: "white", border: "none",
                borderRadius: "20px", cursor: "pointer", fontWeight: 600,
              }}
            >
              Go Back
            </button>
          </div>
        </DashboardLayout>
      </UserLayout>
    );
  }

  useEffect(() => {
    if (!postState?.posts?.length || !router.query?.username) return;
    const filteredPosts = postState.posts
      .filter((post) => post?.userId?.username === router.query.username)
      .slice()
      .sort((a, b) => new Date(b.createdAt || b.createAt) - new Date(a.createdAt || a.createAt))
      .slice(0, 1);
    setUserPosts(filteredPosts);
  }, [postState?.posts, router.query?.username]);

  useEffect(() => {
    setIsCurrentUserInConnection(false);
    setIsConnectionNull(true);
    setIsConnected(false);

    if (!userProfile?.userId?._id) return;

    const sentConnection = authState?.connections?.find(
      (item) => item?.connectionId?._id === userProfile.userId._id
    );
    const receivedRequest = authState?.connectionRequest?.find(
      (item) => item?.userId?._id === userProfile.userId._id
    );

    if (sentConnection) {
      setIsCurrentUserInConnection(true);
      const accepted = sentConnection.status_accepted === true;
      setIsConnectionNull(!accepted);
      setIsConnected(accepted);
    }
    if (receivedRequest) {
      setIsCurrentUserInConnection(true);
      const accepted = receivedRequest.status_accepted === true;
      if (accepted) {
        setIsConnectionNull(false);
        setIsConnected(true);
      } else {
        setIsConnectionNull((prev) => (prev === false ? false : true));
      }
    }
  }, [authState.connections, authState.connectionRequest, userProfile?.userId?._id]);

  useEffect(() => { dispatch(getAllPosts()); }, []);

  const pastWork = userProfile.pastWork || [];

  return (
    <div>
      <UserLayout>
        <DashboardLayout>
          <div className={style.container}>
            <div className={style.backDropContainer}>
              <img
                className={style.backDrop}
                src={getImageUrl(userProfile?.userId?.profilePicture || "default.jpg")}
                alt="profile"
              />
            </div>
            <div className={style.profileContainer_details}>
              <div className={style.profileGrid}>
                <div className={style.profileLeft}>
                  <div>
                    <h2 className={style.userName}>{userProfile?.userId?.name || "Unknown User"}</h2>
                    <p className={style.usernameText}>@{userProfile?.userId?.username || "unknown"}</p>
                  </div>
                  <div>
                    <div className={style.actionsContainer}>
                      {isCurrentUserInConnection ? (
                        <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", flexWrap: "wrap" }}>
                          <button
                            style={{
                              padding: "0.5rem 1.2rem",
                              borderRadius: "20px",
                              border: "none",
                              fontWeight: 600,
                              fontSize: "0.9rem",
                              cursor: "default",
                              background: isConnected ? "#057642" : "#e8a030",
                              color: "white",
                            }}
                          >
                            {isConnectionNull ? "⏳ Pending" : "✓ Connected"}
                          </button>

                          {/* Message button — only when fully connected */}
                          {isConnected && (
                            <button
                              onClick={() =>
                                router.push(
                                  `/messages?userId=${userProfile.userId._id}&name=${encodeURIComponent(userProfile.userId.name)}&username=${userProfile.userId.username}&pic=${encodeURIComponent(userProfile.userId.profilePicture || "")}`
                                )
                              }
                              style={{
                                padding: "0.5rem 1.2rem",
                                borderRadius: "20px",
                                border: "2px solid #0077b5",
                                fontWeight: 600,
                                fontSize: "0.9rem",
                                cursor: "pointer",
                                background: "white",
                                color: "#0077b5",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "#0077b5"; e.currentTarget.style.color = "white"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#0077b5"; }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: "1rem" }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                              </svg>
                              Message
                            </button>
                          )}
                        </div>
                      ) : (
                        <>
                          <button
                            className={style.connectButton}
                            onClick={() => {
                              setIsCurrentUserInConnection(true);
                              setIsConnectionNull(true);
                              dispatch(sendConnectionRequest({
                                token: localStorage.getItem("token"),
                                user_id: userProfile?.userId?._id,
                              }));
                            }}
                          >
                            Connect
                          </button>
                          <div
                            className={style.downloadIcon}
                            onClick={async () => {
                              try {
                                const response = await clintServer.get(`/user/download_resume?id=${userProfile.userId._id}`);
                                window.open(`${BASE_URL}/${response.data.message}`, "_blank");
                              } catch (e) { alert("Resume not available"); }
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            <svg style={{ width: "1.2em" }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                          </div>
                        </>
                      )}
                    </div>
                    <div>
                      <p className={style.userBio}>{userProfile?.bio || ""}</p>
                    </div>
                  </div>
                </div>
                <div className={style.profileRight}>
                  <h3 className={style.recentActivityTitle}>Recent Activity</h3>
                  {userPosts.length === 0 && (
                    <p style={{ color: "#888", fontSize: "0.9rem" }}>No recent posts</p>
                  )}
                  {userPosts.map((post) => (
                    <div key={post._id} className={style.postCard}>
                      <div className={style.card}>
                        {post.media && post.media !== "" && (
                          <div className={style.card_profileContainer}>
                            <img className={style.postThumb} src={getImageUrl(post.media)} alt="post" />
                          </div>
                        )}
                        <p className={style.cardText}>{post.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {pastWork.length > 0 && (
              <div className={style.workHistory}>
                <h4 className={style.workHistoryTitle}>Work History</h4>
                <div className={style.workHistoryContainer}>
                  {pastWork.map((work, index) => (
                    <div key={index} className={style.workHistoryCard}>
                      <p className={style.workRole}>{work.company} - {work.position}</p>
                      <p className={style.workYears}>{work.years} Years</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DashboardLayout>
      </UserLayout>
    </div>
  );
};

export default ViewProfilePage;

export async function getServerSideProps(context) {
  try {
    const request = await clintServer.get("/user/get_user_profile");
    const response = request.data;
    const userProfile = response.profiles?.find(
      (profile) => profile.userId?.username === context.query.username
    ) || null;
    return { props: { userProfile } };
  } catch (error) {
    console.error("Error fetching profile:", error);
    return { props: { userProfile: null } };
  }
}
