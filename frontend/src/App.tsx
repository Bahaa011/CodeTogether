import { useMemo, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import CreateProjectModal from "./components/CreateProjectModal";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import ProjectView from "./pages/ProjectView";
import ResetPassword from "./pages/ResetPassword";
import About from "./pages/About";
import Explore from "./pages/Explore";
import Teams from "./pages/Teams";
import "./styles/app.css";

export default function App() {
  const location = useLocation();
  const [showCreateProject, setShowCreateProject] = useState(false);

  const isProjectRoute = useMemo(
    () => location.pathname.startsWith("/projects/"),
    [location.pathname],
  );

  const handleOpenCreateProject = () => {
    setShowCreateProject(true);
  };

  const handleCloseCreateProject = () => {
    setShowCreateProject(false);
  };

  const mainClassName = isProjectRoute
    ? "flex-1 min-h-0 flex"
    : "app-main flex-1";

  return (
    <div className="app-shell flex flex-col min-h-screen">
      {!isProjectRoute && (
        <Navbar onCreateProject={handleOpenCreateProject} />
      )}

      <main className={mainClassName}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/teams" element={<Teams />} />
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
