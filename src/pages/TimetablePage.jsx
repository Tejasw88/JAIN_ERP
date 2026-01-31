import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient, useAuth } from "../App";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Loader2, Calendar, Clock, Plus, Edit2, Trash2, User, ChevronRight } from "lucide-react";

const DEPARTMENTS_FALLBACK = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "AIML", "IoT", "CSBS"];
const YEARS = ["1", "2", "3", "4"];
const SECTIONS = ["A", "B", "C", "D"];

const GenerateTimetableDialog = ({ department, year, section, onGenerated }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [availableTeachers, setAvailableTeachers] = useState([]);
    const [availableCourses, setAvailableCourses] = useState([]);
    const [pairings, setPairings] = useState([{ course_id: "", teacher_id: "", slots: 4 }]);

    const fetchPairs = async () => {
        try {
            const res = await apiClient.get("/users/teachers/subjects", { params: { department } });
            setAvailableTeachers(res.data.teachers);
            setAvailableCourses(res.data.courses);
        } catch (e) {
            toast.error("Failed to fetch teachers/courses");
        }
    };

    const handleAddPair = () => setPairings([...pairings, { course_id: "", teacher_id: "", slots: 4 }]);
    const handleRemovePair = (index) => setPairings(pairings.filter((_, i) => i !== index));
    const updatePair = (index, field, value) => {
        const newPairs = [...pairings];
        newPairs[index][field] = value;
        setPairings(newPairs);
    };

    const handleGenerate = async () => {
        // Validation
        if (pairings.some(p => !p.course_id || !p.teacher_id)) {
            toast.error("Please fill all teacher-subject pairs");
            return;
        }

        setLoading(true);
        try {
            const res = await apiClient.post("/timetable/generate", {
                department,
                year,
                section,
                pairings: pairings.map(p => ({
                    course_id: parseInt(p.course_id),
                    teacher_id: parseInt(p.teacher_id),
                    slots_per_week: parseInt(p.slots)
                }))
            });

            if (res.data.status === "success") {
                toast.success("Timetable generated successfully!");
            } else {
                toast.warning(res.data.message);
            }
            setOpen(false);
            onGenerated();
        } catch (e) {
            toast.error(e.response?.data?.detail || "Generation failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (val) fetchPairs(); }}>
            <DialogTrigger asChild>
                <Button className="bg-[#1a365d] gap-2">
                    <Plus className="w-4 h-4" />
                    Auto-Generate
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Generate Timetable</DialogTitle>
                    <DialogDescription>
                        Select teachers and their respective subjects for {department} Year {year} Section {section}.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {pairings.map((p, index) => (
                        <div key={index} className="grid grid-cols-12 gap-3 items-end border-b pb-4 last:border-0">
                            <div className="col-span-4 space-y-2">
                                <Label>Subject</Label>
                                <Select value={p.course_id} onValueChange={(v) => updatePair(index, 'course_id', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Course..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableCourses.map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>{c.code} - {c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-4 space-y-2">
                                <Label>Teacher</Label>
                                <Select value={p.teacher_id} onValueChange={(v) => updatePair(index, 'teacher_id', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Teacher..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableTeachers.map(t => (
                                            <SelectItem key={t.id} value={t.id.toString()}>{t.name || t.full_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-3 space-y-2">
                                <Label>Slots/Week</Label>
                                <Input
                                    type="number"
                                    value={p.slots}
                                    onChange={(e) => updatePair(index, 'slots', e.target.value)}
                                    min={1}
                                    max={10}
                                />
                            </div>
                            <div className="col-span-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500"
                                    onClick={() => handleRemovePair(index)}
                                    disabled={pairings.length === 1}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    <Button variant="outline" onClick={handleAddPair} className="w-full dashed border-2">
                        <Plus className="w-4 h-4 mr-2" /> Add Course/Teacher
                    </Button>
                </div>

                <DialogFooter>
                    <Button onClick={handleGenerate} className="bg-[#1a365d] w-full" disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Generate Collision-Free Timetable
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export const TimetablePage = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === "Admin";

    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState({ slots: [], days: [] });
    const [timetable, setTimetable] = useState([]);
    const [classTeacher, setClassTeacher] = useState(null);
    const [courses, setCourses] = useState([]);
    const [teachers, setTeachers] = useState([]);

    // Dynamic departments
    const [departments, setDepartments] = useState([]);

    // Filters
    const [selectedDept, setSelectedDept] = useState("");
    const [selectedYear, setSelectedYear] = useState(user?.year || "1");
    const [selectedSection, setSelectedSection] = useState("A");

    // Add slot dialog
    const [showAddSlot, setShowAddSlot] = useState(false);
    const [selectedDay, setSelectedDay] = useState("");
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [slotForm, setSlotForm] = useState({
        course_id: "",
        teacher_id: "",
        room: ""
    });

    // Class teacher dialog
    const [showClassTeacher, setShowClassTeacher] = useState(false);
    const [classTeacherForm, setClassTeacherForm] = useState({ teacher_id: "" });

    const fetchConfig = useCallback(async () => {
        try {
            const [configRes, deptsRes] = await Promise.all([
                apiClient.get("/timetable/slots-config"),
                apiClient.get("/departments")
            ]);
            setConfig(configRes.data);
            const depts = deptsRes.data;
            setDepartments(depts);

            // Set initial dept if not set
            if (!selectedDept && depts.length > 0) {
                const initialDept = user?.department || depts[0].code;
                setSelectedDept(initialDept);
            }
        } catch (error) {
            console.error("Failed to load config/depts:", error);
        }
    }, [selectedDept, user?.department]);

    const fetchTimetable = useCallback(async () => {
        if (!selectedDept) return;
        setLoading(true);
        try {
            const res = await apiClient.get("/timetable", {
                params: { department: selectedDept, year: selectedYear, section: selectedSection }
            });
            setTimetable(res.data.slots || []);
            setClassTeacher(res.data.class_teacher);
        } catch (error) {
            toast.error("Failed to load timetable");
        } finally {
            setLoading(false);
        }
    }, [selectedDept, selectedYear, selectedSection]);

    const fetchTeachersAndCourses = useCallback(async () => {
        if (!isAdmin) return;
        try {
            const [coursesRes, teachersRes] = await Promise.all([
                apiClient.get("/courses"),
                apiClient.get("/users/teachers")
            ]);
            setCourses(coursesRes.data || []);
            setTeachers(teachersRes.data || []);
        } catch (error) {
            console.error("Failed to load teachers/courses:", error);
        }
    }, [isAdmin]);

    useEffect(() => {
        fetchConfig();
        fetchTeachersAndCourses();
    }, [fetchConfig, fetchTeachersAndCourses]);

    useEffect(() => {
        if (selectedDept && selectedYear && selectedSection) {
            fetchTimetable();
        }
    }, [fetchTimetable, selectedDept, selectedYear, selectedSection]);

    const getSlotForCell = (day, slotNum) => {
        return timetable.find(
            s => s.day_of_week === day && s.slot_number === slotNum
        );
    };

    const handleAddSlot = async () => {
        try {
            await apiClient.post("/timetable/slot", {
                department: selectedDept,
                year: selectedYear,
                section: selectedSection,
                day_of_week: selectedDay,
                slot_number: selectedSlot,
                course_id: parseInt(slotForm.course_id),
                teacher_id: parseInt(slotForm.teacher_id),
                room: slotForm.room
            });
            toast.success("Slot added successfully");
            setShowAddSlot(false);
            setSlotForm({ course_id: "", teacher_id: "", room: "" });
            fetchTimetable();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to add slot");
        }
    };

    const handleDeleteSlot = async (slotId) => {
        if (!window.confirm("Delete this slot?")) return;
        try {
            await apiClient.delete(`/timetable/slot/${slotId}`);
            toast.success("Slot deleted");
            fetchTimetable();
        } catch (error) {
            toast.error("Failed to delete slot");
        }
    };

    const handleAssignClassTeacher = async () => {
        try {
            await apiClient.post("/timetable/class-teacher", {
                department: selectedDept,
                year: selectedYear,
                section: selectedSection,
                teacher_id: parseInt(classTeacherForm.teacher_id)
            });
            toast.success("Class teacher assigned");
            setShowClassTeacher(false);
            fetchTimetable();
        } catch (error) {
            toast.error("Failed to assign class teacher");
        }
    };

    const openAddSlotDialog = (day, slotNum) => {
        setSelectedDay(day);
        setSelectedSlot(slotNum);
        setSlotForm({ course_id: "", teacher_id: "", room: "" });
        setShowAddSlot(true);
    };

    return (
        <DashboardLayout title="Timetable">
            <div className="space-y-6">
                {/* Navigation Breadcrumb */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Label className="text-slate-500">Department:</Label>
                                <Select value={selectedDept} onValueChange={setSelectedDept}>
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.length > 0 ? (
                                            departments.map(d => (
                                                <SelectItem key={d.id} value={d.code}>{d.code}</SelectItem>
                                            ))
                                        ) : (
                                            DEPARTMENTS_FALLBACK.map(d => (
                                                <SelectItem key={d} value={d}>{d}</SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <ChevronRight className="w-4 h-4 text-slate-400" />

                            <div className="flex items-center gap-2">
                                <Label className="text-slate-500">Year:</Label>
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className="w-[100px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {YEARS.map(y => (
                                            <SelectItem key={y} value={y}>Year {y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <ChevronRight className="w-4 h-4 text-slate-400" />

                            <div className="flex items-center gap-2">
                                <Label className="text-slate-500">Section:</Label>
                                <Select value={selectedSection} onValueChange={setSelectedSection}>
                                    <SelectTrigger className="w-[100px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SECTIONS.map(s => (
                                            <SelectItem key={s} value={s}>Section {s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex-1" />

                            {/* Class Teacher Info */}
                            <div className="flex items-center gap-3">
                                {classTeacher ? (
                                    <Badge variant="outline" className="gap-2 py-1.5">
                                        <User className="w-3 h-3" />
                                        Class Teacher: {classTeacher.teacher_name}
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary">No Class Teacher Assigned</Badge>
                                )}

                                {isAdmin && (
                                    <Dialog open={showClassTeacher} onOpenChange={setShowClassTeacher}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                <Edit2 className="w-3 h-3 mr-1" /> Assign Class Teacher
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Assign Class Teacher</DialogTitle>
                                                <DialogDescription>
                                                    {selectedDept} Year {selectedYear} Section {selectedSection}
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <Label>Select Teacher</Label>
                                                <Select
                                                    value={classTeacherForm.teacher_id}
                                                    onValueChange={(v) => setClassTeacherForm({ teacher_id: v })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Choose teacher..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {teachers.map(t => (
                                                            <SelectItem key={t.id} value={t.id.toString()}>
                                                                {t.name || t.full_name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <DialogFooter>
                                                <Button onClick={handleAssignClassTeacher} className="bg-[#1a365d]">
                                                    Assign
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                )}

                                {isAdmin && (
                                    <GenerateTimetableDialog
                                        department={selectedDept}
                                        year={selectedYear}
                                        section={selectedSection}
                                        onGenerated={fetchTimetable}
                                    />
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Timetable Grid */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Weekly Timetable
                        </CardTitle>
                        <CardDescription>
                            {selectedDept} • Year {selectedYear} • Section {selectedSection}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="w-8 h-8 animate-spin text-[#1a365d]" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-slate-100">
                                            <th className="border p-3 text-left font-medium text-slate-700 w-[100px]">
                                                <Clock className="w-4 h-4 inline mr-1" /> Slot
                                            </th>
                                            {config.days?.map(day => (
                                                <th key={day} className="border p-3 text-center font-medium text-slate-700 min-w-[120px]">
                                                    {day}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {config.slots?.map(slotConfig => (
                                            <tr key={slotConfig.slot} className="hover:bg-slate-50">
                                                <td className="border p-3 bg-slate-50">
                                                    <div className="font-medium text-sm">Slot {slotConfig.slot}</div>
                                                    <div className="text-xs text-slate-500">
                                                        {slotConfig.start} - {slotConfig.end}
                                                    </div>
                                                </td>
                                                {config.days?.map(day => {
                                                    const slot = getSlotForCell(day, slotConfig.slot);
                                                    return (
                                                        <td key={day} className="border p-2">
                                                            {slot ? (
                                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 group relative">
                                                                    <div className="font-medium text-sm text-blue-900">
                                                                        {slot.course_code || slot.course_name}
                                                                    </div>
                                                                    <div className="text-xs text-blue-700">{slot.teacher_name}</div>
                                                                    {slot.room && (
                                                                        <div className="text-xs text-slate-500">Room: {slot.room}</div>
                                                                    )}
                                                                    {isAdmin && (
                                                                        <button
                                                                            onClick={() => handleDeleteSlot(slot.id)}
                                                                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        >
                                                                            <Trash2 className="w-3 h-3 text-red-500 hover:text-red-700" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ) : isAdmin ? (
                                                                <button
                                                                    onClick={() => openAddSlotDialog(day, slotConfig.slot)}
                                                                    className="w-full h-full min-h-[60px] border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                                                                >
                                                                    <Plus className="w-4 h-4" />
                                                                </button>
                                                            ) : (
                                                                <div className="text-center text-slate-400 text-sm py-4">—</div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Add Slot Dialog */}
                <Dialog open={showAddSlot} onOpenChange={setShowAddSlot}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Class</DialogTitle>
                            <DialogDescription>
                                {selectedDay} • Slot {selectedSlot} ({config.slots?.find(s => s.slot === selectedSlot)?.start} - {config.slots?.find(s => s.slot === selectedSlot)?.end})
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Course</Label>
                                <Select value={slotForm.course_id} onValueChange={(v) => setSlotForm({ ...slotForm, course_id: v })}>
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
                                <Label>Teacher</Label>
                                <Select value={slotForm.teacher_id} onValueChange={(v) => setSlotForm({ ...slotForm, teacher_id: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select teacher..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {teachers.map(t => (
                                            <SelectItem key={t.id} value={t.id.toString()}>
                                                {t.name || t.full_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Room (Optional)</Label>
                                <Input
                                    value={slotForm.room}
                                    onChange={(e) => setSlotForm({ ...slotForm, room: e.target.value })}
                                    placeholder="e.g., Room 101"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowAddSlot(false)}>Cancel</Button>
                            <Button
                                onClick={handleAddSlot}
                                className="bg-[#1a365d]"
                                disabled={!slotForm.course_id || !slotForm.teacher_id}
                            >
                                Add Class
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};
