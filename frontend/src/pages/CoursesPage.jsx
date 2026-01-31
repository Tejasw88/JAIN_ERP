import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient, useAuth } from "../App";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import {
  BookOpen,
  Plus,
  Users,
  Loader2,
  GraduationCap
} from "lucide-react";

export const CoursesPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [newCourse, setNewCourse] = useState({
    name: "",
    code: "",
    department: "",
    description: "",
    credits: 3
  });

  const fetchCoursesAndDepts = useCallback(async () => {
    try {
      const [coursesRes, deptsRes] = await Promise.all([
        apiClient.get("/courses"),
        apiClient.get("/departments")
      ]);
      setCourses(coursesRes.data);
      setDepartmentsList(deptsRes.data);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoursesAndDepts();
  }, [fetchCoursesAndDepts]);

  const handleAddCourse = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post("/courses", newCourse);
      toast.success("Course created successfully");
      setShowAddCourse(false);
      setNewCourse({ name: "", code: "", department: "", description: "", credits: 3 });
      fetchCourses();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create course");
    }
  };

  const canCreateCourse = user?.role === "Admin" || user?.role === "Teacher";

  if (loading) {
    return (
      <DashboardLayout title="Courses">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a365d]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Courses">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {user?.role === "Student" ? "My Courses" : "All Courses"}
          </h1>
          <p className="text-slate-500">
            {user?.role === "Student"
              ? "Courses you are enrolled in"
              : user?.role === "Teacher"
                ? "Courses you are teaching"
                : "Manage all courses in the system"}
          </p>
        </div>

        {canCreateCourse && (
          <Dialog open={showAddCourse} onOpenChange={setShowAddCourse}>
            <DialogTrigger asChild>
              <Button className="bg-[#1a365d] hover:bg-[#102a43]" data-testid="add-course-btn">
                <Plus className="w-4 h-4 mr-2" />
                Add Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
                <DialogDescription>Add a new course to the system</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddCourse} className="space-y-4">
                <div className="space-y-2">
                  <Label>Course Name</Label>
                  <Input
                    value={newCourse.name}
                    onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                    placeholder="Data Structures & Algorithms"
                    required
                    data-testid="course-name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Course Code</Label>
                    <Input
                      value={newCourse.code}
                      onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                      placeholder="CS201"
                      required
                      data-testid="course-code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Credits</Label>
                    <Input
                      type="number"
                      value={newCourse.credits}
                      onChange={(e) => setNewCourse({ ...newCourse, credits: parseInt(e.target.value) })}
                      min={1}
                      max={6}
                      data-testid="course-credits"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select
                    value={newCourse.department}
                    onValueChange={(v) => setNewCourse({ ...newCourse, department: v })}
                  >
                    <SelectTrigger data-testid="course-department">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentsList.map(dept => (
                        <SelectItem key={dept.id} value={dept.code}>{dept.code} - {dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                    placeholder="Course description..."
                    data-testid="course-description"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-[#1a365d]" data-testid="submit-course">
                    Create Course
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="card-hover group" data-testid={`course-${course.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge className="bg-[#1a365d]/10 text-[#1a365d] mb-2">{course.code}</Badge>
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                  </div>
                  <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-[#1a365d]/10 transition-colors">
                    <BookOpen className="w-5 h-5 text-slate-600 group-hover:text-[#1a365d]" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                  {course.description || "No description available"}
                </p>
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <GraduationCap className="w-4 h-4" />
                    <span>{course.credits} Credits</span>
                  </div>
                  {course.teacher_name && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Users className="w-4 h-4" />
                      <span>{course.teacher_name}</span>
                    </div>
                  )}
                </div>
                {course.department && (
                  <div className="mt-3">
                    <Badge variant="outline" className="text-xs">{course.department}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <div className="p-4 bg-slate-100 rounded-full w-fit mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Courses Found</h3>
            <p className="text-slate-500 mb-4">
              {user?.role === "Student"
                ? "You are not enrolled in any courses yet"
                : "No courses have been created yet"}
            </p>
            {canCreateCourse && (
              <Button className="bg-[#1a365d]" onClick={() => setShowAddCourse(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Course
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
};
