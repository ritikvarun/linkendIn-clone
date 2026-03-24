import clintServer, { BASE_URL } from "@/config";
import DashboardLayout from "@/layout/DashboardLayout";
import UserLayout from "@/layout/UserLayout";
import style from "./style.module.css";
import React, { useEffect, useReducer, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { getAllPosts } from "@/config/redux/action/postAction";
import { sendConnectionRequest } from "@/config/redux/action/authAction";

const ViewProfilePage = ({ userProfile }) => {
  const router = useRouter();
  const postState = useSelector((state) => state.postReducer);
  const dispatch = useDispatch();

  const authState = useSelector((state) => state.auth);

  const [userPosts, setUserPosts] = useState([]);

  const [isCurrentUserInConnection, setIsCurrentUserInConnection] =
    useState(false);
  const [isConnectionNull, setIsConnectionNull] = useState(true);

  const getUsersPost = async () => {
    await dispatch(getAllPosts());
  };

  useEffect(() => {
    if (!postState?.posts?.length || !router.query?.username) return;
    const filteredPosts = postState.posts
      .filter((post) => post?.userId?.username === router.query.username)
      .slice()
      .sort(
        (a, b) =>
          new Date(b.createdAt || b.createAt) -
          new Date(a.createdAt || a.createAt)
      )
      .slice(0, 1);
    setUserPosts(filteredPosts);
  }, [postState?.posts, router.query?.username]);

  useEffect(() => {
    // Reset flags
    setIsCurrentUserInConnection(false);
    setIsConnectionNull(true);

    if (!userProfile?.userId?._id) return;

    // Check connections initiated by current user
    const sentConnection = authState?.connections?.find(
      (item) => item?.connectionId?._id === userProfile.userId._id
    );

    // Check requests received by current user (initiated by the profile user)
    const receivedRequest = authState?.connectionRequest?.find(
      (item) => item?.userId?._id === userProfile.userId._id
    );

    // Determine status priority: connected > pending
    if (sentConnection) {
      setIsCurrentUserInConnection(true);
      if (sentConnection.status_accepted === null) {
        setIsConnectionNull(true); // pending
      } else {
        setIsConnectionNull(false); // connected
      }
    }

    if (receivedRequest) {
      setIsCurrentUserInConnection(true);
      if (receivedRequest.status_accepted === null) {
        // pending (only override if not already connected)
        // if already marked connected from sentConnection, keep connected
        setIsConnectionNull((prev) => (prev === false ? false : true));
      } else {
        setIsConnectionNull(false); // connected
      }
    }
  }, [
    authState.connections,
    authState.connectionRequest,
    userProfile?.userId?._id,
  ]);

  useEffect(() => {
    getUsersPost();
  }, []);

  return (
    <div>
      <UserLayout>
        <DashboardLayout>
          <div className={style.container}>
            <div className={style.backDropContainer}>
              <img
                className={style.backDrop}
                src={`${BASE_URL}/${
                  userProfile?.userId?.profilePicture || "default.jpg"
                }`}
                alt="profile"
              />
            </div>
            <div className={style.profileContainer_details}>
              <div style={{ display: "flex", gap: "0.7rem" }}>
                <div style={{ flex: 0.8 }}>
                  <div
                    style={{
                      display: "flex",
                      width: "fit-content",
                      alignItems: "center",
                      gap: "1.2rem",
                    }}
                  >
                    <h2>{userProfile?.userId?.name || "Unknown User"}</h2>
                    <p style={{ color: "gray" }}>
                      @{userProfile?.userId?.username || "unknown"}
                    </p>
                  </div>
                  <div>
                    <div
                      style={{
                        display: "flex",
                        gap: "1rem",
                        alignItems: "center",
                      }}
                    >
                      {isCurrentUserInConnection ? (
                        <button className={style.connectButton}>
                          {isConnectionNull ? "Pending" : "Connected"}
                        </button>
                      ) : (
                        <>
                          <button
                            className={style.connectButton}
                            onClick={() => {
                              setIsCurrentUserInConnection(true);
                              setIsConnectionNull(true);
                              dispatch(
                                sendConnectionRequest({
                                  token: localStorage.getItem("token"),
                                  user_id: userProfile?.userId?._id,
                                })
                              );
                            }}
                          >
                            Connect
                          </button>
                          <div
                            onClick={async () => {
                              const response = await clintServer.get(
                                `/user/download_resume?id=${userProfile.userId._id}`
                              );
                              window.open(
                                `${BASE_URL}/${response.data.message}`,
                                "_blank"
                              );
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            <svg
                              style={{ width: "1.2em" }}
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="size-6"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                              />
                            </svg>
                          </div>
                        </>
                      )}
                    </div>

                    <div>
                      <p>{userProfile?.bio || ""}</p>
                    </div>
                  </div>
                </div>
                <div style={{ flex: 0.2 }}>
                  <h3>Recent Activity</h3>
                  {userPosts.map((post) => {
                    return (
                      <div key={post._id} className={style.postCard}>
                        <div className={style.card}>
                          <div className={style.card_profileContainer}>
                            {post.media !== "" && (
                              <img
                                src={`${BASE_URL}/${post.media}`}
                                alt="image"
                              />
                            )}
                          </div>
                          <p>{post.body}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className={style.workHistory}>
              <h4>Work History</h4>
              <div className={style.workHistoryContainer}>
                {userProfile.pastWork.map((work, index) => {
                  return (
                    <div key={index} className={style.workHistoryCard}>
                      <p
                        style={{
                          fontWeight: "bold",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.8rem",
                        }}
                      >
                        {work.company} - {work.position}
                      </p>
                      <p>{work.years}</p>
                    </div>
                  );
                })}
              </div>
            </div>
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

    // Find user by username from profiles array
    const userProfile =
      response.profiles?.find(
        (profile) => profile.userId?.username === context.query.username
      ) || null;

    return {
      props: {
        userProfile: userProfile,
      },
    };
  } catch (error) {
    console.error("Error fetching profile:", error);
    return {
      props: {
        userProfile: null,
      },
    };
  }
}
