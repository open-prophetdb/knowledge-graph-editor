import { HashRouter, Route, Routes, Navigate } from "react-router-dom";
import Editor from "./Editor";
import Login from "./Login";

import "./index.less";

import "@/content";

const Popup: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/editor" element={<Editor />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </HashRouter>
  );
};

export default Popup;
