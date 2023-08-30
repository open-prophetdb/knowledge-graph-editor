import React from "react";
import ReactDOM from "react-dom";
import { ConfigProvider } from "antd";
import enUS from "antd/lib/locale/en_US";
import KGEditor from "./popup";

import "@/content";

const antdConfig = {
  locale: enUS,
};

ReactDOM.render(
  <ConfigProvider {...antdConfig}>
    <KGEditor />
  </ConfigProvider>,
  document.getElementById("kge-root")
);
