import React, { useState, useEffect, useCallback, useRef } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient, useAuth } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import {
  Calendar,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  MapPin,
  Lock,
  Play,
  Users,
  BarChart3,
  History
} from "lucide-react";

export const AttendancePage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";
  const isTeacher = user?.role === "Teacher";
  const isStudent = user?.role === "Student";

  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [courses, setCourses] = useState([]);

  // Teacher State
  const [sessionForm, setSessionForm] = useState({
    course_id: "",
    radius: "20"
  });
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionLogs, setSessionLogs] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  // Student State
  const [otp, setOtp] = useState("");
  const [marking, setMarking] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [attRes, sesRes] = await Promise.all([
        apiClient.get("/attendance/all"),
        apiClient.get("/attendance/active-sessions")
      ]);
      setAttendance(attRes.data);
      setActiveSessions(sesRes.data);

      if (isTeacher) {
        const coursesRes = await apiClient.get("/courses");
        setCourses(coursesRes.data);
      }
    } catch (error) {
      toast.error("Failed to fetch attendance data");
    } finally {
      setLoading(false);
    }
  }, [isTeacher]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Timer logic for active session
  useEffect(() => {
    if (currentSession) {
      const expiry = new Date(currentSession.expires_at).getTime();
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const diff = Math.max(0, Math.floor((expiry - now) / 1000));
        setTimeLeft(diff);
        if (diff === 0) {
          clearInterval(interval);
          setCurrentSession(null);
          fetchData();
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentSession, fetchData]);

  // Auto-refresh logs when session is active
  useEffect(() => {
    let interval;
    if (currentSession) {
      interval = setInterval(async () => {
        try {
          const res = await apiClient.get(`/attendance/session/${currentSession.session_id}/logs`);
          setSessionLogs(res.data);
        } catch (e) { console.error(e); }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [currentSession]);

  const handleStartSession = () => {
    if (!sessionForm.course_id) {
      toast.error("Please select a course");
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    toast.info("Getting current location...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await apiClient.post("/attendance/start-session", {
            course_id: parseInt(sessionForm.course_id),
            radius: parseInt(sessionForm.radius),
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setCurrentSession(res.data);
          setSessionLogs([]);
          toast.success("Attendance session started!");
        } catch (error) {
          toast.error(error.response?.data?.detail || "Failed to start session");
        }
      },
      (error) => {
        toast.error("Failed to get location. Please enable location permissions.");
      },
      { enableHighAccuracy: true }
    );
  };

  const handleMarkAttendance = () => {
    if (!otp || otp.length < 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported");
      return;
    }

    setMarking(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await apiClient.post("/attendance/mark", {
            otp,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          toast.success("Attendance marked successfully!");
          setOtp("");
          fetchData();
        } catch (error) {
          toast.error(error.response?.data?.detail || "Failed to mark attendance");
        } finally {
          setMarking(false);
        }
      },
      (error) => {
        toast.error("Location access denied. Attendance requires location.");
        setMarking(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const getStatusBadge = (status) => {
    const variants = {
      present: { class: "bg-emerald-100 text-emerald-700", label: "Present", icon: <CheckCircle2 className="w-3 h-3" /> },
      absent: { class: "bg-red-100 text-red-700", label: "Absent", icon: <XCircle className="w-3 h-3" /> },
      late: { class: "bg-amber-100 text-amber-700", label: "Late", icon: <Clock className="w-3 h-3" /> },
      excused: { class: "bg-slate-100 text-slate-700", label: "Excused", icon: <AlertCircle className="w-3 h-3" /> }
    };
    const v = variants[status.toLowerCase()] || variants.present;
    return (
      <Badge className={`${v.class} flex items-center gap-1`}>
        {v.icon}
        {v.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <DashboardLayout title="Attendance">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a365d]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Attendance System">
      <div className="space-y-6">

        {/* Teacher Session Controls */}
        {isTeacher && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-2 border-[#1a365d]/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-emerald-600" />
                  Start New Session
                </CardTitle>
                <CardDescription>Generate an OTP for students within a range</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Course</Label>
                  <Select
                    value={sessionForm.course_id}
                    onValueChange={(v) => setSessionForm({ ...sessionForm, course_id: v })}
                    disabled={!!currentSession}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select course..." />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.code} - {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Authorised Radius (Meters)</Label>
                  <Select
                    value={sessionForm.radius}
                    onValueChange={(v) => setSessionForm({ ...sessionForm, radius: v })}
                    disabled={!!currentSession}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 Meters (Single Room)</SelectItem>
                      <SelectItem value="20">20 Meters (Lobby/Cluster)</SelectItem>
                      <SelectItem value="50">50 Meters (Department Floor)</SelectItem>
                      <SelectItem value="100">100 Meters (Building Wide)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-[#1a365d]"
                  onClick={handleStartSession}
                  disabled={!!currentSession}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Initialise Session
                </Button>
              </CardFooter>
            </Card>

            {currentSession && (
              <Card className="border-2 border-emerald-500 bg-emerald-50/30">
                <CardHeader className="text-center">
                  <CardTitle className="text-sm font-medium text-emerald-600">ACTIVE SESSION: {currentSession.course_name}</CardTitle>
                  <div className="flex flex-col items-center justify-center p-6 space-y-4">
                    <div className="text-6xl font-black tracking-widest text-[#1a365d] bg-white px-6 py-3 rounded-xl shadow-inner border order-2">
                      {currentSession.otp}
                    </div>
                    <div className="flex items-center gap-2 text-xl font-bold text-slate-700 order-1">
                      <Clock className="w-6 h-6 text-amber-500 animate-pulse" />
                      Expires in {timeLeft}s
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900">{sessionLogs.length}</p>
                      <p className="text-xs text-slate-500">MARKINGS</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Student OTP Entry */}
        {isStudent && (
          <>
            {activeSessions.length > 0 ? (
              <Card className="border-2 border-emerald-500 shadow-lg">
                <CardHeader className="bg-emerald-50">
                  <CardTitle className="flex items-center gap-2 text-emerald-700">
                    <AlertCircle className="w-5 h-5" />
                    Active Attendance Session
                  </CardTitle>
                  <CardDescription className="text-emerald-600 font-medium">
                    {activeSessions[0].course_code}: {activeSessions[0].course_name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                      <Label>Enter 6-Digit OTP</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="000000"
                          className="pl-10 text-xl tracking-[1em] font-mono"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        />
                      </div>
                    </div>
                    <Button
                      className="md:mt-8 h-12 bg-emerald-600 hover:bg-emerald-700 text-lg"
                      onClick={handleMarkAttendance}
                      disabled={marking || !otp}
                    >
                      {marking ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                      )}
                      Mark Attendance
                    </Button>
                  </div>
                  <p className="mt-4 text-sm text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Your location will be verified against the authorised radius ({activeSessions[0].radius_meters}m).
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-dashed border-slate-200">
                <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="bg-slate-50 p-4 rounded-full mb-4">
                    <Clock className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900">Waiting for a session...</h3>
                  <p className="text-sm text-slate-500 max-w-sm mt-2">
                    When your teacher starts an attendance session, the OTP entry field will appear here automatically.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Attendance History/Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Attendance Records
            </CardTitle>
            <CardDescription>Detailed history of all sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {attendance.length > 0 ? (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Date & Time</TableHead>
                      {!isStudent && <TableHead>Student</TableHead>}
                      <TableHead>Course</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{new Date(record.date).toLocaleDateString()}</span>
                            <span className="text-xs text-slate-500">{new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </TableCell>
                        {!isStudent && (
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{record.student_name}</span>
                              <span className="text-xs text-slate-500">{record.usn}</span>
                            </div>
                          </TableCell>
                        )}
                        <TableCell>{record.course_name}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell>
                          {record.is_manual ? (
                            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Manual</Badge>
                          ) : (
                            <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">OTP + Geo</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No attendance records found.</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
};
