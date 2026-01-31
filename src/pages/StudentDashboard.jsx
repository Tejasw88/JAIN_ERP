import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient, useAuth } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  BookOpen,
  GraduationCap,
  Calendar,
  TrendingUp,
  FileText,
  Clock,
  Loader2
} from "lucide-react";

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [courses, setCourses] = useState([]);
  const [recentGrades, setRecentGrades] = useState([]);
  const [upcomingClasswork, setUpcomingClasswork] = useState([]);
  const [todayClasses, setTodayClasses] = useState([]);
  const [currentTime, setCurrentTime] = useState("");
  const [todayDay, setTodayDay] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, coursesRes, gradesRes, classworkRes, todayRes] = await Promise.all([
        apiClient.get("/dashboard/stats"),
        apiClient.get("/courses"),
        apiClient.get("/grades"),
        apiClient.get("/classwork"),
        apiClient.get("/timetable/today").catch(() => ({ data: { slots: [] } }))
      ]);
      setStats(statsRes.data);
      setCourses(coursesRes.data);
      setRecentGrades(gradesRes.data.slice(0, 5));

      // Filter and enhance assignments with days left
      const now = new Date();
      const assignments = classworkRes.data
        .filter(c => c.type === "Assignment" && c.due_date)
        .map(a => {
          const due = new Date(a.due_date);
          const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
          return { ...a, daysLeft };
        })
        .filter(a => a.daysLeft >= 0)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 5);

      setUpcomingClasswork(assignments);
      setTodayClasses(todayRes.data.slots || []);
      setTodayDay(todayRes.data.today || "");
      setCurrentTime(todayRes.data.current_time || "");
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
    if (percentage >= 90) return "text-emerald-600";
    if (percentage >= 75) return "text-blue-600";
    if (percentage >= 60) return "text-amber-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <DashboardLayout title="Student Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a365d]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Student Dashboard">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#1a365d] to-[#2d4a7c] rounded-xl p-6 mb-8 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.full_name}!</h1>
        <p className="text-slate-200 mb-4">
          {user?.usn && <span className="bg-white/20 px-3 py-1 rounded-full text-sm mr-3">{user.usn}</span>}
          {user?.department && <span className="text-slate-300">{user.department}</span>}
        </p>
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-sm text-slate-300">Enrolled Courses</p>
            <p className="text-2xl font-bold">{stats.enrolled_courses || 0}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-sm text-slate-300">Average Grade</p>
            <p className="text-2xl font-bold">{stats.average_grade || 0}%</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-sm text-slate-300">Attendance</p>
            <p className="text-2xl font-bold">{stats.attendance_rate || 100}%</p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500">Enrolled Courses</p>
                <p className="text-2xl font-bold text-slate-900">{stats.enrolled_courses || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500">Average Grade</p>
                <div className="flex items-end gap-2">
                  <p className={`text-2xl font-bold ${getGradeColor(stats.average_grade || 0)}`}>
                    {stats.average_grade || 0}%
                  </p>
                </div>
              </div>
            </div>
            <Progress value={stats.average_grade || 0} className="mt-4 h-2" />
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
                <p className="text-2xl font-bold text-slate-900">{stats.attendance_rate || 100}%</p>
              </div>
            </div>
            <Progress value={stats.attendance_rate || 100} className="mt-4 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Today's Classes & Pending Assignments Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Today's Classes */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Today's Classes
              <Badge variant="outline" className="ml-auto">{todayDay}</Badge>
            </CardTitle>
            <CardDescription>Your schedule for today</CardDescription>
          </CardHeader>
          <CardContent>
            {todayClasses.length > 0 ? (
              <div className="space-y-3">
                {todayClasses.map((slot, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${slot.is_current
                        ? 'bg-green-50 border-green-300 ring-2 ring-green-200'
                        : slot.is_next
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                  >
                    <div className="text-center min-w-[60px]">
                      <p className="text-xs text-slate-500">Slot {slot.slot_number}</p>
                      <p className="text-sm font-medium">{slot.start_time}</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{slot.course_code || slot.course_name}</p>
                      <p className="text-sm text-slate-500">{slot.teacher_name}</p>
                    </div>
                    {slot.is_current && (
                      <Badge className="bg-green-500 text-white">Now</Badge>
                    )}
                    {slot.is_next && (
                      <Badge variant="outline" className="border-blue-400 text-blue-600">Next</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No classes scheduled for today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Assignments */}
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              Pending Assignments
              {upcomingClasswork.length > 0 && (
                <Badge className="ml-auto bg-amber-500">{upcomingClasswork.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>Upcoming assignments with deadlines</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingClasswork.length > 0 ? (
              <div className="space-y-3">
                {upcomingClasswork.map((assignment) => (
                  <div
                    key={assignment.id}
                    className={`flex items-center gap-4 p-3 rounded-lg border ${assignment.daysLeft <= 1
                        ? 'bg-red-50 border-red-200'
                        : assignment.daysLeft <= 3
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{assignment.title}</p>
                      <p className="text-sm text-slate-500">{assignment.course_name}</p>
                    </div>
                    <Badge
                      variant={assignment.daysLeft <= 1 ? "destructive" : assignment.daysLeft <= 3 ? "warning" : "secondary"}
                      className={
                        assignment.daysLeft <= 1
                          ? 'bg-red-500'
                          : assignment.daysLeft <= 3
                            ? 'bg-amber-500 text-white'
                            : ''
                      }
                    >
                      {assignment.daysLeft === 0
                        ? 'Due Today!'
                        : assignment.daysLeft === 1
                          ? '1 day left'
                          : `${assignment.daysLeft} days left`}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No pending assignments</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* My Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#1a365d]" />
              My Courses
            </CardTitle>
            <CardDescription>Courses you are enrolled in this semester</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {courses.length > 0 ? courses.map((course) => (
                <div key={course.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-[#1a365d]/10 rounded-lg">
                      <BookOpen className="w-5 h-5 text-[#1a365d]" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{course.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{course.code}</Badge>
                        <span className="text-xs text-slate-500">{course.credits} Credits</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-sm text-slate-500">{course.teacher_name || "TBA"}</span>
                </div>
              )) : (
                <p className="text-slate-500 text-center py-8">No courses enrolled yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#1a365d]" />
              Recent Grades
            </CardTitle>
            <CardDescription>Your latest graded assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentGrades.length > 0 ? recentGrades.map((grade) => {
                const percentage = (grade.score / grade.max_score) * 100;
                return (
                  <div key={grade.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{grade.assignment_name}</p>
                      <p className="text-sm text-slate-500">{grade.course_name}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getGradeColor(percentage)}`}>
                        {grade.score}/{grade.max_score}
                      </p>
                      <p className="text-xs text-slate-500">{percentage.toFixed(0)}%</p>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-slate-500 text-center py-8">No grades yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#1a365d]" />
            Upcoming Assignments
          </CardTitle>
          <CardDescription>Assignments due soon</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingClasswork.length > 0 ? upcomingClasswork.map((work) => (
              <Card key={work.id} className="card-hover border-l-4 border-l-[#f59e0b]">
                <CardContent className="pt-4">
                  <Badge className="bg-amber-100 text-amber-700 mb-2">{work.type}</Badge>
                  <h4 className="font-medium text-slate-900">{work.title}</h4>
                  <p className="text-sm text-slate-500 mt-1">{work.course_name}</p>
                  {work.due_date && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-slate-500">
                      <Clock className="w-4 h-4" />
                      Due: {new Date(work.due_date).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            )) : (
              <p className="text-slate-500 col-span-full text-center py-8">No upcoming assignments</p>
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};
