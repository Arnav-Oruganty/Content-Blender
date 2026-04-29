import { Routes, Route, NavLink } from "react-router-dom";
import ComposerPage from "./pages/ComposerPage";
import CbankPage from "./pages/CbankPage";
import BlendListPage from "./pages/BlendListPage";
import "./styles/app.css";

export default function App() {
  return (
    <div className="app-shell">
      <nav className="top-nav">
        <span className="nav-logo">Content Blender</span>
        <NavLink to="/" end className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
          Composer
        </NavLink>
        <NavLink to="/cbank" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
          CBank
        </NavLink>
        <NavLink to="/blends" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
          Documents
        </NavLink>
      </nav>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<ComposerPage />} />
          <Route path="/composer/:blendId" element={<ComposerPage />} />
          <Route path="/cbank" element={<CbankPage />} />
          <Route path="/blends" element={<BlendListPage />} />
        </Routes>
      </main>
    </div>
  );
}
