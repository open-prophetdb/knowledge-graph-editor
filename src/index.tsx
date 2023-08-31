import React from "react";
import ReactDOM from "react-dom";
import { ConfigProvider } from "antd";
import enUS from "antd/lib/locale/en_US";
import KGEditor from "./popup";
// @ts-ignore
import { targetWebsite } from "@/api/swagger/KnowledgeGraph";

import "@/content";

const antdConfig = {
  locale: enUS,
};

const url = window.location.href;

if (url.startsWith(`${targetWebsite}/projects`)) {
  console.log("Knowledge Graph Editor is running...");
  ReactDOM.render(
    <ConfigProvider {...antdConfig}>
      <KGEditor />
    </ConfigProvider>,
    document.getElementById("kge-root")
  );
}
