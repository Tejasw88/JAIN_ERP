import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth, apiClient } from "../App";
import { Watermark, JGILogo } from "./Watermark";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  ClipboardList,
  Calendar,
  FileText,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  Settings,
  User,
  Code2
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";

const navItems = {
  Admin: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: Users, label: "Users", path: "/admin/users" },
    { icon: BookOpen, label: "Courses", path: "/courses" },
    { icon: ClipboardList, label: "Timetable", path: "/timetable" },
    { icon: GraduationCap, label: "Grades", path: "/grades" },
    { icon: Calendar, label: "Attendance", path: "/attendance" },
    { icon: FileText, label: "Classwork", path: "/classwork" },
    { icon: Calendar, label: "Exam Locator", path: "/exams" },
    { icon: Code2, label: "Code Editor", path: "/ide" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ],
  Teacher: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/teacher" },
    { icon: BookOpen, label: "My Courses", path: "/courses" },
    { icon: ClipboardList, label: "Timetable", path: "/timetable" },
    { icon: GraduationCap, label: "Grades", path: "/grades" },
    { icon: Calendar, label: "Attendance", path: "/attendance" },
    { icon: FileText, label: "Classwork", path: "/classwork" },
    { icon: FileText, label: "Leave Requests", path: "/leave" },
    { icon: Users, label: "HOD Dashboard", path: "/hod" },
    { icon: Code2, label: "Code Editor", path: "/ide" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ],
  Student: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: BookOpen, label: "Courses", path: "/courses" },
    { icon: ClipboardList, label: "Timetable", path: "/timetable" },
    { icon: GraduationCap, label: "Grades", path: "/grades" },
    { icon: Calendar, label: "Attendance", path: "/attendance" },
    { icon: FileText, label: "Classwork", path: "/classwork" },
    { icon: FileText, label: "Leave Requests", path: "/leave" },
    { icon: Calendar, label: "Exam Locator", path: "/exams" },
    { icon: Code2, label: "Code Editor", path: "/ide" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ],
  Parent: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/parent" },
    { icon: GraduationCap, label: "Grades", path: "/grades" },
    { icon: Calendar, label: "Attendance", path: "/attendance" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ],
};




export const DashboardLayout = ({ children, title }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  // Fetch notifications logic lifted to layout
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await apiClient.get("/notifications");
        setNotifications(res.data);
      } catch (error) {
        console.error("Failed to fetch notifications");
      } finally {
        setLoadingNotifications(false);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    try {
      await apiClient.put(`/notifications/${id}/read`);
    } catch (error) {
      console.error("Failed to mark as read");
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const items = navItems[user?.role] || [];
  const initials = user?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 sidebar-nav">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
            <JGILogo size={42} />
            <div>
              <h1 className="text-white font-bold text-lg tracking-tight">JAIN University</h1>
              <p className="text-slate-400 text-xs">Learning Management System</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {items.map((item) => {
              const isActive = location.pathname === item.path.split("?")[0];
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`sidebar-link ${isActive ? "active" : ""}`}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="px-4 py-4 border-t border-white/10">
            <div className="flex items-center gap-3 px-2">
              <Avatar className="h-10 w-10 bg-white/20">
                <AvatarFallback className="bg-[#f59e0b] text-white font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{user?.full_name}</p>
                <p className="text-slate-400 text-xs truncate">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 sidebar-nav animate-slideIn">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <JGILogo size={36} />
                  <span className="text-white font-bold">JAIN LMS</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 px-4 py-6 space-y-1">
                {items.map((item) => {
                  const isActive = location.pathname === item.path.split("?")[0];
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`sidebar-link ${isActive ? "active" : ""}`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                data-testid="mobile-menu-toggle"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight font-[Manrope]">
                {title}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-slate-600 relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-0">
                  <DropdownMenuLabel className="p-4 border-b">Notifications</DropdownMenuLabel>
                  <div className="max-h-[300px] overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="p-4 text-center text-sm text-slate-500">Loading...</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500">No notifications</div>
                    ) : (
                      <div className="divide-y">
                        {notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                            onClick={() => markAsRead(n.id)}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <h4 className={`text-sm ${!n.is_read ? 'font-semibold text-blue-900' : 'font-medium text-slate-900'}`}>
                                {n.title}
                              </h4>
                              <span className="text-[10px] text-slate-500">
                                {new Date(n.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className={`text-xs ${!n.is_read ? 'text-blue-700' : 'text-slate-500'} line-clamp-2`}>
                              {n.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2" data-testid="user-menu">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-[#1a365d] text-white text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline text-sm font-medium">{user?.full_name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user?.full_name}</span>
                      <span className="text-xs text-slate-500 font-normal">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600" data-testid="logout-button">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8 relative">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
          <Watermark />
        </main>
      </div>
    </div>
  );
};
