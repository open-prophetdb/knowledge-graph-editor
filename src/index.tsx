import React from "react";
import ReactDOM from "react-dom";
import { ConfigProvider } from "antd";
import enUS from "antd/lib/locale/en_US";

import Popup from "./popup";

const antdConfig = {
  locale: enUS,
};

ReactDOM.render(
  <ConfigProvider {...antdConfig}>
    <Popup />
  </ConfigProvider>,
  document.getElementById("root")
);
