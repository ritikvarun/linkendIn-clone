import React from "react";
import style from "./style.module.css";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { reset } from "@/config/redux/reducer/authReducer";
const Navbar = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);

  const [hasToken, setHasToken] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setHasToken(!!localStorage.getItem("token"));
    }
  }, [authState.isTokenThere]);

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
          {hasToken ? (
            <div className={style.navLinks}>
              <p className={style.welcomeText}>
                Hey, {authState.user?.userId?.name || "User"}
              </p>
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
          ) : (
            <div
              onClick={() => {
                router.push("/login");
              }}
              className={style.buttonJoin}
            >
              <p>Join Now</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
