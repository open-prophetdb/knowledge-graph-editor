// eslint-disable-next-line no-undef
/*global chrome*/

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Spin, message } from "antd";
import imgLogo from "./logo.png";
import "./login.less";
import { prefix, setToken, targetWebsite } from "@/api/swagger/KnowledgeGraph";

function Login() {
  // 设置路由钩子
  const navigate = useNavigate();

  const [loginFailed, setLoginFailed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  function getJwtAccessToken() {
    const cookieQuery = {
      url: targetWebsite,
      name: "jwt_access_token",
    };

    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const tab = tabs[0].url;
        const url = new URL(tab);
        console.log("Current Tab url: ", url);

        if (url.origin === targetWebsite) {
          chrome.cookies.get(cookieQuery, function (cookie) {
            if (cookie) {
              console.log("cookie", cookie);
              resolve(`Bearer ${cookie.value}`);
            } else {
              reject("Cannot get the token from the prophet studio!");
            }
          });
        } else {
          reject("Please open the prophet studio and login first!");
        }
      });
    });
  }

  const checkAuth = async () => {
    if (prefix.startsWith("http://localhost")) {
      navigate("/editor");
      return;
    }

    let AUTH_TOKEN = window.localStorage.getItem("AUTH_TOKEN");
    if (AUTH_TOKEN) {
      setLoading(true);
      const url = prefix + "/api/v1/statistics";
      console.log("Access url: ", url);
      fetch(url, {
        method: "GET",
        headers: {
          Authorization: AUTH_TOKEN,
        },
      })
        .then((res) => {
          setLoginFailed(false);
          message.success("Login successfully!");
          window.localStorage.setItem("AUTH_TOKEN", AUTH_TOKEN);
          setToken(AUTH_TOKEN).then(() => {
            setLoading(false);
            navigate("/editor");
          });
        })
        .catch((err) => {
          console.log("checkAuth error: ", err);
          setLoginFailed(true);
          message.error("Cannot get the token from the prophet studio!");
          setLoading(false);
        });
    } else {
      getJwtAccessToken()
        .then((jwt_access_token) => {
          if (jwt_access_token) {
            window.localStorage.setItem("AUTH_TOKEN", jwt_access_token);
            checkAuth();
          }
        })
        .catch((err) => {
          setLoginFailed(true);
          message.error(err);
        });
    }
  };

  return (
    <div className="login">
      <img src={imgLogo} alt="" className="logo" />
      <p className="title">
        {loginFailed &&
          "Cannot get the token from the prophet studio, please ensure you are logged in the prophet studio and try again."}
        {!loginFailed && "Try to login with your prophet studio account."}
      </p>
      <Spin spinning={loading} />
    </div>
  );
}

export default Login;
