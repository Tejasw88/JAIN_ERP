import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient, useAuth } from "../App";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import {
  BookOpen,
  Users,
  FileText,
  GraduationCap,
  Calendar,
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";

export const TeacherDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showAddGrade, setShowAddGrade] = useState(false);
  const [showMarkAttendance, setShowMarkAttendance] = useState(false);

  // Grade form
  const [newGrade, setNewGrade] = useState({
    student_id: "",
    course_id: "",
    course_name: "",
    title: "",
    marks: "",
    max_marks: "100"
  });

  // Attendance form
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, coursesRes, studentsRes] = await Promise.all([
        apiClient.get("/dashboard/stats"),
        apiClient.get("/courses"),
        apiClient.get("/students")
      ]);
      setStats(statsRes.data);
      setCourses(coursesRes.data);
      setStudents(studentsRes.data);

      if (coursesRes.data.length > 0) {
        setSelectedCourse(coursesRes.data[0]);
        setNewGrade(prev => ({ ...prev, course_id: coursesRes.data[0].id }));
      }
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddGrade = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post("/grades", {
        ...newGrade,
        marks: parseInt(newGrade.marks),
        max_marks: parseInt(newGrade.max_marks)
      });
      toast.success("Grade posted successfully");
      setShowAddGrade(false);
      setNewGrade({
        student_id: "",
        course_id: selectedCourse?.id || "",
        course_name: selectedCourse?.name || "",
        title: "",
        marks: "",
        max_marks: "100"
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to post grade");
    }
  };

  const handleMarkAttendance = async () => {
    try {
      if (!selectedCourse) {
        toast.error("Please select a course");
        return;
      }
      const payload = {
        course_id: selectedCourse.id,
        course_name: selectedCourse.name,
        department: selectedCourse.department,
        year: selectedCourse.year,
        date: attendanceDate,
        records: attendanceRecords.map(r => ({
          student_id: r.student_id,
          status: r.status
        }))
      };
      await apiClient.post("/attendance", payload);
      toast.success("Attendance marked successfully");
      setShowMarkAttendance(false);
      setAttendanceRecords([]);
    } catch (error) {
      toast.error("Failed to mark attendance");
    }
  };

  const initializeAttendance = async (courseId) => {
    try {
      const course = courses.find(c => c.id === parseInt(courseId));
      const res = await apiClient.get(`/courses/${courseId}/students`);
      const records = res.data.map(student => ({
        student_id: student.id,
        status: "Present",
        student_name: student.full_name,
        usn: student.usn
      }));
      setAttendanceRecords(records);
      setSelectedCourse(course);
    } catch (error) {
      toast.error("Failed to fetch students");
    }
  };

  const updateAttendanceStatus = (studentId, status) => {
    setAttendanceRecords(prev =>
      prev.map(r => r.student_id === studentId ? { ...r, status } : r)
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Present": return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "Absent": return <XCircle className="w-4 h-4 text-red-600" />;
      case "Late": return <Clock className="w-4 h-4 text-amber-600" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Teacher Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a365d]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Teacher Dashboard">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.full_name}</h1>
        <p className="text-slate-500">Manage your courses, grades, and attendance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="card-hover metric-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">My Courses</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.my_courses || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover metric-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">My Students</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.my_students || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover metric-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Classwork</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total_classwork || 0}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <FileText className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for managing your classes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Dialog open={showAddGrade} onOpenChange={setShowAddGrade}>
              <DialogTrigger asChild>
                <Button className="bg-[#1a365d] hover:bg-[#102a43]" data-testid="add-grade-btn">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Post Grade
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Post New Grade</DialogTitle>
                  <DialogDescription>Add a grade for a student</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddGrade} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Course</Label>
                    <Select
                      value={newGrade.course_id?.toString()}
                      onValueChange={(v) => {
                        const course = courses.find(c => c.id === parseInt(v));
                        setNewGrade({ ...newGrade, course_id: v, course_name: course?.name || "" });
                      }}
                    >
                      <SelectTrigger data-testid="grade-course">
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Student</Label>
                    <Select
                      value={newGrade.student_id?.toString()}
                      onValueChange={(v) => setNewGrade({ ...newGrade, student_id: v })}
                    >
                      <SelectTrigger data-testid="grade-student">
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((s) => (
                          <SelectItem key={s.id} value={s.id.toString()}>{s.full_name} ({s.usn})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={newGrade.title}
                      onChange={(e) => setNewGrade({ ...newGrade, title: e.target.value })}
                      placeholder="e.g., Quiz 1"
                      required
                      data-testid="grade-title"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Marks</Label>
                      <Input
                        type="number"
                        value={newGrade.marks}
                        onChange={(e) => setNewGrade({ ...newGrade, marks: e.target.value })}
                        placeholder="85"
                        required
                        data-testid="grade-marks"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Marks</Label>
                      <Input
                        type="number"
                        value={newGrade.max_marks}
                        onChange={(e) => setNewGrade({ ...newGrade, max_marks: e.target.value })}
                        placeholder="100"
                        required
                        data-testid="grade-max"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="bg-[#1a365d]" data-testid="submit-grade">
                      Post Grade
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={showMarkAttendance} onOpenChange={setShowMarkAttendance}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="mark-attendance-btn">
                  <Calendar className="w-4 h-4 mr-2" />
                  Mark Attendance
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Mark Attendance</DialogTitle>
                  <DialogDescription>Record attendance for your students</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Course</Label>
                      <Select onValueChange={(v) => initializeAttendance(v)}>
                        <SelectTrigger data-testid="attendance-course">
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={attendanceDate}
                        onChange={(e) => setAttendanceDate(e.target.value)}
                        data-testid="attendance-date"
                      />
                    </div>
                  </div>

                  {attendanceRecords.length > 0 && (
                    <div className="rounded-lg border max-h-[300px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead>Student</TableHead>
                            <TableHead>USN</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attendanceRecords.map((record) => (
                            <TableRow key={record.student_id}>
                              <TableCell className="font-medium">{record.student_name}</TableCell>
                              <TableCell className="text-slate-500">{record.usn}</TableCell>
                              <TableCell>
                                <Select
                                  value={record.status}
                                  onValueChange={(v) => updateAttendanceStatus(record.student_id, v)}
                                >
                                  <SelectTrigger className="w-32">
                                    <div className="flex items-center gap-2">
                                      {getStatusIcon(record.status)}
                                      <SelectValue />
                                    </div>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Present">Present</SelectItem>
                                    <SelectItem value="Absent">Absent</SelectItem>
                                    <SelectItem value="Late">Late</SelectItem>
                                    <SelectItem value="Excused">Excused</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleMarkAttendance}
                    className="bg-[#1a365d]"
                    disabled={attendanceRecords.length === 0}
                    data-testid="submit-attendance"
                  >
                    Save Attendance
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* My Courses */}
      <Card>
        <CardHeader>
          <CardTitle>My Courses</CardTitle>
          <CardDescription>Courses you are teaching this semester</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <Card key={course.id} className="card-hover">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge className="bg-[#1a365d]/10 text-[#1a365d] mb-2">{course.code}</Badge>
                      <h3 className="font-semibold text-slate-900">{course.name}</h3>
                      <p className="text-sm text-slate-500 mt-1">{course.department}</p>
                    </div>
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <BookOpen className="w-5 h-5 text-slate-600" />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
                    <span className="text-slate-500">{course.credits} Credits</span>
                    <Button variant="ghost" size="sm" className="text-[#1a365d]">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};
