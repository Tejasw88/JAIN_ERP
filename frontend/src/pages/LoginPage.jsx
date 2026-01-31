import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../App";
import { JGILogo } from "../components/Watermark";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Mail, Lock, User, AlertCircle } from "lucide-react";

export const LoginPage = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const redirectMap = {
        Admin: "/admin",
        Teacher: "/teacher",
        Student: "/dashboard",
        Parent: "/parent"
      };
      navigate(redirectMap[user.role] || "/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userData = await login(identifier, password);
      toast.success(`Welcome back, ${userData.full_name}!`);

      // Check if user must change password first
      if (userData.must_change_password) {
        navigate("/change-password");
        return;
      }

      const redirectMap = {
        Admin: "/admin",
        Teacher: "/teacher",
        Student: "/dashboard",
        Parent: "/parent"
      };

      const from = location.state?.from?.pathname;
      navigate(from || redirectMap[userData.role] || "/dashboard");
    } catch (err) {
      const message = err.response?.data?.detail || "Login failed. Please check your credentials.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#1a365d] overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        >
          <source src="/vdo/videoplayback.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <JGILogo size={80} className="mb-8" />
          <h1 className="text-4xl font-bold mb-4 font-[Manrope]">JAIN University</h1>
          <p className="text-xl text-slate-200 mb-6">Learning Management System</p>
          <p className="text-slate-300 leading-relaxed max-w-md">
            Access your courses, grades, attendance, and more. A comprehensive platform
            designed for students, teachers, and parents.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md animate-fadeIn">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <JGILogo size={56} />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">JAIN University</h1>
              <p className="text-sm text-slate-500">Learning Management System</p>
            </div>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-slate-900">Welcome back</CardTitle>
              <CardDescription>Enter your credentials to access your account</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="identifier" className="text-slate-700">
                    Username or Email
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="identifier"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Enter username or email"
                      className="pl-10"
                      required
                      data-testid="login-identifier"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      required
                      data-testid="login-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      data-testid="toggle-password"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#1a365d] hover:bg-[#102a43] text-white py-6"
                  disabled={loading}
                  data-testid="login-submit"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>

                <div className="text-center mt-4">
                  <a
                    href="/forgot-password"
                    className="text-sm text-[#1a365d] hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
              </form>


            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
