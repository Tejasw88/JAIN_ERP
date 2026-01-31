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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import {
    Loader2, MapPin, Building2, Calendar, Clock, Eye, EyeOff,
    Plus, Users, BookOpen, ChevronRight
} from "lucide-react";

export const ExamLocatorPage = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === "Admin";
    const isStudent = user?.role === "Student";

    const [loading, setLoading] = useState(true);
    const [exams, setExams] = useState([]);
    const [halls, setHalls] = useState([]);
    const [mySeat, setMySeat] = useState([]);
    const [courses, setCourses] = useState([]);
    const [selectedExam, setSelectedExam] = useState(null);
    const [seatingArrangement, setSeatingArrangement] = useState([]);

    // Forms
    const [showNewExam, setShowNewExam] = useState(false);
    const [examForm, setExamForm] = useState({
        name: "", course_id: "", exam_date: "", start_time: "", end_time: ""
    });

    const [showNewHall, setShowNewHall] = useState(false);
    const [hallForm, setHallForm] = useState({
        name: "", building: "", floor: 0, capacity: 30
    });

    const [showGenerateSeating, setShowGenerateSeating] = useState(false);
    const [selectedHalls, setSelectedHalls] = useState([]);

    const fetchAdminData = useCallback(async () => {
        if (!isAdmin) return;
        try {
            const [examsRes, hallsRes, coursesRes] = await Promise.all([
                apiClient.get("/exams"),
                apiClient.get("/exams/halls"),
                apiClient.get("/courses")
            ]);
            setExams(examsRes.data);
            setHalls(hallsRes.data);
            setCourses(coursesRes.data);
        } catch (error) {
            console.error("Failed to load admin data");
        }
    }, [isAdmin]);

    const fetchStudentData = useCallback(async () => {
        if (!isStudent) return;
        try {
            const res = await apiClient.get("/exams/my-seat");
            setMySeat(res.data);
        } catch (error) {
            console.error("Failed to load seat info");
        }
    }, [isStudent]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            await Promise.all([fetchAdminData(), fetchStudentData()]);
            setLoading(false);
        };
        fetchData();
    }, [fetchAdminData, fetchStudentData]);

    const handleCreateExam = async () => {
        try {
            await apiClient.post("/exams", examForm);
            toast.success("Exam created!");
            setShowNewExam(false);
            setExamForm({ name: "", course_id: "", exam_date: "", start_time: "", end_time: "" });
            fetchAdminData();
        } catch (error) {
            toast.error("Failed to create exam");
        }
    };

    const handleCreateHall = async () => {
        try {
            await apiClient.post("/exams/halls", {
                ...hallForm,
                floor: parseInt(hallForm.floor),
                capacity: parseInt(hallForm.capacity)
            });
            toast.success("Hall created!");
            setShowNewHall(false);
            setHallForm({ name: "", building: "", floor: 0, capacity: 30 });
            fetchAdminData();
        } catch (error) {
            toast.error("Failed to create hall");
        }
    };

    const handleToggleVisibility = async (examId) => {
        try {
            await apiClient.put(`/exams/${examId}/toggle-visibility`);
            toast.success("Visibility updated!");
            fetchAdminData();
        } catch (error) {
            toast.error("Failed to toggle visibility");
        }
    };

    const handleGenerateSeating = async () => {
        if (!selectedExam || selectedHalls.length === 0) return;
        try {
            await apiClient.post(`/exams/${selectedExam.id}/generate-seating`, {
                exam_id: selectedExam.id,
                hall_ids: selectedHalls.map(h => parseInt(h))
            });
            toast.success("Seating arrangement generated!");
            setShowGenerateSeating(false);
            setSelectedHalls([]);
            handleViewSeating(selectedExam.id);
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to generate seating");
        }
    };

    const handleViewSeating = async (examId) => {
        try {
            const res = await apiClient.get(`/exams/${examId}/seating`);
            setSeatingArrangement(res.data);
            setSelectedExam(exams.find(e => e.id === examId));
        } catch (error) {
            toast.error("Failed to load seating");
        }
    };

    if (loading) {
        return (
            <DashboardLayout title="Exam Hall Locator">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-[#1a365d]" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Exam Hall Locator">
            <div className="space-y-6">
                {/* Student View */}
                {isStudent && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                My Exam Seats
                            </CardTitle>
                            <CardDescription>Your upcoming exam locations</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {mySeat.length > 0 ? (
                                <div className="space-y-4">
                                    {mySeat.map((seat) => (
                                        <div key={seat.id} className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-lg">{seat.exam_name}</h3>
                                                    <p className="text-sm text-slate-600">{seat.course_code} - {seat.course_name}</p>
                                                    <div className="flex items-center gap-4 mt-3">
                                                        <Badge variant="outline">
                                                            <Calendar className="w-3 h-3 mr-1" />
                                                            {seat.exam_date}
                                                        </Badge>
                                                        <Badge variant="outline">
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            {seat.start_time} - {seat.end_time}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="bg-white border-2 border-blue-500 rounded-lg p-4 min-w-[120px]">
                                                        <p className="text-xs text-slate-500 uppercase">Your Seat</p>
                                                        <p className="text-3xl font-bold text-blue-600">#{seat.seat_number}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-blue-200">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-slate-500" />
                                                    <span className="font-medium">{seat.hall_name}</span>
                                                    <span className="text-slate-500">|</span>
                                                    <span>{seat.building}, Floor {seat.floor}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-500">
                                    <MapPin className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                    <p>No exam seats assigned yet</p>
                                    <p className="text-sm">Check back when exam seats are published</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Admin View */}
                {isAdmin && (
                    <Tabs defaultValue="exams" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="exams">Exams</TabsTrigger>
                            <TabsTrigger value="halls">Exam Halls</TabsTrigger>
                            <TabsTrigger value="seating">Seating Arrangement</TabsTrigger>
                        </TabsList>

                        {/* Exams Tab */}
                        <TabsContent value="exams">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <BookOpen className="w-5 h-5" />
                                            Exams
                                        </CardTitle>
                                        <CardDescription>Manage exam schedules</CardDescription>
                                    </div>
                                    <Dialog open={showNewExam} onOpenChange={setShowNewExam}>
                                        <DialogTrigger asChild>
                                            <Button className="bg-[#1a365d]">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Exam
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Create Exam</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label>Exam Name</Label>
                                                    <Input
                                                        value={examForm.name}
                                                        onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                                                        placeholder="e.g., Mid Semester Exam"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Course</Label>
                                                    <Select
                                                        value={examForm.course_id}
                                                        onValueChange={(v) => setExamForm({ ...examForm, course_id: v })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select course..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {courses.map(c => (
                                                                <SelectItem key={c.id} value={c.id.toString()}>
                                                                    {c.code} - {c.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Date</Label>
                                                    <Input
                                                        type="date"
                                                        value={examForm.exam_date}
                                                        onChange={(e) => setExamForm({ ...examForm, exam_date: e.target.value })}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Start Time</Label>
                                                        <Input
                                                            type="time"
                                                            value={examForm.start_time}
                                                            onChange={(e) => setExamForm({ ...examForm, start_time: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>End Time</Label>
                                                        <Input
                                                            type="time"
                                                            value={examForm.end_time}
                                                            onChange={(e) => setExamForm({ ...examForm, end_time: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button onClick={handleCreateExam} className="bg-[#1a365d]">Create</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Exam</TableHead>
                                                <TableHead>Course</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Time</TableHead>
                                                <TableHead>Visibility</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {exams.map((exam) => (
                                                <TableRow key={exam.id}>
                                                    <TableCell className="font-medium">{exam.name}</TableCell>
                                                    <TableCell>{exam.course_code}</TableCell>
                                                    <TableCell>{exam.exam_date}</TableCell>
                                                    <TableCell>{exam.start_time} - {exam.end_time}</TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleToggleVisibility(exam.id)}
                                                        >
                                                            {exam.is_visible ? (
                                                                <Eye className="w-4 h-4 text-green-600" />
                                                            ) : (
                                                                <EyeOff className="w-4 h-4 text-slate-400" />
                                                            )}
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedExam(exam);
                                                                setShowGenerateSeating(true);
                                                            }}
                                                        >
                                                            Generate Seating
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Halls Tab */}
                        <TabsContent value="halls">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Building2 className="w-5 h-5" />
                                            Exam Halls
                                        </CardTitle>
                                        <CardDescription>Manage exam halls and capacities</CardDescription>
                                    </div>
                                    <Dialog open={showNewHall} onOpenChange={setShowNewHall}>
                                        <DialogTrigger asChild>
                                            <Button className="bg-[#1a365d]">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Hall
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Create Exam Hall</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label>Hall Name</Label>
                                                    <Input
                                                        value={hallForm.name}
                                                        onChange={(e) => setHallForm({ ...hallForm, name: e.target.value })}
                                                        placeholder="e.g., Hall A"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Building</Label>
                                                    <Input
                                                        value={hallForm.building}
                                                        onChange={(e) => setHallForm({ ...hallForm, building: e.target.value })}
                                                        placeholder="e.g., Main Block"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Floor</Label>
                                                        <Input
                                                            type="number"
                                                            value={hallForm.floor}
                                                            onChange={(e) => setHallForm({ ...hallForm, floor: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Capacity</Label>
                                                        <Input
                                                            type="number"
                                                            value={hallForm.capacity}
                                                            onChange={(e) => setHallForm({ ...hallForm, capacity: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button onClick={handleCreateHall} className="bg-[#1a365d]">Create</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {halls.map((hall) => (
                                            <div key={hall.id} className="border rounded-lg p-4">
                                                <h3 className="font-semibold">{hall.name}</h3>
                                                <p className="text-sm text-slate-500">{hall.building}, Floor {hall.floor}</p>
                                                <Badge variant="outline" className="mt-2">
                                                    <Users className="w-3 h-3 mr-1" />
                                                    Capacity: {hall.capacity}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Seating Tab */}
                        <TabsContent value="seating">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="w-5 h-5" />
                                        Seating Arrangement
                                    </CardTitle>
                                    <CardDescription>View generated seating for exams</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-4 mb-4">
                                        <Select onValueChange={(v) => handleViewSeating(parseInt(v))}>
                                            <SelectTrigger className="w-[300px]">
                                                <SelectValue placeholder="Select exam to view seating..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {exams.map(e => (
                                                    <SelectItem key={e.id} value={e.id.toString()}>
                                                        {e.name} - {e.exam_date}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {seatingArrangement.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Seat #</TableHead>
                                                    <TableHead>Student</TableHead>
                                                    <TableHead>USN</TableHead>
                                                    <TableHead>Department</TableHead>
                                                    <TableHead>Hall</TableHead>
                                                    <TableHead>Location</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {seatingArrangement.map((seat) => (
                                                    <TableRow key={seat.id}>
                                                        <TableCell className="font-bold">#{seat.seat_number}</TableCell>
                                                        <TableCell>{seat.student_name}</TableCell>
                                                        <TableCell>{seat.usn}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">{seat.department}</Badge>
                                                        </TableCell>
                                                        <TableCell>{seat.hall_name}</TableCell>
                                                        <TableCell>{seat.building}, Floor {seat.floor}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="text-center py-8 text-slate-500">
                                            <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                            <p>Select an exam to view seating arrangement</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                )}

                {/* Generate Seating Dialog */}
                <Dialog open={showGenerateSeating} onOpenChange={setShowGenerateSeating}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Generate Seating</DialogTitle>
                            <DialogDescription>
                                {selectedExam?.name} - {selectedExam?.exam_date}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Label className="mb-3 block">Select Halls</Label>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {halls.map((hall) => (
                                    <label key={hall.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                                        <input
                                            type="checkbox"
                                            checked={selectedHalls.includes(hall.id.toString())}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedHalls([...selectedHalls, hall.id.toString()]);
                                                } else {
                                                    setSelectedHalls(selectedHalls.filter(h => h !== hall.id.toString()));
                                                }
                                            }}
                                            className="w-4 h-4"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium">{hall.name}</p>
                                            <p className="text-sm text-slate-500">
                                                {hall.building}, Floor {hall.floor} | Capacity: {hall.capacity}
                                            </p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                onClick={handleGenerateSeating}
                                className="bg-[#1a365d]"
                                disabled={selectedHalls.length === 0}
                            >
                                Generate Seating
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};
