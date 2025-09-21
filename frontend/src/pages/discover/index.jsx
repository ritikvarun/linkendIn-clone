import DashboardLayout from "@/layout/DashboardLayout";
import UserLayout from "@/layout/UserLayout";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllUserProfiles } from "@/config/redux/action/authAction";
import { BASE_URL } from "@/config";
import styles from "./style.module.css";
import { useRouter } from "next/router";

const Discoverpage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(getAllUserProfiles()).then((result) => {});
  }, [dispatch]);

  return (
    <UserLayout>
      <DashboardLayout>
        <div className={styles.discoverContainer}>
          <h1 className={styles.discoverTitle}>Discover All Users</h1>

          {authState.isLoading ? (
            <div className={styles.loading}>Loading users...</div>
          ) : (
            <div className={styles.usersGrid}>
              {authState.allUsers && authState.allUsers.length > 0 ? (
                // Remove duplicate users based on userId and filter out null userIds
                authState.allUsers
                  .filter((profile) => profile.userId && profile.userId._id) // Filter out null userIds
                  .filter(
                    (profile, index, self) =>
                      index ===
                      self.findIndex((p) => p.userId._id === profile.userId._id)
                  )
                  .map((profile, index) => (
                    <div
                      key={profile._id || index}
                      className={styles.userCard}
                      onClick={() => {
                        router.push(
                          `/view_profile/${profile.userId?.username}`
                        );
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      {/* Profile Picture */}
                      <div className={styles.profileImageContainer}>
                        <img
                          src={`${BASE_URL}/${
                            profile.userId?.profilePicture || "default.jpg"
                          }`}
                          alt={profile.userId?.name}
                          className={styles.profileImage}
                        />
                      </div>

                      {/* User Info */}
                      <div className={styles.userInfo}>
                        <h3 className={styles.userName}>
                          {profile.userId?.name}
                        </h3>
                        <p className={styles.userUsername}>
                          @{profile.userId?.username}
                        </p>
                        <p className={styles.userEmail}>
                          {profile.userId?.email}
                        </p>
                      </div>
                    </div>
                  ))
              ) : (
                <div className={styles.noUsers}>
                  <p>No users found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    </UserLayout>
  );
};

export default Discoverpage;
