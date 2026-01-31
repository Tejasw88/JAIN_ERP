import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient, useAuth } from "../App";
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
import {
  GraduationCap,
  Loader2,
  TrendingUp,
  TrendingDown
} from "lucide-react";

export const GradesPage = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGrades = useCallback(async () => {
    try {
      const res = await apiClient.get("/grades");
      setGrades(res.data);
    } catch (error) {
      toast.error("Failed to fetch grades");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return "bg-emerald-100 text-emerald-700";
    if (percentage >= 75) return "bg-blue-100 text-blue-700";
    if (percentage >= 60) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  const getGradeLetter = (percentage) => {
    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "F";
  };

  // Calculate average
  const average = grades.length > 0
    ? grades.reduce((sum, g) => sum + (g.score / g.max_score) * 100, 0) / grades.length
    : 0;

  // Group by course for students
  const gradesByCourse = grades.reduce((acc, grade) => {
    const key = grade.course_name || grade.course_code;
    if (!acc[key]) acc[key] = [];
    acc[key].push(grade);
    return acc;
  }, {});

  if (loading) {
    return (
      <DashboardLayout title="Grades">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a365d]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Grades">
      {/* Stats */}
      {(user?.role === "Student" || user?.role === "Parent") && grades.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="metric-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Overall Average</p>
                  <p className="text-3xl font-bold text-slate-900">{average.toFixed(1)}%</p>
                </div>
                <div className={`p-3 rounded-full ${average >= 75 ? "bg-emerald-100" : "bg-amber-100"}`}>
                  {average >= 75 ? (
                    <TrendingUp className={`w-6 h-6 ${average >= 75 ? "text-emerald-600" : "text-amber-600"}`} />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-amber-600" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Assignments</p>
                  <p className="text-3xl font-bold text-slate-900">{grades.length}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <GraduationCap className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Letter Grade</p>
                  <p className="text-3xl font-bold text-slate-900">{getGradeLetter(average)}</p>
                </div>
                <Badge className={`text-lg px-4 py-2 ${getGradeColor(average)}`}>
                  {average >= 75 ? "Passing" : "Needs Work"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grades by Course for Student/Parent */}
      {(user?.role === "Student" || user?.role === "Parent") && Object.keys(gradesByCourse).length > 0 && (
        <div className="space-y-6">
          {Object.entries(gradesByCourse).map(([courseName, courseGrades]) => {
            const courseAvg = courseGrades.reduce((sum, g) => sum + (g.score / g.max_score) * 100, 0) / courseGrades.length;
            return (
              <Card key={courseName}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{courseName}</CardTitle>
                      <CardDescription>{courseGrades.length} graded assignments</CardDescription>
                    </div>
                    <Badge className={`${getGradeColor(courseAvg)} text-lg px-4 py-2`}>
                      {courseAvg.toFixed(0)}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border overflow-hidden">
                    <Table className="data-table">
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead>Assignment</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Percentage</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {courseGrades.map((grade) => {
                          const percentage = (grade.score / grade.max_score) * 100;
                          return (
                            <TableRow key={grade.id}>
                              <TableCell className="font-medium">{grade.assignment_name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{grade.grade_type}</Badge>
                              </TableCell>
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* All Grades Table for Admin/Teacher */}
      {(user?.role === "Admin" || user?.role === "Teacher") && (
        <Card>
          <CardHeader>
            <CardTitle>All Grades</CardTitle>
            <CardDescription>View all grades in the system</CardDescription>
          </CardHeader>
          <CardContent>
            {grades.length > 0 ? (
              <div className="rounded-lg border overflow-hidden">
                <Table className="data-table">
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Student</TableHead>
                      <TableHead>USN</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grades.map((grade) => {
                      const percentage = (grade.score / grade.max_score) * 100;
                      return (
                        <TableRow key={grade.id}>
                          <TableCell className="font-medium">{grade.student_name}</TableCell>
                          <TableCell className="text-slate-500">{grade.usn || "-"}</TableCell>
                          <TableCell>{grade.course_name}</TableCell>
                          <TableCell>{grade.assignment_name}</TableCell>
                          <TableCell>
                            <Badge className={getGradeColor(percentage)}>
                              {grade.score}/{grade.max_score}
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
      )}

      {grades.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="p-4 bg-slate-100 rounded-full w-fit mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Grades Found</h3>
            <p className="text-slate-500">No grades have been recorded yet</p>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
};
