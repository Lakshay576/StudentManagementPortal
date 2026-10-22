import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Pages/Auth/Login";
import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Schools from "./Pages/Superadmin/School/SchoolsPage";
import Profile from "./Pages/Superadmin/Profile/Profile";
import Videos from "./Pages/Superadmin/Video/VideoPage";
import Dashboard from "./Pages/Superadmin/Dashboard/DashboardPage";
import Student from "./Pages/Admin/Students/StudentsPage";
import SchoolVideos from "./Pages/Admin/SchoolVideo/SchoolVideoPage";


const Soon = ({ title }) => <h1 className="text-xl font-semibold">{title}</h1>;


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute allowedRoles={["SuperAdmin"]} />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="schools" element={<Schools />} />
          <Route path="videos" element={<Videos />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["SchoolAdmin"]} />}>
        <Route path="/school-admin" element={<DashboardLayout />}>
          <Route index element={<Soon title="School Admin Dashboard" />} />
          <Route path="students" element={<Student />} />
          <Route path="school-videos" element={<SchoolVideos />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["Student"]} />}>
        <Route path="/student" element={<DashboardLayout />}>
          <Route index element={<Soon title="Student Dashboard" />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
