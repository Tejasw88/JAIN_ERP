import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { JGILogo } from "../components/Watermark";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { toast } from "sonner";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { API } from "../App";

export const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await axios.post(`${API}/auth/forgot-password`, { email });
            setSent(true);
            toast.success("Password reset email sent!");
        } catch (err) {
            const message = err.response?.data?.detail || "Failed to send reset email. Please try again.";
            toast.error(message);
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
                            {sent ? "Check Your Email" : "Forgot Password"}
                        </CardTitle>
                        <CardDescription>
                            {sent
                                ? "We've sent a password reset link to your email address."
                                : "Enter your email address and we'll send you a reset link."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {sent ? (
                            <div className="text-center space-y-6">
                                <div className="flex justify-center">
                                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600">
                                    If an account exists for <strong>{email}</strong>, you will receive an email with instructions to reset your password.
                                </p>
                                <Link to="/login">
                                    <Button variant="outline" className="w-full">
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back to Login
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-slate-700">
                                        Email Address
                                    </Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your email"
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
                                            Sending...
                                        </>
                                    ) : (
                                        "Send Reset Link"
                                    )}
                                </Button>

                                <div className="text-center">
                                    <Link
                                        to="/login"
                                        className="text-sm text-[#1a365d] hover:underline inline-flex items-center gap-1"
                                    >
                                        <ArrowLeft className="w-3 h-3" />
                                        Back to Login
                                    </Link>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
