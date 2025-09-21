import { getAboutUser } from "@/config/redux/action/authAction";
import {
  createPost,
  deletePost,
  getAllComments,
  getAllPosts,
  postComments,
  togglePostLike,
} from "@/config/redux/action/postAction";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import UserLayout from "@/layout/UserLayout";
import DashboardLayout from "@/layout/DashboardLayout";
import styles from "./style.module.css";
import { BASE_URL } from "@/config";
import { resetPostId } from "@/config/redux/reducer/postReducer";
const index = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  const [commentText, setCommentText] = useState("");

  const postState = useSelector((state) => state.postReducer);

  useEffect(() => {
    if (authState.isTokenThere) {
      dispatch(getAllPosts());
      dispatch(getAboutUser({ token: localStorage.getItem("token") }));
    }
  }, [authState.isTokenThere, dispatch]);

  const [postContent, setPostContent] = useState("");
  const [fileContent, setFileContent] = useState();

  const handleUpload = async () => {
    await dispatch(createPost({ file: fileContent, body: postContent }));
    setPostContent("");
    setFileContent(null);
    // Refresh posts after creation
    dispatch(getAllPosts());
  };

  return (
    <UserLayout>
      <DashboardLayout>
        <div className={styles.scrollComponent}>
          <div className={styles.wrapper}>
            <div className={styles.createPostContainer}>
              <img
                className={styles.userProfile}
                width={100}
                src={`${BASE_URL}/${authState.user.userId?.profilePicture}`}
                alt="profilePicture"
              />
              <textarea
                onChange={(e) => setPostContent(e.target.value)}
                value={postContent}
                placeholder="What's in your mind"
                className={styles.textArea}
                name=""
                id=""
              ></textarea>
              <label htmlFor="fileUpload">
                <div className={styles.fab}>
                  <svg
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
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                </div>
              </label>
              <input
                onChange={(e) => setFileContent(e.target.files[0])}
                type="file"
                hidden
                id="fileUpload"
              />
              {postContent.length > 0 && (
                <button onClick={handleUpload} className={styles.uploadButton}>
                  Post
                </button>
              )}
            </div>
            <div className={styles.postsContainer}>
              {postState.posts.map((post) => (
                <div key={post._id} className={styles.singleCard}>
                  <div className={styles.singleCard_ProfileContainer}>
                    <img
                      className={styles.userProfile}
                      src={`${BASE_URL}/${post.userId?.profilePicture}`}
                      alt="profilePicture"
                    />
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          cursor: "pointer",
                        }}
                      >
                        <p style={{ fontWeight: "bold" }}>
                          {post.userId?.name}
                        </p>
                        {post.userId?._id === authState.user.userId?._id && (
                          <div
                            onClick={async () => {
                              await dispatch(deletePost({ post_id: post._id }));
                              await dispatch(getAllPosts());
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            <svg
                              style={{ width: "15px", color: "red" }}
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
                                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <p style={{ color: "grey" }}>@{post.userId?.username}</p>
                      <p style={{ padding: "1.3rem" }}>{post.body}</p>
                      {post?.media ? (
                        <div>
                          <img
                            src={`${BASE_URL}/${post.media}`}
                            alt="post media"
                            style={{
                              maxWidth: "100%",
                              height: "auto",
                              borderRadius: "8px",
                              objectFit: "cover",
                            }}
                          />
                        </div>
                      ) : null}

                      <div className={styles.optionsContainer}>
                        <div
                          onClick={async (e) => {
                            e.stopPropagation();
                            await dispatch(
                              togglePostLike({ post_id: post._id })
                            );
                            await dispatch(getAllPosts());
                          }}
                          className={styles.singleOption_OptionContainer}
                          style={{ cursor: "pointer" }}
                        >
                          <svg
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
                              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                            />
                          </svg>
                          <p>{post.likes}</p>
                        </div>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(getAllComments({ post_id: post._id }));
                          }}
                          style={{ cursor: "pointer" }}
                          className={styles.singleOption_OptionContainer}
                        >
                          <svg
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
                              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                            />
                          </svg>
                          <p>{post.comments}</p>
                        </div>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            const test = encodeURIComponent(post.body);
                            const url = encodeURIComponent("ritikvarun.in");
                            const twitterUrl = `https://twitter.com/intent/tweet?text=${test}&url=${url}`;
                            window.open(twitterUrl, "_blank");
                          }}
                          className={styles.singleOption_OptionContainer}
                          style={{ cursor: "pointer" }}
                        >
                          <svg
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
                              d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {postState.postId !== "" && (
          <div
            onClick={() => {
              dispatch(resetPostId());
            }}
            className={styles.commentContainer}
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
              }}
              className={styles.allCommentsContainer}
            >
              <div className={styles.commentHeader}>
                <h3>Comments</h3>
                <button
                  className={styles.closeCommentsBtn}
                  onClick={() => dispatch({ type: "post/resetPostId" })}
                >
                  ✕
                </button>
              </div>

              <div className={styles.commentInputSection}>
                <img
                  className={styles.commentUserProfile}
                  src={`${BASE_URL}/${authState.user.userId?.profilePicture}`}
                  alt="profilePicture"
                />
                <div className={styles.commentInputWrapper}>
                  <textarea
                    placeholder="Write a comment..."
                    className={styles.commentTextarea}
                    rows="2"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <button
                    onClick={async () => {
                      if (commentText.trim()) {
                        await dispatch(
                          postComments({
                            post_id: postState.postId,
                            body: commentText,
                          })
                        );
                        setCommentText("");
                        // Refresh comments after posting
                        dispatch(getAllComments({ post_id: postState.postId }));
                      }
                    }}
                    className={styles.commentSubmitBtn}
                  >
                    Comment
                  </button>
                </div>
              </div>

              <div className={styles.commentsList}>
                {postState.comments && postState.comments.length > 0 ? (
                  postState.comments.map((comment, index) => (
                    <div key={index} className={styles.singleComment}>
                      <img
                        className={styles.commentUserProfile}
                        src={`${BASE_URL}/${
                          comment.userId?.profilePicture || "default.jpg"
                        }`}
                        alt="profilePicture"
                      />
                      <div className={styles.commentContent}>
                        <div className={styles.commentUserInfo}>
                          <span className={styles.commentUserName}>
                            {comment.userId?.name || "Anonymous"}
                          </span>
                          <span className={styles.commentTime}>
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className={styles.commentText}>{comment.body}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.noComments}>
                    <p>No comments yet. Be the first to comment! 🚀</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </UserLayout>
  );
};

export default index;
