import React, { useState } from "react";
import { useAuth, apiClient } from "../App";
import { DashboardLayout } from "../components/DashboardLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Lock, Shield, User } from "lucide-react";

export const SettingsPage = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Password Form State
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            await apiClient.post("/auth/change-password", {
                current_password: currentPassword,
                new_password: newPassword
            });
            toast.success("Password updated successfully");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            const message = err.response?.data?.detail || "Failed to update password";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout title="Settings">
            <div className="max-w-4xl mx-auto space-y-6">
                <Tabs defaultValue="security" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="security">Security</TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Profile Information</CardTitle>
                                <CardDescription>
                                    View your account details. Contact admin to request changes.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Full Name</Label>
                                        <Input value={user?.full_name} disabled className="bg-slate-50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input value={user?.email} disabled className="bg-slate-50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Username</Label>
                                        <Input value={user?.username} disabled className="bg-slate-50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Role</Label>
                                        <Input value={user?.role} disabled className="bg-slate-50" />
                                    </div>
                                    {user?.department && (
                                        <div className="space-y-2">
                                            <Label>Department</Label>
                                            <Input value={user?.department} disabled className="bg-slate-50" />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Change Password</CardTitle>
                                <CardDescription>
                                    Update your password to keep your account secure.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
                                    <div className="space-y-2">
                                        <Label htmlFor="current">Current Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                            <Input
                                                id="current"
                                                type="password"
                                                className="pl-9"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new">New Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                            <Input
                                                id="new"
                                                type="password"
                                                className="pl-9"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                minLength={6}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm">Confirm New Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                            <Input
                                                id="confirm"
                                                type="password"
                                                className="pl-9"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <Button type="submit" disabled={loading}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Update Password
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
};
