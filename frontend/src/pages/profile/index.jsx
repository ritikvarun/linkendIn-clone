import DashboardLayout from "@/layout/DashboardLayout";
import UserLayout from "@/layout/UserLayout";
import React, { use, useEffect, useState } from "react";
import style from "./style.module.css";
import clintServer, { BASE_URL } from "@/config";
import { useDispatch, useSelector } from "react-redux";
import { getAboutUser } from "@/config/redux/action/authAction";
import { getAllPosts } from "@/config/redux/action/postAction";

const index = () => {
  const authState = useSelector((state) => state.auth);
  const postReducer = useSelector((state) => state.postReducer);
  const [userProfile, setUserProfile] = useState({});
  const [userPosts, setUserPosts] = useState([]);
  const [isopenModal, setIsOpenModal] = useState(false);
  const [inputData, setInputData] = useState({
    company: "",
    position: "",
    years: "",
  });
  const handleWorkInputChange = (e) => {
    const { name, value } = e.target;
    setInputData({ ...inputData, [name]: value });
  };

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getAboutUser({ token: localStorage.getItem("token") }));
    dispatch(getAllPosts());
  }, []);
  useEffect(() => {
    if (authState?.user && Array.isArray(postReducer?.posts)) {
      setUserProfile(authState.user);

      const currentUsername = authState?.user?.userId?.username;
      if (currentUsername) {
        const latestPost = postReducer.posts
          .filter((post) => post?.userId?.username === currentUsername)
          .slice()
          .sort(
            (a, b) =>
              new Date(b.createdAt || b.createAt) -
              new Date(a.createdAt || a.createAt)
          )
          .slice(0, 1);

        setUserPosts(latestPost);
      } else {
        setUserPosts([]);
      }
    }
  }, [authState.user, postReducer.posts]);

  const updateProfilePicture = async (file) => {
    const formData = new FormData();
    formData.append("profile_picture", file);
    formData.append("token", localStorage.getItem("token"));
    const response = await clintServer.post(
      "/update_profile_picture",
      formData,
      {
        header: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    dispatch(getAboutUser({ token: localStorage.getItem("token") }));
  };

  const updateProfileData = async () => {
    const request = await clintServer.post("/user_update", {
      token: localStorage.getItem("token"),
      name: userProfile.userId.name,
    });
    const response = await clintServer.post("/update_profile_data", {
      token: localStorage.getItem("token"),
      bio: userProfile.bio,
      currentPost: userProfile.currentPost,
      pastWork: userProfile.pastWork,
      education: userProfile.education,
    });
    dispatch(getAboutUser({ token: localStorage.getItem("token") }));
  };
  return (
    <UserLayout>
      <DashboardLayout>
        {authState.user && userProfile?.userId && (
          <div className={style.container}>
            <div className={style.backDropContainer}>
              <label
                htmlFor="profilePictureUpload"
                className={style.backDrop_overlay}
              >
                <p>Edit</p>
              </label>
              <input
                onChange={(e) => updateProfilePicture(e.target.files[0])}
                hidden
                type="file"
                id="profilePictureUpload"
              />
              <img
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
                      flexDirection: "column",
                      width: "fit-content",
                      
                      gap: "1.2rem",
                    }}
                  >
                    <input
                      className={style.nameEdit}
                      type="text"
                      value={userProfile.userId.name}
                      onChange={(e) => {
                        setUserProfile({
                          ...userProfile,
                          userId: {
                            ...userProfile.userId,
                            name: e.target.value,
                          },
                        });
                      }}
                    />

                    <p style={{ color: "gray",paddingLeft:"0.5rem" }}>
                      @{userProfile?.userId?.username || "unknown"}
                    </p>
                  </div>
                  <div>
                    <div>
                      <textarea
                        style={{ width: "100%" }}
                        value={userProfile.bio || ""}
                        rows={Math.max(
                          2,
                          Math.ceil((userProfile?.bio?.length || 0) / 80)
                        )}
                        onChange={(e) => {
                          setUserProfile({
                            ...userProfile,
                            bio: e.target.value,
                          });
                        }}
                      />
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
                {(userProfile?.pastWork || []).map((work, index) => {
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
                <button
                  className={style.addWorkBtn}
                  onClick={() => {
                    setIsOpenModal(true);
                  }}
                >
                  Add Work
                </button>
              </div>
            </div>
            {userProfile != authState.user && (
              <div
                onClick={() => {
                  updateProfileData();
                }}
                className={style.connectButton}
              >
                Update Profile
              </div>
            )}
          </div>
        )}
        {isopenModal && (
          <div
            onClick={() => {
              setIsOpenModal(false);
            }}
            className={style.commentContainer}
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
              }}
              className={style.allCommentsContainer}
            >
              <input
                onChange={handleWorkInputChange}
                name="company"
                className={style.inputField}
                type="text"
                placeholder="Enter Company"
              />
              <input
                onChange={handleWorkInputChange}
                name="position"
                className={style.inputField}
                type="text"
                placeholder="Enter Postition"
              />
              <input
                onChange={handleWorkInputChange}
                name="years"
                className={style.inputField}
                type="number"
                placeholder="Years"
              />
              <div
                onClick={() => {
                  setUserProfile({
                    ...userProfile,
                    pastWork: [...userProfile.pastWork, inputData],
                  });
                  setIsOpenModal(false);
                }}
                className={style.connectButton}
              >
                Add Work
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </UserLayout>
  );
};

export default index;
