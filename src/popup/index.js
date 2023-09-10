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
  getToken,
  cleanToken,
  getJwtAccessToken,
} from "@/api/swagger/KnowledgeGraph";

function Login() {
  const [loginFailed, setLoginFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [kgeVisible, setKgeVisible] = useState(false);
  const [times, setTimes] = useState(0);

  const maxRetryTimes = 3;

  useEffect(() => {
    checkAuth();
  }, []);

  const afterLoginSuccess = () => {
    message.success("Knowledge Graph Editor is ready!");
    setLoginFailed(false);
    setLoading(false);
    setLoggedIn(true);
  };

  const afterLoginFailed = (err) => {
    message.error(err || "Cannot get the token from the prophet studio!");
    cleanToken();
    setLoginFailed(true);
    setLoading(false);
    setLoggedIn(false);
  };

  const checkAuth = async () => {
    if (prefix.startsWith("http://localhost")) {
      setLoggedIn(true);
      return;
    }

    setTimes(times + 1);
    getToken()
      .then((AUTH_TOKEN) => {
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
      })
      .catch((err) => {
        // We might not get the token on the first time, because the label studio is not ready yet. So we need to try several times.
        if (times < maxRetryTimes) {
          getJwtAccessToken()
            .then((jwt_access_token) => {
              if (jwt_access_token) {
                setToken(jwt_access_token).then(() => {
                  checkAuth();
                });
              }
            })
            .catch((err) => {
              checkAuth();
            });
        } else {
          afterLoginFailed(err);
        }
      });
  };

  const showKGE = () => {
    setKgeVisible(true);
  };

  return loggedIn ? (
    chrome && chrome.tabs && chrome.cookies ? (
      <Editor />
    ) : (
      <div className="knowledge-graph-editor-container">
        <Button
          icon={<ForkOutlined />}
          type="primary"
          shape="round"
          onClick={showKGE}
        >
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
