// eslint-disable-next-line no-undef
/*global chrome*/

import { useEffect, useState } from "react";
import { Spin, message, Button, Modal } from "antd";
import { ForkOutlined } from "@ant-design/icons";
import imgLogo from "./logo.png";
import "./index.less";
import Editor from "./Editor";
import {
  prefix,
  setToken,
  targetWebsite,
  getToken,
} from "@/api/swagger/KnowledgeGraph";

function Login() {
  const [loginFailed, setLoginFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [kgeVisible, setKgeVisible] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    console.log("parts", parts);
    if (parts.length === 2) return parts.pop().split(";").shift();
  }

  function getJwtAccessToken() {
    const cookieQuery = {
      url: targetWebsite,
      name: "jwt_access_token",
    };

    return new Promise((resolve, reject) => {
      if (chrome && chrome.tabs && chrome.cookies) {
        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
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
          }
        );
      } else {
        console.log("Run in normal web page, auth token is go");
        resolve(`Bearer ${getCookie(cookieQuery.name)}`);
      }
    });
  }

  const afterLoginSuccess = () => {
    message.success("Knowledge Graph Editor is ready!");
    setLoginFailed(false);
    setLoading(false);
    setLoggedIn(true);
  };

  const afterLoginFailed = (err) => {
    message.error(err || "Cannot get the token from the prophet studio!");
    setLoginFailed(true);
    setLoading(false);
    setLoggedIn(false);
  };

  const checkAuth = async () => {
    if (prefix.startsWith("http://localhost")) {
      setLoggedIn(true);
      return;
    }

    let AUTH_TOKEN = await getToken();
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
          setToken(AUTH_TOKEN).then(() => {
            afterLoginSuccess();
          });
        })
        .catch((err) => {
          console.log("checkAuth error: ", err);
          afterLoginFailed();
        });
    } else {
      getJwtAccessToken()
        .then((jwt_access_token) => {
          if (jwt_access_token) {
            setToken(jwt_access_token).then(() => {
              checkAuth();
            });
          }
        })
        .catch((err) => {
          afterLoginFailed(err);
        });
    }
  };

  const showKGE = () => {
    setKgeVisible(true);
  };

  return loggedIn ? (
    chrome && chrome.tabs && chrome.cookies ? (
      <Editor />
    ) : (
      <div className="knowledge-graph-editor-container">
        <Button icon={<ForkOutlined />} type="primary" shape="round" onClick={showKGE}>
          KG Editor
        </Button>
        <Modal
          className="knowledge-graph-editor-modal"
          width={"100%"}
          title="Knowledge Graph Editor"
          visible={kgeVisible}
          closable={true}
          onCancel={() => setKgeVisible(false)}
          footer={null}
        >
          <Editor />
        </Modal>
      </div>
    )
  ) : (
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
