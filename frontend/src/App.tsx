import { useMemo, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import CreateProjectModal from "./components/modal/CreateProjectModal";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Settings from "./pages/Settings";
import ProjectView from "./pages/ProjectView";
import ResetPassword from "./pages/ResetPassword";
import About from "./pages/About";
import Playground from "./pages/Playground";
import "./styles/app.css";

export default function App() {
  const location = useLocation();
  const [showCreateProject, setShowCreateProject] = useState(false);

  const isProjectRoute = useMemo(
    () => location.pathname.startsWith("/projects/"),
    [location.pathname],
  );
  const isPlaygroundRoute = location.pathname === "/playground";
  const hideNavbar = isProjectRoute || isPlaygroundRoute;

  const handleOpenCreateProject = () => {
    setShowCreateProject(true);
  };

  const handleCloseCreateProject = () => {
    setShowCreateProject(false);
  };

  const mainClassName = hideNavbar
    ? "flex-1 min-h-0 flex"
    : "app-main flex-1";

  return (
    <div className="app-shell flex flex-col min-h-screen">
      {!hideNavbar && (
        <Navbar onCreateProject={handleOpenCreateProject} />
      )}

      <main className={mainClassName}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile" element={<Profile key="self" />} />
          <Route path="/profile/:userId" element={<Profile key="other" />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/playground" element={<Playground />} />
          <Route path="/about" element={<About />} />
          <Route path="/projects/:projectId" element={<ProjectView />} />
        </Routes>
      </main>

      <CreateProjectModal
        open={showCreateProject}
        onClose={handleCloseCreateProject}
      />
    </div>
  );
}
