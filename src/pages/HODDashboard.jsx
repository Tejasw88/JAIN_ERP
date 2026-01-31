import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient, useAuth } from "../App";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import {
    Loader2, Building2, Users, GraduationCap, BookOpen, FileText,
    ChevronRight, AlertTriangle, Award, Send, Clock, Calendar, Check, X
} from "lucide-react";

export const HODDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState(null);
    const [pendingLeaves, setPendingLeaves] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [teacherStudents, setTeacherStudents] = useState([]);

    // Summon dialog
    const [showSummon, setShowSummon] = useState(false);
    const [summonForm, setSummonForm] = useState({
        student_id: "",
        reason: "",
        scheduled_time: ""
    });
    const [departmentStudents, setDepartmentStudents] = useState([]);

    // Approval dialog
    const [showApproval, setShowApproval] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [approvalRemarks, setApprovalRemarks] = useState("");

    const fetchOverview = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get("/hod/department-overview");
            setOverview(res.data);
        } catch (error) {
            if (error.response?.status === 403) {
                toast.error("You are not assigned as HOD");
            } else {
                toast.error("Failed to load department overview");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchPendingLeaves = useCallback(async () => {
        try {
            const res = await apiClient.get("/leave/hod-requests");
            setPendingLeaves(res.data);
        } catch (error) {
            console.error("Failed to load pending leaves");
        }
    }, []);

    const fetchDepartmentStudents = useCallback(async () => {
        if (!overview?.department) return;
        try {
            const res = await apiClient.get("/users/students", {
                params: { department: overview.department }
            });
            setDepartmentStudents(res.data);
        } catch (error) {
            console.error("Failed to load students");
        }
    }, [overview?.department]);

    useEffect(() => {
        fetchOverview();
        fetchPendingLeaves();
    }, [fetchOverview, fetchPendingLeaves]);

    useEffect(() => {
        if (overview?.department) {
            fetchDepartmentStudents();
        }
    }, [overview?.department, fetchDepartmentStudents]);

    const handleViewTeacherStudents = async (teacherId) => {
        try {
            const res = await apiClient.get(`/hod/teacher/${teacherId}/students`);
            setTeacherStudents(res.data);
            setSelectedTeacher(overview?.teachers?.find(t => t.id === teacherId));
        } catch (error) {
            toast.error("Failed to load teacher students");
        }
    };

    const handleSummonStudent = async () => {
        try {
            await apiClient.post("/hod/summon-student", {
                student_id: parseInt(summonForm.student_id),
                reason: summonForm.reason,
                scheduled_time: summonForm.scheduled_time || null
            });
            toast.success("Summon notification sent!");
            setShowSummon(false);
            setSummonForm({ student_id: "", reason: "", scheduled_time: "" });
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to send summon");
        }
    };

    const handleLeaveApproval = async (status) => {
        if (!selectedLeave) return;
        try {
            await apiClient.put(`/leave/${selectedLeave.id}/hod-approve`, {
                status,
                remarks: approvalRemarks
            });
            toast.success(`Leave request ${status}`);
            setShowApproval(false);
            setSelectedLeave(null);
            setApprovalRemarks("");
            fetchPendingLeaves();
        } catch (error) {
            toast.error("Failed to update leave request");
        }
    };

    if (loading) {
        return (
            <DashboardLayout title="HOD Dashboard">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-[#1a365d]" />
                </div>
            </DashboardLayout>
        );
    }

    if (!overview) {
        return (
            <DashboardLayout title="HOD Dashboard">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-12">
                            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-500" />
                            <h2 className="text-xl font-semibold mb-2">Not Assigned as HOD</h2>
                            <p className="text-slate-500">
                                You have not been assigned as HOD for any department.
                                Please contact the administrator.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="HOD Dashboard">
            <div className="space-y-6">
                {/* Department Header */}
                <div className="bg-gradient-to-r from-[#1a365d] to-[#2d4a7c] rounded-xl p-6 text-white">
                    <div className="flex items-center gap-3 mb-4">
                        <Building2 className="w-8 h-8" />
                        <div>
                            <h1 className="text-2xl font-bold">{overview.department} Department</h1>
                            <p className="text-slate-200">Head of Department Dashboard</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-6">
                        <div className="bg-white/10 rounded-lg p-4">
                            <Users className="w-5 h-5 mb-2" />
                            <p className="text-sm text-slate-300">Students</p>
                            <p className="text-2xl font-bold">{overview.student_count}</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-4">
                            <GraduationCap className="w-5 h-5 mb-2" />
                            <p className="text-sm text-slate-300">Teachers</p>
                            <p className="text-2xl font-bold">{overview.teacher_count}</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-4">
                            <BookOpen className="w-5 h-5 mb-2" />
                            <p className="text-sm text-slate-300">Courses</p>
                            <p className="text-2xl font-bold">{overview.course_count}</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-4">
                            <FileText className="w-5 h-5 mb-2" />
                            <p className="text-sm text-slate-300">Pending Leaves</p>
                            <p className="text-2xl font-bold">{overview.pending_leaves}</p>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="teachers" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="teachers">Teachers</TabsTrigger>
                        <TabsTrigger value="leaves">
                            Leave Approvals
                            {pendingLeaves.length > 0 && (
                                <Badge className="ml-2 bg-amber-500">{pendingLeaves.length}</Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="summon">Summon Student</TabsTrigger>
                    </TabsList>

                    {/* Teachers Tab */}
                    <TabsContent value="teachers">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <GraduationCap className="w-5 h-5" />
                                        Department Teachers
                                    </CardTitle>
                                    <CardDescription>Click on a teacher to view student performance</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {overview.teachers?.map((teacher) => (
                                            <button
                                                key={teacher.id}
                                                onClick={() => handleViewTeacherStudents(teacher.id)}
                                                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${selectedTeacher?.id === teacher.id
                                                        ? 'bg-blue-50 border-blue-300'
                                                        : 'hover:bg-slate-50'
                                                    }`}
                                            >
                                                <div className="text-left">
                                                    <p className="font-medium">{teacher.name}</p>
                                                    <p className="text-sm text-slate-500">{teacher.email}</p>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-slate-400" />
                                            </button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Teacher's Students Performance */}
                            {selectedTeacher && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Award className="w-5 h-5" />
                                            {selectedTeacher.name}'s Students
                                        </CardTitle>
                                        <CardDescription>Performance ranked by average marks</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {teacherStudents.length > 0 ? (
                                            <div className="space-y-4">
                                                {teacherStudents.map((course) => (
                                                    <div key={course.course.id}>
                                                        <Badge variant="outline" className="mb-2">
                                                            {course.course.code} - {course.course.name}
                                                        </Badge>
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>Rank</TableHead>
                                                                    <TableHead>Student</TableHead>
                                                                    <TableHead>USN</TableHead>
                                                                    <TableHead className="text-right">Avg Marks</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {course.students.slice(0, 10).map((student, idx) => (
                                                                    <TableRow key={student.id}>
                                                                        <TableCell>
                                                                            {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                                                                        </TableCell>
                                                                        <TableCell>{student.name}</TableCell>
                                                                        <TableCell>{student.usn}</TableCell>
                                                                        <TableCell className="text-right font-medium">
                                                                            {parseFloat(student.average_marks).toFixed(1)}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-slate-500">
                                                <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                                <p>No courses or students found</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    {/* Leave Approvals Tab */}
                    <TabsContent value="leaves">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Forwarded Leave Requests
                                </CardTitle>
                                <CardDescription>Leave requests forwarded by class teachers</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {pendingLeaves.length > 0 ? (
                                    <div className="space-y-4">
                                        {pendingLeaves.map((leave) => (
                                            <div key={leave.id} className="border rounded-lg p-4">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="font-medium">{leave.student_name}</p>
                                                        <p className="text-sm text-slate-500">
                                                            Forwarded by: {leave.teacher_name}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Badge variant="outline" className="capitalize">{leave.leave_type}</Badge>
                                                            <span className="text-sm text-slate-600">
                                                                <Calendar className="w-3 h-3 inline mr-1" />
                                                                {leave.start_date} to {leave.end_date}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-500 mt-2">{leave.reason}</p>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedLeave(leave);
                                                            setShowApproval(true);
                                                        }}
                                                    >
                                                        Review
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-slate-500">
                                        <Check className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                        <p>No pending leave requests</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Summon Student Tab */}
                    <TabsContent value="summon">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Send className="w-5 h-5" />
                                    Summon Student
                                </CardTitle>
                                <CardDescription>Send a summon notification to a student</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="max-w-md space-y-4">
                                    <div className="space-y-2">
                                        <Label>Select Student</Label>
                                        <Select
                                            value={summonForm.student_id}
                                            onValueChange={(v) => setSummonForm({ ...summonForm, student_id: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose student..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {departmentStudents.map(s => (
                                                    <SelectItem key={s.id} value={s.id.toString()}>
                                                        {s.full_name} ({s.usn})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Reason</Label>
                                        <Textarea
                                            value={summonForm.reason}
                                            onChange={(e) => setSummonForm({ ...summonForm, reason: e.target.value })}
                                            placeholder="State the reason for summoning..."
                                            rows={3}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Scheduled Time (Optional)</Label>
                                        <Input
                                            type="datetime-local"
                                            value={summonForm.scheduled_time}
                                            onChange={(e) => setSummonForm({ ...summonForm, scheduled_time: e.target.value })}
                                        />
                                    </div>

                                    <Button
                                        onClick={handleSummonStudent}
                                        className="bg-[#1a365d]"
                                        disabled={!summonForm.student_id || !summonForm.reason}
                                    >
                                        <Send className="w-4 h-4 mr-2" />
                                        Send Summon
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Leave Approval Dialog */}
                <Dialog open={showApproval} onOpenChange={setShowApproval}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Review Leave Request</DialogTitle>
                            <DialogDescription>
                                {selectedLeave?.student_name} - {selectedLeave?.leave_type}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <p className="text-sm mb-2">
                                <strong>Duration:</strong> {selectedLeave?.start_date} to {selectedLeave?.end_date}
                            </p>
                            <p className="text-sm mb-2">
                                <strong>Forwarded by:</strong> {selectedLeave?.teacher_name}
                            </p>
                            <p className="text-sm mb-4">
                                <strong>Reason:</strong> {selectedLeave?.reason}
                            </p>
                            <div className="space-y-2">
                                <Label>HOD Remarks (Optional)</Label>
                                <Textarea
                                    value={approvalRemarks}
                                    onChange={(e) => setApprovalRemarks(e.target.value)}
                                    placeholder="Add any remarks..."
                                    rows={3}
                                />
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button
                                variant="destructive"
                                onClick={() => handleLeaveApproval('rejected')}
                            >
                                <X className="w-4 h-4 mr-1" />
                                Reject
                            </Button>
                            <Button
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleLeaveApproval('approved')}
                            >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};
