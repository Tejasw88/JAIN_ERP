import React, { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "sonner";

// Pages
import { LoginPage } from "./pages/LoginPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { TeacherDashboard } from "./pages/TeacherDashboard";
import { StudentDashboard } from "./pages/StudentDashboard";
import { ParentDashboard } from "./pages/ParentDashboard";
import { CoursesPage } from "./pages/CoursesPage";
import { GradesPage } from "./pages/GradesPage";
import { AttendancePage } from "./pages/AttendancePage";
import { ClassworkPage } from "./pages/ClassworkPage";
import { CodeIDE } from "./pages/CodeIDE";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { TimetablePage } from "./pages/TimetablePage";
import { LeaveRequestPage } from "./pages/LeaveRequestPage";
import { HODDashboard } from "./pages/HODDashboard";
import { ExamLocatorPage } from "./pages/ExamLocatorPage";
import { UserManagement } from "./pages/UserManagement";
import { SettingsPage } from "./pages/SettingsPage";

import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

// API instance with auth header
export const apiClient = axios.create({
  baseURL: API,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Transform Pydantic validation errors (array of objects) into strings
    // to prevent React "Objects are not valid as a React child" crash in toasts
    if (error.response?.data?.detail && Array.isArray(error.response.data.detail)) {
      const messages = error.response.data.detail.map(err => {
        const loc = err.loc ? err.loc.filter(l => l !== 'body').join('.') : '';
        return `${loc ? loc + ': ' : ''}${err.msg}`;
      });
      error.response.data.detail = messages.join(', ');
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Auth Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      // Verify token is still valid
      apiClient.get("/auth/me")
        .then((res) => {
          setUser(res.data);
          localStorage.setItem("user", JSON.stringify(res.data));
        })
        .catch(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (identifier, password) => {
    const response = await apiClient.post("/auth/login", { identifier, password });
    const { token, user: userData } = response.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);

    return userData;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a365d]"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard
    const redirectMap = {
      Admin: "/admin",
      Teacher: "/teacher",
      Student: "/dashboard",
      Parent: "/parent"
    };
    return <Navigate to={redirectMap[user.role] || "/login"} replace />;
  }

  return children;
};

// Role-based redirect after login
const RoleRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      const redirectMap = {
        Admin: "/admin",
        Teacher: "/teacher",
        Student: "/dashboard",
        Parent: "/parent"
      };
      navigate(redirectMap[user.role] || "/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a365d]"></div>
      </div>
    );
  }

  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RoleRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/change-password" element={
            <ProtectedRoute allowedRoles={["Admin", "Teacher", "Student", "Parent"]}>
              <ChangePasswordPage />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <UserManagement />
            </ProtectedRoute>
          } />

          <Route path="/teacher" element={
            <ProtectedRoute allowedRoles={["Teacher"]}>
              <TeacherDashboard />
            </ProtectedRoute>
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={["Student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          } />

          <Route path="/parent" element={
            <ProtectedRoute allowedRoles={["Parent"]}>
              <ParentDashboard />
            </ProtectedRoute>
          } />

          <Route path="/courses" element={
            <ProtectedRoute allowedRoles={["Admin", "Teacher", "Student"]}>
              <CoursesPage />
            </ProtectedRoute>
          } />

          <Route path="/grades" element={
            <ProtectedRoute allowedRoles={["Admin", "Teacher", "Student", "Parent"]}>
              <GradesPage />
            </ProtectedRoute>
          } />

          <Route path="/attendance" element={
            <ProtectedRoute allowedRoles={["Admin", "Teacher", "Student", "Parent"]}>
              <AttendancePage />
            </ProtectedRoute>
          } />

          <Route path="/classwork" element={
            <ProtectedRoute allowedRoles={["Admin", "Teacher", "Student"]}>
              <ClassworkPage />
            </ProtectedRoute>
          } />

          <Route path="/ide" element={
            <ProtectedRoute allowedRoles={["Admin", "Teacher", "Student"]}>
              <CodeIDE />
            </ProtectedRoute>
          } />

          <Route path="/timetable" element={
            <ProtectedRoute allowedRoles={["Admin", "Teacher", "Student"]}>
              <TimetablePage />
            </ProtectedRoute>
          } />

          <Route path="/leave" element={
            <ProtectedRoute allowedRoles={["Teacher", "Student"]}>
              <LeaveRequestPage />
            </ProtectedRoute>
          } />

          <Route path="/hod" element={
            <ProtectedRoute allowedRoles={["Teacher"]}>
              <HODDashboard />
            </ProtectedRoute>
          } />

          <Route path="/exams" element={
            <ProtectedRoute allowedRoles={["Admin", "Student"]}>
              <ExamLocatorPage />
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute allowedRoles={["Admin", "Teacher", "Student", "Parent"]}>
              <SettingsPage />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
