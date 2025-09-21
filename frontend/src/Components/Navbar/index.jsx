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
          style={{ cursor: "pointer" }}
          onClick={() => {
            router.push("/");
          }}
        >
          Pro Connect
        </h2>
        <div className={style.navBarOptionContainer}>
          {authState.profileFetched && (
            <div style={{ display: "flex", gap: "1.2rem" }}>
              <p>Hey, {authState.user?.userId?.name}</p>
              <p onClick={()=>{
                router.push('/profile')
              }} style={{ fontWeight: "bold", cursor: "pointer" }}>Profile</p>
              <p
                onClick={() => {
                  localStorage.removeItem("token");
                  dispatch(reset());
                  router.push("/login");
                }}
                style={{ fontWeight: "bold", cursor: "pointer", color: "red" }}
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
