import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { JGILogo } from "../components/Watermark";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { toast } from "sonner";
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { API } from "../App";

export const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!token) {
            setError("Invalid or missing reset token.");
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            await axios.post(`${API}/auth/reset-password`, {
                token,
                new_password: password
            });
            setSuccess(true);
            toast.success("Password reset successfully!");
            setTimeout(() => navigate("/login"), 3000);
        } catch (err) {
            const message = err.response?.data?.detail || "Failed to reset password. The link may have expired.";
            toast.error(message);
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md">
                <div className="flex items-center justify-center gap-3 mb-8">
                    <JGILogo size={56} />
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">JAIN University</h1>
                        <p className="text-sm text-slate-500">Learning Management System</p>
                    </div>
                </div>

                <Card className="border-0 shadow-lg">
                    <CardHeader className="space-y-1 pb-6">
                        <CardTitle className="text-2xl font-bold text-slate-900">
                            {success ? "Password Reset!" : "Create New Password"}
                        </CardTitle>
                        <CardDescription>
                            {success
                                ? "Your password has been reset successfully."
                                : "Enter your new password below."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && !success ? (
                            <div className="text-center space-y-6">
                                <div className="flex justify-center">
                                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                        <XCircle className="w-8 h-8 text-red-600" />
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600">{error}</p>
                                <Link to="/forgot-password">
                                    <Button variant="outline" className="w-full">
                                        Request New Link
                                    </Button>
                                </Link>
                            </div>
                        ) : success ? (
                            <div className="text-center space-y-6">
                                <div className="flex justify-center">
                                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600">
                                    Redirecting to login page...
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-slate-700">
                                        New Password
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter new password"
                                            className="pl-10 pr-10"
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-slate-700">
                                        Confirm Password
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="confirmPassword"
                                            type={showPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm new password"
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-[#1a365d] hover:bg-[#102a43] text-white py-6"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Resetting...
                                        </>
                                    ) : (
                                        "Reset Password"
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
