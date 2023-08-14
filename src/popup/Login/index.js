import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, message } from "antd";
import imgLogo from "./logo.png";
import "./login.less";
import { prefix, setToken } from "@/api/swagger/KnowledgeGraph";

function Login() {
  // 设置路由钩子
  const navigate = useNavigate();

  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  function authenticateUser(user, password) {
    var token = user + ":" + password;

    // Should i be encoding this value????? does it matter???
    // Base64 Encoding -> btoa
    var hash = btoa(token);

    return "Basic " + hash;
  }

  const checkAuth = () => {
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
          message.success("Login successfully!");
          window.localStorage.setItem("AUTH_TOKEN", AUTH_TOKEN);
          setToken(AUTH_TOKEN).then(() => {
            setLoading(false);
            navigate("/editor");
          });
        })
        .catch((err) => {
          message.error("Wrong account or password, please login again!");
          setLoading(false);
        });
    } else {
      message.error("Wrong account or password, please login again!");
    }
  };

  const login = () => {
    if (account && password) {
      const AUTH_TOKEN = authenticateUser(account, password);
      window.localStorage.setItem("AUTH_TOKEN", AUTH_TOKEN);
      checkAuth();
    } else {
      message.error("Please input account and password!");
    }
  };

  return (
    <div className="login">
      <img src={imgLogo} alt="" className="logo" />
      <div className="ipt-con">
        <Input
          placeholder="Account"
          value={account}
          onChange={(e) => {
            setAccount(e.target.value);
          }}
        />
      </div>
      <div className="ipt-con">
        <Input.Password
          placeholder="Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
          }}
        />
      </div>
      <div className="ipt-con">
        <Button
          type="primary"
          block={true}
          onClick={login}
          loading={loading}
          disabled={loading}
        >
          Login
        </Button>
      </div>
    </div>
  );
}

export default Login;
