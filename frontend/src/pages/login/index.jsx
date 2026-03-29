import UserLayout from "@/layout/UserLayout";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import style from "./style.module.css";
import {
  loginUser,
  registerUser,
} from "@/config/redux/action/authAction/index.js";
import { emptyMessage } from "@/config/redux/reducer/authReducer";

const LoginComponent = () => {
  const authState = useSelector((state) => state.auth);
  const router = useRouter();
  const dispatch = useDispatch();
  const [userLoginMethod, setUserLoginMethod] = useState(false);

  const [email, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (authState.loggedIn && localStorage.getItem("token")) {
      router.push("/dashboard");
    }
  }, [authState.loggedIn, router]);
  useEffect(() => {
    dispatch(emptyMessage());
  }, [userLoginMethod]);

  const handleRegister = () => {
    console.log("Register....");
    dispatch(registerUser({ username, password, email, name }));
  };
  const handleLogin = () => {
    console.log("Login...");
    dispatch(loginUser({ email, password }));
  };
  return (
    <>
      <UserLayout>
        <div className={style.container}>
          <div className={style.cardContainer}>
            <div className={style.cardContainer_left}>
              <p className={style.cardLeft_heading}>
                {userLoginMethod ? "Sign In " : "Sign Up"}
              </p>
              {authState.message ? (
                <p className={authState.isError ? style.errorMessage : style.successMessage}>
                  {typeof authState.message === "string" ? authState.message : authState.message.message}
                </p>
              ) : null}

              <div className={style.inputContainer}>
                {!userLoginMethod && (
                  <div className={style.inputRow}>
                    <input
                      onChange={(e) => setUsername(e.target.value)}
                      className={style.inputField}
                      type="text"
                      placeholder="Username"
                    />
                    <input
                      onChange={(e) => setName(e.target.value)}
                      className={style.inputField}
                      type="text"
                      placeholder="Name"
                    />
                  </div>
                )}
                <input
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className={style.inputField}
                  type="email"
                  placeholder="Email"
                />
                <input
                  onChange={(e) => setPassword(e.target.value)}
                  className={style.inputField}
                  type="password"
                  placeholder="Password"
                />

                <button
                  disabled={authState.isLoading}
                  onClick={() => {
                    if (userLoginMethod) {
                      handleLogin();
                    } else {
                      handleRegister();
                    }
                  }}
                  className={style.buttonWithOutline}
                >
                  {authState.isLoading ? "Loading..." : (userLoginMethod ? "Sign In " : "Sign Up")}
                </button>
              </div>
            </div>
            <div className={style.cardContainer_right}>
              <div>
                {userLoginMethod ? (
                  <p className={style.cardContainer_rightText}>Don't Have an Account ?</p>
                ) : (
                  <p className={style.cardContainer_rightText}>Already Have an Account ?</p>
                )}
                <button
                  onClick={() => {
                    setUserLoginMethod(!userLoginMethod);
                  }}
                  className={style.cardContainer_rightButton}
                >
                  {userLoginMethod ? "Sign Up " : "Sign In"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </UserLayout>
    </>
  );
};

export default LoginComponent;
