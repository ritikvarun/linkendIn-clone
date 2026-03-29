import React from "react";
import style from "./style.module.css";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { reset } from "@/config/redux/reducer/authReducer";
const Navbar = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  return (
    <div className={style.container}>
      <div className={style.navBar}>
        <h2
          className={style.logo}
          onClick={() => {
            router.push("/");
          }}
        >
          Linkedin (WebApp)
        </h2>
        <div className={style.navBarOptionContainer}>
          {authState.profileFetched && (
            <div className={style.navLinks}>
              <p className={style.welcomeText}>Hey, {authState.user?.userId?.name}</p>
              <p
                onClick={() => {
                  router.push("/profile");
                }}
                className={style.navLink}
              >
                Profile
              </p>
              <p
                onClick={() => {
                  localStorage.removeItem("token");
                  dispatch(reset());
                  router.push("/login");
                }}
                className={style.logoutLink}
              >
                Logout
              </p>
            </div>
          )}
          {!authState.profileFetched && (
            <div
              onClick={() => {
                router.push("/login");
              }}
              className={style.buttonJoin}
            >
              <p>Be a part</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
