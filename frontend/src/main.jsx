import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import PublicLayout  from "./layouts/PublicLayout";
import AdminLayout   from "./layouts/AdminLayout";
import Home          from "./pages/Home";
import ProjectDetail from "./pages/ProjectDetail";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProjects  from "./pages/AdminProjects";

import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* ─── PUBLIC ─── */}
          <Route element={<PublicLayout />}>
            <Route index        element={<Home />} />
            <Route path="project/:id" element={<ProjectDetail />} />
          </Route>

          {/* ─── ADMIN ─── */}
          <Route path="admin" element={<AdminLayout />}>
            <Route index        element={<AdminDashboard />} />
            <Route path="projects" element={<AdminProjects />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
