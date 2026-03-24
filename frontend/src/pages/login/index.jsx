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
              <p style={{ color: authState.isError ? "red" : "green" }}>
                {authState.message.message}
              </p>

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
                  onClick={() => {
                    if (userLoginMethod) {
                      handleLogin();
                    } else {
                      handleRegister();
                    }
                  }}
                  className={style.buttonWithOutline}
                >
                  {userLoginMethod ? "Sign In " : "Sign Up"}
                </button>
              </div>
            </div>
            <div className={style.cardContainer_right}>
              <div>
                {userLoginMethod ? (
                  <p>Don't Have an Account ?</p>
                ) : (
                  <p>Already Have an Account ?</p>
                )}
                <button
                  onClick={() => {
                    setUserLoginMethod(!userLoginMethod);
                  }}
                  className={style.buttonWithOutline}
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
