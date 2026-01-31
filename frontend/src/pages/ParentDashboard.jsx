import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient, useAuth } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  User,
  GraduationCap,
  Calendar,
  TrendingUp,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle
} from "lucide-react";

export const ParentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, gradesRes, attendanceRes] = await Promise.all([
        apiClient.get("/dashboard/stats"),
        apiClient.get("/grades"),
        apiClient.get("/attendance")
      ]);
      setStats(statsRes.data);
      setGrades(gradesRes.data);
      setAttendance(attendanceRes.data);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return "text-emerald-600 bg-emerald-100";
    if (percentage >= 75) return "text-blue-600 bg-blue-100";
    if (percentage >= 60) return "text-amber-600 bg-amber-100";
    return "text-red-600 bg-red-100";
  };

  const getStatusBadge = (status) => {
    const styles = {
      Present: "badge-present",
      Absent: "badge-absent",
      Late: "badge-late",
      Excused: "badge-excused"
    };
    const icons = {
      Present: <CheckCircle2 className="w-3 h-3" />,
      Absent: <XCircle className="w-3 h-3" />,
      Late: <Clock className="w-3 h-3" />,
      Excused: <AlertCircle className="w-3 h-3" />
    };
    return (
      <Badge className={`${styles[status]} flex items-center gap-1`}>
        {icons[status]}
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <DashboardLayout title="Parent Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a365d]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!stats.student_name || stats.student_name === "Not linked") {
    return (
      <DashboardLayout title="Parent Dashboard">
        <Card className="max-w-lg mx-auto mt-12">
          <CardContent className="pt-6 text-center">
            <div className="p-4 bg-amber-100 rounded-full w-fit mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Account Not Linked</h2>
            <p className="text-slate-500 mb-4">
              Your account is not linked to any student yet. Please contact the administrator to link your account.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Parent Dashboard">
      {/* Student Info Card */}
      <Card className="mb-8 bg-gradient-to-r from-[#1a365d] to-[#2d4a7c] text-white">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-white/20 rounded-full">
              <User className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-slate-300">Monitoring Student</p>
              <h2 className="text-2xl font-bold">{stats.student_name}</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm text-slate-300">Average Grade</p>
              <p className="text-2xl font-bold">{stats.student_average || 0}%</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm text-slate-300">Attendance Rate</p>
              <p className="text-2xl font-bold">{stats.student_attendance || 100}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500">Academic Performance</p>
                <p className="text-2xl font-bold text-slate-900">{stats.student_average || 0}%</p>
              </div>
            </div>
            <Progress value={stats.student_average || 0} className="mt-4 h-2" />
            <p className="text-xs text-slate-500 mt-2">
              {stats.student_average >= 75 ? "Excellent progress!" : "Room for improvement"}
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500">Attendance Rate</p>
                <p className="text-2xl font-bold text-slate-900">{stats.student_attendance || 100}%</p>
              </div>
            </div>
            <Progress value={stats.student_attendance || 100} className="mt-4 h-2" />
            <p className="text-xs text-slate-500 mt-2">
              {stats.student_attendance >= 85 ? "Great attendance!" : "Please ensure regular attendance"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grades Table */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#1a365d]" />
            {stats.student_name}'s Grades
          </CardTitle>
          <CardDescription>View your child's academic performance</CardDescription>
        </CardHeader>
        <CardContent>
          {grades.length > 0 ? (
            <div className="rounded-lg border overflow-hidden">
              <Table className="data-table">
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Course</TableHead>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((grade) => {
                    const percentage = (grade.score / grade.max_score) * 100;
                    return (
                      <TableRow key={grade.id}>
                        <TableCell className="font-medium">{grade.course_name}</TableCell>
                        <TableCell>{grade.assignment_name}</TableCell>
                        <TableCell>{grade.score}/{grade.max_score}</TableCell>
                        <TableCell>
                          <Badge className={getGradeColor(percentage)}>
                            {percentage.toFixed(0)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {new Date(grade.graded_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">No grades recorded yet</p>
          )}
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#1a365d]" />
            Attendance Record
          </CardTitle>
          <CardDescription>View your child's attendance history</CardDescription>
        </CardHeader>
        <CardContent>
          {attendance.length > 0 ? (
            <div className="rounded-lg border overflow-hidden">
              <Table className="data-table">
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Date</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.slice(0, 10).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {new Date(record.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{record.course_name}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">No attendance records yet</p>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};
