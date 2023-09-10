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
  initRequest,
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

  const afterLoginSuccess = (token) => {
    // Initalize the request configuration, load the authentication token from the local storage.
    initRequest(token);
    // message.success("Knowledge Graph Editor is ready!");
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

    setTimes(times + 1);
    // We might not get the token on the first time, because the label studio is not ready yet. So we need to try several times.
    if (times < maxRetryTimes) {
      getJwtAccessToken()
        .then((jwt_access_token) => {
          afterLoginSuccess(jwt_access_token);
        })
        .catch((err) => {
          checkAuth();
        });
    } else {
      afterLoginFailed();
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
