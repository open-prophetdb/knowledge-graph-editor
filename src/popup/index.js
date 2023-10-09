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
  getProjectId,
  initRequest,
  getJwtAccessToken,
  getUserFromToken,
  checkChromeCookiesVar,
  checkChromeTabsVar,
} from "@/api/swagger/KnowledgeGraph";


function Login() {
  const [loginFailed, setLoginFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [kgeVisible, setKgeVisible] = useState(false);
  const [curator, setCurator] = useState(null);
  const [activeOrg, setActiveOrg] = useState(null);

  const maxRetryTimes = 3;

  useEffect(() => {
    checkAuth(1);
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
    message.error(err || "Cannot get the token from the prophet studio, please ensure you are logged in the prophet studio and try again or relogin.");
    setLoginFailed(true);
    setLoading(false);
    setLoggedIn(false);
  };

  const checkAuth = async (times) => {
    if (prefix.startsWith("http://localhost")) {
      setLoggedIn(true);
      return;
    }

    // We might not get the token on the first time, because the label studio is not ready yet. So we need to try several times.
    if (times < maxRetryTimes) {
      getJwtAccessToken()
        .then((jwt_access_token) => {
          const user = getUserFromToken(jwt_access_token);
          setCurator(user.username);
          setActiveOrg(user.active_organization);
          afterLoginSuccess(jwt_access_token);
        })
        .catch((err) => {
          checkAuth(times + 1);
        });
    } else {
      afterLoginFailed();
    }
  };

  const showKGE = () => {
    setKgeVisible(true);
  };

  return loggedIn ? (
    // To be compatible with the chrome extension, we need to check the chrome object.
    (checkChromeTabsVar() && checkChromeCookiesVar()) ? (
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
          open={kgeVisible}
          closable={true}
          onCancel={() => setKgeVisible(false)}
          footer={null}
        >
          <Editor
            key={`${curator}-${activeOrg}-${getProjectId()}`}
            curator={curator}
            activeOrg={activeOrg}
            projectId={getProjectId()}
          />
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
