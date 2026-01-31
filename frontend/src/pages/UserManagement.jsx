import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
    Users,
    Search,
    Trash2,
    Loader2,
    Filter,
    UserCheck,
    GraduationCap,
    School,
    ShieldCheck,
    BookOpenCheck,
    MoreVertical,
    Check
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { Label } from "../components/ui/label";

const SECTIONS = ["A", "B", "C", "D", "E"];

export const UserManagement = () => {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [selectedDept, setSelectedDept] = useState("all");
    const [selectedRole, setSelectedRole] = useState("all");
    const [selectedSection, setSelectedSection] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Leadership Role State
    const [promotingTeacher, setPromotingTeacher] = useState(null);
    const [promotionType, setPromotionType] = useState(""); // "hod" or "class_teacher"
    const [promotionDept, setPromotionDept] = useState("");
    const [promotionYear, setPromotionYear] = useState("");
    const [promotionSection, setPromotionSection] = useState("A");
    const [conflict, setConflict] = useState(null);
    const [processing, setProcessing] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [usersRes, deptsRes] = await Promise.all([
                apiClient.get("/users"),
                apiClient.get("/departments")
            ]);
            setUsers(usersRes.data);
            setDepartments(deptsRes.data);
        } catch (error) {
            toast.error("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await apiClient.delete(`/users/${id}`);
            toast.success("User deleted successfully");
            fetchData();
        } catch (error) {
            toast.error("Failed to delete user");
        }
    };

    const handlePromotionCheck = async () => {
        setProcessing(true);
        try {
            if (promotionType === "hod") {
                const res = await apiClient.get(`/hod/check?department=${promotionDept}`);
                if (res.data) {
                    setConflict({
                        type: "hod",
                        existing: res.data.name,
                        message: `${res.data.name} is already HOD of ${promotionDept}. Replace them?`
                    });
                } else {
                    executePromotion();
                }
            } else if (promotionType === "class_teacher") {
                const res = await apiClient.get(`/timetable/class-teacher/check?department=${promotionDept}&year=${promotionYear}&section=${promotionSection}`);
                if (res.data) {
                    setConflict({
                        type: "class_teacher",
                        existing: res.data.teacher_name,
                        message: `${res.data.teacher_name} is already Class Teacher for ${promotionDept} Year ${promotionYear} Section ${promotionSection}. Replace them?`
                    });
                } else {
                    executePromotion();
                }
            }
        } catch (error) {
            toast.error("Check failed");
        } finally {
            setProcessing(false);
        }
    };

    const executePromotion = async () => {
        setProcessing(true);
        try {
            if (promotionType === "hod") {
                await apiClient.post("/hod/assign", {
                    teacher_id: promotingTeacher.id,
                    department: promotionDept
                });
                toast.success(`Promoted ${promotingTeacher.full_name} to HOD of ${promotionDept}`);
            } else {
                await apiClient.post("/timetable/class-teacher", {
                    teacher_id: promotingTeacher.id,
                    department: promotionDept,
                    year: promotionYear,
                    section: promotionSection
                });
                toast.success(`Assigned ${promotingTeacher.full_name} as Class Teacher`);
            }
            setPromotingTeacher(null);
            setConflict(null);
            fetchData();
        } catch (error) {
            toast.error("Promotion failed");
        } finally {
            setProcessing(false);
        }
    };

    const getRoleBadge = (role) => {
        const variants = {
            Admin: "bg-purple-100 text-purple-700",
            Teacher: "bg-blue-100 text-blue-700",
            Student: "bg-emerald-100 text-emerald-700",
            Parent: "bg-amber-100 text-amber-700"
        };
        return <Badge className={variants[role] || "bg-slate-100"}>{role}</Badge>;
    };

    const filteredUsers = users.filter(user => {
        // Role filter
        if (selectedRole !== "all" && user.role !== selectedRole) return false;
        if (user.role !== "Student" && user.role !== "Teacher") return false;

        // Search query
        const searchStr = searchQuery.toLowerCase();
        const matchesSearch =
            user.full_name?.toLowerCase().includes(searchStr) ||
            user.username?.toLowerCase().includes(searchStr) ||
            user.email?.toLowerCase().includes(searchStr) ||
            user.usn?.toLowerCase().includes(searchStr);

        if (!matchesSearch) return false;

        // Department filter
        if (selectedDept !== "all") {
            const uDept = String(user.department || "").toLowerCase().trim();
            const sDept = String(selectedDept).toLowerCase().trim();

            const deptObj = departments.find(d =>
                String(d.code || "").toLowerCase().trim() === sDept ||
                String(d.name || "").toLowerCase().trim() === sDept
            );

            const matchesDept =
                uDept === sDept ||
                (deptObj && (
                    String(deptObj.name || "").toLowerCase().trim() === uDept ||
                    String(deptObj.code || "").toLowerCase().trim() === uDept
                ));

            if (!matchesDept) return false;
        }

        // Section filter (Students only)
        if (selectedSection !== "all") {
            // When a section is selected, only students can match
            if (user.role !== "Student") return false;

            const uSectionRaw = String(user.section || "").toUpperCase().trim();
            const sSection = String(selectedSection).toUpperCase().trim();

            // Check for direct match (e.g. "B" === "B")
            // OR check for composite match (e.g. "AIDE - B" ends with " B" or is "B")
            const isMatch =
                uSectionRaw === sSection ||
                uSectionRaw.endsWith(`- ${sSection}`) ||
                uSectionRaw.endsWith(` ${sSection}`);

            if (!isMatch) return false;
        }

        return true;
    });

    if (loading) {
        return (
            <DashboardLayout title="User Management">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-[#1a365d]" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="User Management">
            <div className="space-y-6 animate-in fade-in duration-500">

                {/* Department Navigation */}
                <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                    <CardContent className="p-4">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-600 mb-2">
                                <School className="w-4 h-4" />
                                <span className="text-sm font-semibold uppercase tracking-wider">Departments</span>
                            </div>
                            <div className="overflow-x-auto pb-2 custom-scrollbar">
                                <Tabs value={selectedDept} onValueChange={setSelectedDept} className="w-full">
                                    <TabsList className="bg-slate-100/50 p-1 w-max">
                                        <TabsTrigger value="all" className="px-6 py-2">All Departments</TabsTrigger>
                                        {departments.map((dept) => (
                                            <TabsTrigger key={dept.id} value={dept.code || dept.name} className="px-6 py-2">
                                                {dept.code || dept.name}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </Tabs>
                            </div>

                            {/* Section Filters */}
                            {selectedRole !== "Teacher" && (
                                <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-200/60">
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm font-medium text-slate-500">Section:</span>
                                    </div>
                                    <div className="flex gap-2 mr-4 pr-4 border-r border-slate-200">
                                        <Button
                                            variant={selectedRole === "all" ? "secondary" : "ghost"}
                                            size="sm"
                                            onClick={() => setSelectedRole("all")}
                                            className="text-xs"
                                        >
                                            All Users
                                        </Button>
                                        <Button
                                            variant={selectedRole === "Student" ? "secondary" : "ghost"}
                                            size="sm"
                                            onClick={() => setSelectedRole("Student")}
                                            className="text-xs"
                                        >
                                            Students
                                        </Button>
                                        <Button
                                            variant={selectedRole === "Teacher" ? "secondary" : "ghost"}
                                            size="sm"
                                            onClick={() => setSelectedRole("Teacher")}
                                            className="text-xs"
                                        >
                                            Teachers
                                        </Button>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant={selectedSection === "all" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setSelectedSection("all")}
                                            className={selectedSection === "all" ? "bg-[#1a365d]" : ""}
                                        >
                                            All Sections
                                        </Button>
                                        {SECTIONS.map(s => (
                                            <Button
                                                key={s}
                                                variant={selectedSection === s ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setSelectedSection(s)}
                                                className={selectedSection === s ? "bg-[#1a365d]" : ""}
                                            >
                                                {s}
                                            </Button>
                                        ))}
                                    </div>

                                    <div className="ml-auto w-full md:w-64 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            placeholder="Search users..."
                                            className="pl-10 bg-white"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {selectedRole === "Teacher" && (
                                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                                    <div className="flex gap-2">
                                        <Button
                                            variant={selectedRole === "all" ? "secondary" : "ghost"}
                                            size="sm"
                                            onClick={() => setSelectedRole("all")}
                                            className="text-xs"
                                        >
                                            All Users
                                        </Button>
                                        <Button
                                            variant={selectedRole === "Student" ? "secondary" : "ghost"}
                                            size="sm"
                                            onClick={() => setSelectedRole("Student")}
                                            className="text-xs"
                                        >
                                            Students
                                        </Button>
                                        <Button
                                            variant={selectedRole === "Teacher" ? "secondary" : "ghost"}
                                            size="sm"
                                            onClick={() => setSelectedRole("Teacher")}
                                            className="text-xs"
                                        >
                                            Teachers
                                        </Button>
                                    </div>
                                    <div className="w-full md:w-64 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            placeholder="Search teachers..."
                                            className="pl-10 bg-white"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* User Table */}
                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-600" />
                                    User List
                                </CardTitle>
                                <CardDescription>
                                    Managing {filteredUsers.length} users in {selectedDept === "all" ? "All Departments" : selectedDept}
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                    <UserCheck className="w-3 h-3 mr-1" />
                                    {users.filter(u => u.role === "Student").length} Students
                                </Badge>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    <GraduationCap className="w-3 h-3 mr-1" />
                                    {users.filter(u => u.role === "Teacher").length} Teachers
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50">
                                        <TableHead className="font-semibold text-slate-700">Name</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Username</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Email</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Role</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Department</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Year</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Section</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
                                            <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="font-medium text-slate-900">
                                                    <div className="flex flex-col">
                                                        <span
                                                            className={user.role === 'Teacher' ? "hover:text-blue-600 cursor-pointer underline decoration-blue-200 underline-offset-4" : ""}
                                                            onClick={() => user.role === 'Teacher' && setPromotingTeacher(user)}
                                                        >
                                                            {user.full_name}
                                                        </span>
                                                        <div className="flex gap-1 mt-1">
                                                            {user.is_hod && (
                                                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] px-1 h-4">
                                                                    HOD
                                                                </Badge>
                                                            )}
                                                            {user.class_teacher_id && (
                                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1 h-4">
                                                                    Class Teacher
                                                                </Badge>
                                                            )}
                                                            {user.role === 'Teacher' && (
                                                                <span className="text-[10px] text-slate-400">Click to Promote</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-slate-600 font-mono text-xs">{user.username}</TableCell>
                                                <TableCell className="text-slate-500 text-sm">{user.email}</TableCell>
                                                <TableCell>{getRoleBadge(user.role)}</TableCell>
                                                <TableCell className="text-slate-600 font-medium">
                                                    {user.department || user.hod_department || <span className="text-slate-300">-</span>}
                                                </TableCell>
                                                <TableCell className="text-slate-500">
                                                    {user.role === "Student" ? (user.year || "-") : "-"}
                                                </TableCell>
                                                <TableCell className="text-slate-500 font-bold">
                                                    {user.role === "Student" ? (user.section || "-") : "-"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Users className="w-12 h-12 text-slate-200" />
                                                    <p>No users found matching the criteria</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                    }
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Promotion Dialog */}
            <Dialog open={!!promotingTeacher} onOpenChange={(open) => !open && setPromotingTeacher(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-blue-600" />
                            Promote {promotingTeacher?.full_name}
                        </DialogTitle>
                        <DialogDescription>
                            Assign a leadership role to this teacher.
                        </DialogDescription>
                    </DialogHeader>

                    {!conflict ? (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Select Leadership Role</Label>
                                <Select value={promotionType} onValueChange={setPromotionType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="hod">Head of Department (HOD)</SelectItem>
                                        <SelectItem value="class_teacher">Class Teacher</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {promotionType === "hod" && (
                                <div className="space-y-2 animate-in slide-in-from-top-2">
                                    <Label>Select Department</Label>
                                    <Select value={promotionDept} onValueChange={setPromotionDept}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select department..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments.map(d => (
                                                <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {promotionType === "class_teacher" && (
                                <div className="space-y-4 animate-in slide-in-from-top-2">
                                    <div className="space-y-2">
                                        <Label>Department</Label>
                                        <Select value={promotionDept} onValueChange={setPromotionDept}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select department..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {departments.map(d => (
                                                    <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Year</Label>
                                            <Select value={promotionYear} onValueChange={setPromotionYear}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Year" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {["1", "2", "3", "4"].map(y => (
                                                        <SelectItem key={y} value={y}>Year {y}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Section</Label>
                                            <Select value={promotionSection} onValueChange={setPromotionSection}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Section" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {SECTIONS.map(s => (
                                                        <SelectItem key={s} value={s}>Section {s}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-6 overflow-hidden">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 animate-in zoom-in-95">
                                <Filter className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-amber-900 leading-relaxed">
                                        {conflict.message}
                                    </p>
                                    <p className="text-xs text-amber-700">
                                        By proceeding, the existing assignment will be removed and updated to {promotingTeacher?.full_name}.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => {
                            if (conflict) setConflict(null);
                            else setPromotingTeacher(null);
                        }}>
                            Cancel
                        </Button>
                        {!conflict ? (
                            <Button
                                onClick={handlePromotionCheck}
                                disabled={!promotionType || processing || !promotionDept || (promotionType === 'class_teacher' && (!promotionYear || !promotionSection))}
                                className="bg-[#1a365d]"
                            >
                                {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Continue"}
                            </Button>

                        ) : (
                            <Button onClick={executePromotion} className="bg-amber-600 hover:bg-amber-700 text-white border-none">
                                {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Confirm Replacement"}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};
