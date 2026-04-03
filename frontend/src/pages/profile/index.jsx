import DashboardLayout from "@/layout/DashboardLayout";
import UserLayout from "@/layout/UserLayout";
import React, { use, useEffect, useState } from "react";
import style from "./style.module.css";
import clintServer, { BASE_URL } from "@/config";
import { useDispatch, useSelector } from "react-redux";

// Helper: handles both old local paths and new Cloudinary full URLs
const getImageUrl = (path) => {
  if (!path || path === "default.jpg") return "/default.jpg";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BASE_URL}/${path}`;
};
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

  const updateBackgroundPicture = async (file) => {
    const formData = new FormData();
    formData.append("background_picture", file);
    formData.append("token", localStorage.getItem("token"));
    const response = await clintServer.post(
      "/update_background_picture",
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
              <img
                src={getImageUrl(userProfile?.userId?.backgroundPicture || "https://images.pexels.com/photos/906150/pexels-photo-906150.jpeg")}
                alt="background"
                className={style.backDropImage}
              />
              <label
                htmlFor="backgroundPictureUpload"
                className={style.backDrop_editBtn}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                </svg>
              </label>
              <input
                onChange={(e) => updateBackgroundPicture(e.target.files[0])}
                hidden
                type="file"
                id="backgroundPictureUpload"
              />

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
                className={style.profileImage}
                src={getImageUrl(userProfile?.userId?.profilePicture || "default.jpg")}
                alt="profile"
              />
            </div>
            <div className={style.profileContainer_details}>
              <div className={style.profileGrid}>
                <div className={style.profileLeft}>
                  <div>
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
                    <p className={style.usernameText}>
                      @{userProfile?.userId?.username || "unknown"}
                    </p>
                  </div>
                  <div>
                    <textarea
                      className={style.bioInput}
                      value={userProfile.bio || ""}
                      rows={Math.max(
                        3,
                        Math.ceil((userProfile?.bio?.length || 0) / 80)
                      )}
                      onChange={(e) => {
                        setUserProfile({
                          ...userProfile,
                          bio: e.target.value,
                        });
                      }}
                      placeholder="Add a bio..."
                    />
                  </div>
                </div>

                <div className={style.profileRight}>
                  <h3 className={style.recentActivityTitle}>Recent Activity</h3>
                  {userPosts.map((post) => {
                    return (
                      <div key={post._id} className={style.postCard}>
                        <div className={style.card}>
                          {post.media && post.media !== "" && (
                            <div className={style.card_profileContainer}>
                              <img
                                className={style.postThumb}
                                src={getImageUrl(post.media)}
                                alt="image"
                              />
                            </div>
                          )}
                          <p className={style.cardText}>{post.body}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className={style.workHistory}>
              <h4 className={style.workHistoryTitle}>Work History</h4>
              <div className={style.workHistoryContainer}>
                {(userProfile?.pastWork || []).map((work, index) => {
                  return (
                    <div key={index} className={style.workHistoryCard}>
                      <p className={style.workRole}>
                        {work.company} - {work.position}
                      </p>
                      <p className={style.workYears}>{work.years} Years</p>
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
