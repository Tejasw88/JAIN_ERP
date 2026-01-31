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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import {
  FileText,
  Plus,
  Loader2,
  Clock,
  BookOpen,
  ClipboardList,
  Megaphone,
  Send
} from "lucide-react";

export const ClassworkPage = () => {
  const { user } = useAuth();
  const [classwork, setClasswork] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddClasswork, setShowAddClasswork] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [selectedWork, setSelectedWork] = useState(null);
  const [submissionContent, setSubmissionContent] = useState("");

  const [newClasswork, setNewClasswork] = useState({
    course_id: "",
    title: "",
    description: "",
    type: "Assignment",
    due_date: "",
    max_score: 100
  });

  const fetchData = useCallback(async () => {
    try {
      const [classworkRes, coursesRes] = await Promise.all([
        apiClient.get("/classwork"),
        apiClient.get("/courses")
      ]);
      setClasswork(classworkRes.data);
      setCourses(coursesRes.data);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddClasswork = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post("/classwork", {
        ...newClasswork,
        max_score: parseFloat(newClasswork.max_score)
      });
      toast.success("Classwork created successfully");
      setShowAddClasswork(false);
      setNewClasswork({
        course_id: "",
        title: "",
        description: "",
        type: "Assignment",
        due_date: "",
        max_score: 100
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create classwork");
    }
  };

  const handleSubmit = async () => {
    if (!selectedWork) return;
    try {
      await apiClient.post("/submissions", {
        classwork_id: selectedWork.id,
        content: submissionContent
      });
      toast.success("Assignment submitted successfully");
      setShowSubmit(false);
      setSelectedWork(null);
      setSubmissionContent("");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to submit");
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "Assignment": return <FileText className="w-5 h-5" />;
      case "Quiz": return <ClipboardList className="w-5 h-5" />;
      case "Material": return <BookOpen className="w-5 h-5" />;
      case "Announcement": return <Megaphone className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "Assignment": return "bg-blue-100 text-blue-700";
      case "Quiz": return "bg-purple-100 text-purple-700";
      case "Material": return "bg-emerald-100 text-emerald-700";
      case "Announcement": return "bg-amber-100 text-amber-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const canCreate = user?.role === "Admin" || user?.role === "Teacher";

  if (loading) {
    return (
      <DashboardLayout title="Classwork">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a365d]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Classwork">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Classwork</h1>
          <p className="text-slate-500">
            {user?.role === "Student" 
              ? "View assignments and submit your work"
              : "Manage assignments, quizzes, and materials"}
          </p>
        </div>
        
        {canCreate && (
          <Dialog open={showAddClasswork} onOpenChange={setShowAddClasswork}>
            <DialogTrigger asChild>
              <Button className="bg-[#1a365d] hover:bg-[#102a43]" data-testid="add-classwork-btn">
                <Plus className="w-4 h-4 mr-2" />
                Create Classwork
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Classwork</DialogTitle>
                <DialogDescription>Add an assignment, quiz, or material</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddClasswork} className="space-y-4">
                <div className="space-y-2">
                  <Label>Course</Label>
                  <Select
                    value={newClasswork.course_id}
                    onValueChange={(v) => setNewClasswork({ ...newClasswork, course_id: v })}
                  >
                    <SelectTrigger data-testid="classwork-course">
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={newClasswork.type}
                    onValueChange={(v) => setNewClasswork({ ...newClasswork, type: v })}
                  >
                    <SelectTrigger data-testid="classwork-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Assignment">Assignment</SelectItem>
                      <SelectItem value="Quiz">Quiz</SelectItem>
                      <SelectItem value="Material">Material</SelectItem>
                      <SelectItem value="Announcement">Announcement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={newClasswork.title}
                    onChange={(e) => setNewClasswork({ ...newClasswork, title: e.target.value })}
                    placeholder="Assignment title"
                    required
                    data-testid="classwork-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newClasswork.description}
                    onChange={(e) => setNewClasswork({ ...newClasswork, description: e.target.value })}
                    placeholder="Instructions and details..."
                    data-testid="classwork-description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input
                      type="datetime-local"
                      value={newClasswork.due_date}
                      onChange={(e) => setNewClasswork({ ...newClasswork, due_date: e.target.value })}
                      data-testid="classwork-due"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Score</Label>
                    <Input
                      type="number"
                      value={newClasswork.max_score}
                      onChange={(e) => setNewClasswork({ ...newClasswork, max_score: e.target.value })}
                      data-testid="classwork-max-score"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-[#1a365d]" data-testid="submit-classwork">
                    Create Classwork
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Classwork Grid */}
      {classwork.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classwork.map((work) => (
            <Card key={work.id} className="card-hover group" data-testid={`classwork-${work.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <Badge className={`${getTypeColor(work.type)} flex items-center gap-1`}>
                    {getTypeIcon(work.type)}
                    {work.type}
                  </Badge>
                  {work.max_score && (
                    <span className="text-sm text-slate-500">{work.max_score} pts</span>
                  )}
                </div>
                <CardTitle className="text-lg mt-2">{work.title}</CardTitle>
                <CardDescription>{work.course_name}</CardDescription>
              </CardHeader>
              <CardContent>
                {work.description && (
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">{work.description}</p>
                )}
                
                {work.due_date && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                    <Clock className="w-4 h-4" />
                    <span>Due: {new Date(work.due_date).toLocaleString()}</span>
                  </div>
                )}

                {user?.role === "Student" && work.type === "Assignment" && (
                  <Button
                    className="w-full bg-[#1a365d]"
                    onClick={() => {
                      setSelectedWork(work);
                      setShowSubmit(true);
                    }}
                    data-testid={`submit-${work.id}`}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Submit Work
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <div className="p-4 bg-slate-100 rounded-full w-fit mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Classwork Found</h3>
            <p className="text-slate-500 mb-4">
              {user?.role === "Student"
                ? "No assignments have been posted yet"
                : "Create your first classwork item"}
            </p>
            {canCreate && (
              <Button className="bg-[#1a365d]" onClick={() => setShowAddClasswork(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Classwork
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submit Dialog */}
      <Dialog open={showSubmit} onOpenChange={setShowSubmit}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit Assignment</DialogTitle>
            <DialogDescription>
              {selectedWork?.title} - {selectedWork?.course_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Your Submission</Label>
              <Textarea
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                placeholder="Enter your answer or submission content..."
                rows={6}
                data-testid="submission-content"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmit(false)}>
              Cancel
            </Button>
            <Button className="bg-[#1a365d]" onClick={handleSubmit} data-testid="confirm-submit">
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};
