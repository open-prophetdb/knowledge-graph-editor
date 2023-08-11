import { HashRouter, Route, Routes, Navigate } from "react-router-dom";
import Editor from "./Editor";

import "./index.less";

import "@/content";

const Popup: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/editor" element={<Editor />} />
        <Route path="*" element={<Navigate to="/editor" />} />
      </Routes>
    </HashRouter>
  );
};

export default Popup;
