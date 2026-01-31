import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient } from "../App";
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
  Users,
  BookOpen,
  GraduationCap,
  UserPlus,
  Upload,
  Trash2,
  Link as LinkIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  UserCheck,
  Plus,
  ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showLinkParent, setShowLinkParent] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  // New user form
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "123456789",
    role: "Student",
    name: "",
    idno: "",
    department: "",
    year: "", // Removed default "1"
    section: "" // Removed default "A"
  });

  // Bulk upload settings
  const [bulkSettings, setBulkSettings] = useState({
    department: "",
    year: "1",
    section: "A"
  });

  // Parent link form
  const [parentLink, setParentLink] = useState({
    parent_id: "",
    student_username: "",
    student_usn_digits: ""
  });

  // Filter state
  const [filters, setFilters] = useState({
    role: "all",
    department: "all",
    year: "all",
    section: "all"
  });

  // Department list state
  const [departmentsList, setDepartmentsList] = useState([]);
  const [showAddDept, setShowAddDept] = useState(false);
  const [newDept, setNewDept] = useState({ name: "", code: "" });
  const [deptLoading, setDeptLoading] = useState(false);

  const years = ["1", "2", "3", "4"];

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, usersRes, deptsRes] = await Promise.all([
        apiClient.get("/dashboard/stats"),
        apiClient.get("/users"),
        apiClient.get("/departments")
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setDepartmentsList(deptsRes.data);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post("/users", newUser);
      toast.success("User created successfully");
      setShowAddUser(false);
      setNewUser({
        username: "",
        email: "",
        password: "123456789",
        role: "Student",
        name: "",
        idno: "",
        department: "",
        year: "",
        section: ""
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create user");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await apiClient.delete(`/users/${userId}`);
      toast.success("User deleted successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const handleAddDept = async (e) => {
    e.preventDefault();
    setDeptLoading(true);
    try {
      await apiClient.post("/departments", newDept);
      toast.success("Department added successfully");
      setNewDept({ name: "", code: "" });
      setShowAddDept(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to add department");
    } finally {
      setDeptLoading(false);
    }
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm("Are you sure? This may affect users linked to this department.")) return;
    try {
      await apiClient.delete(`/departments/${id}`);
      toast.success("Department removed");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete department");
    }
  };

  const handleLinkParent = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post("/users/link-parent", parentLink);
      toast.success("Parent linked to student successfully");
      setShowLinkParent(false);
      setParentLink({ parent_id: "", student_username: "", student_usn_digits: "" });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to link parent");
    }
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress({ status: "uploading", message: "Uploading file..." });

    const formData = new FormData();
    formData.append("file", file);
    if (bulkSettings.department) formData.append("department", bulkSettings.department);
    formData.append("year", bulkSettings.year);
    formData.append("section", bulkSettings.section);

    try {
      const response = await apiClient.post("/users/bulk-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setUploadProgress({
        status: "success",
        message: response.data.message,
        errors: response.data.errors
      });

      toast.success(response.data.message);
      fetchData();
    } catch (error) {
      setUploadProgress({
        status: "error",
        message: error.response?.data?.detail || "Upload failed"
      });
      toast.error(error.response?.data?.detail || "Upload failed");
    }

    e.target.value = "";
  };

  const downloadTemplate = () => {
    const template = [
      { sno: 1, student_name: "John Doe", usn: "JUUG25BTECH00001", department: "Computer Science", year: "1", section: "A" },
      { sno: 2, student_name: "Jane Smith", usn: "JUUG25BTECH00002", department: "Electronics", year: "1", section: "B" }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "student_template.xlsx");
  };

  const getRoleBadge = (role) => {
    const variants = {
      Admin: "bg-purple-100 text-purple-700",
      Teacher: "bg-blue-100 text-blue-700",
      Student: "bg-emerald-100 text-emerald-700",
      Parent: "bg-amber-100 text-amber-700"
    };
    return <Badge className={variants[role]}>{role}</Badge>;
  };

  const parents = users.filter(u => u.role === "Parent");
  const students = users.filter(u => u.role === "Student");

  // Apply filters
  const filteredUsers = users.filter(user => {
    if (filters.role !== "all" && user.role !== filters.role) return false;

    if (filters.department !== "all") {
      const selectedDept = departmentsList.find(d =>
        String(d.code).toLowerCase().trim() === String(filters.department).toLowerCase().trim()
      );

      const normalize = (s) => String(s || "").toLowerCase().replace(/\s+/g, ' ').trim();

      const uDept = normalize(user.department);
      const fCode = normalize(filters.department);
      const fName = selectedDept ? normalize(selectedDept.name) : "";

      const isMatch = uDept === fCode || (fName && (uDept === fName || fName.includes(uDept) || uDept.includes(fName)));
      if (!isMatch) return false;
    }

    if (filters.year !== "all" && String(user.year || "") !== String(filters.year)) return false;
    if (filters.section !== "all" && String(user.section || "A") !== String(filters.section)) return false;

    return true;
  });

  if (loading) {
    return (
      <DashboardLayout title="Admin Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a365d]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admin Dashboard">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="card-hover metric-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Students</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total_students || 0}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <GraduationCap className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover metric-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Teachers</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total_teachers || 0}</p>
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
                <p className="text-sm text-slate-500 font-medium">Total Courses</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total_courses || 0}</p>
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
                <p className="text-sm text-slate-500 font-medium">Total Parents</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total_parents || 0}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <UserCheck className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="registration" className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="registration" data-testid="tab-registration">User Registration</TabsTrigger>
          <TabsTrigger value="departments" data-testid="tab-departments">Departments</TabsTrigger>
          <TabsTrigger value="bulk" data-testid="tab-bulk">Bulk Upload</TabsTrigger>
          <TabsTrigger value="link" data-testid="tab-link">Parent Linking</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="registration">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Actions</CardTitle>
                <CardDescription>Create new accounts or link parents to students</CardDescription>
              </div>
              <div className="flex gap-2">
                <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#1a365d] hover:bg-[#102a43]" data-testid="add-user-btn">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New User</DialogTitle>
                      <DialogDescription>
                        Create a new user account. Password will be <strong>123456789</strong> by default.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddUser} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Full Name</Label>
                          <Input
                            value={newUser.name}
                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                            placeholder="John Doe"
                            required
                            data-testid="new-user-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Role</Label>
                          <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                            <SelectTrigger data-testid="new-user-role">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Student">Student</SelectItem>
                              <SelectItem value="Teacher">Teacher</SelectItem>
                              <SelectItem value="Parent">Parent</SelectItem>
                              <SelectItem value="Admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Username</Label>
                        <Input
                          value={newUser.username}
                          onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                          placeholder="john.doe"
                          required
                          data-testid="new-user-username"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          placeholder="john@jainuniversity.ac.in"
                          required
                          data-testid="new-user-email"
                        />
                      </div>
                      {newUser.role === "Student" && (
                        <>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                              <Label>USN</Label>
                              <Input
                                value={newUser.idno}
                                onChange={(e) => setNewUser({ ...newUser, idno: e.target.value })}
                                placeholder="JUUG25BTECH00001"
                                data-testid="new-user-usn"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Year <span className="text-red-500">*</span></Label>
                              <Select value={newUser.year} onValueChange={(v) => setNewUser({ ...newUser, year: v })}>
                                <SelectTrigger className={!newUser.year ? "border-red-300" : ""}>
                                  <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent>
                                  {years.map(y => (
                                    <SelectItem key={y} value={y}>Year {y}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                              <Label>Section <span className="text-red-500">*</span></Label>
                              <Select value={newUser.section} onValueChange={(v) => setNewUser({ ...newUser, section: v })}>
                                <SelectTrigger className={!newUser.section ? "border-red-300" : ""}>
                                  <SelectValue placeholder="Select Section" />
                                </SelectTrigger>
                                <SelectContent>
                                  {["A", "B", "C", "D"].map(s => (
                                    <SelectItem key={s} value={s}>Section {s}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Department</Label>
                              <Select value={newUser.department} onValueChange={(v) => setNewUser({ ...newUser, department: v })}>
                                <SelectTrigger data-testid="new-user-department">
                                  <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                  {departmentsList.map(dept => (
                                    <SelectItem key={dept.id} value={dept.code}>{dept.code} - {dept.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </>
                      )}
                      <DialogFooter className="mt-6">
                        <Button type="submit" className="bg-[#1a365d] w-full" data-testid="submit-new-user">
                          Create User
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="py-12 border-t">
              <div className="text-center space-y-4">
                <div className="p-4 bg-blue-50 rounded-full w-fit mx-auto text-blue-600">
                  <UserPlus className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Registration Portal</h3>
                <p className="text-slate-500 max-w-sm mx-auto">
                  Use the <strong>Add User</strong> button above to register a single account, or the <strong>Bulk Upload</strong> tab for large batches.
                  Existing users can now be managed on the dedicated <strong>User Management</strong> page.
                </p>
                <Button variant="outline" onClick={() => navigate("/admin/users")} className="mt-4">
                  Go to User Management
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Department Management</CardTitle>
                <CardDescription>Configure academic departments for the University</CardDescription>
              </div>
              <Dialog open={showAddDept} onOpenChange={setShowAddDept}>
                <DialogTrigger asChild>
                  <Button className="bg-[#1a365d]">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Department
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Department</DialogTitle>
                    <DialogDescription>Create a new academic department</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddDept} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Department Name</Label>
                      <Input
                        placeholder="e.g. Computer Science"
                        value={newDept.name}
                        onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dept Code</Label>
                      <Input
                        placeholder="e.g. CSE"
                        value={newDept.code}
                        onChange={(e) => setNewDept({ ...newDept, code: e.target.value })}
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="w-full bg-[#1a365d]" disabled={deptLoading}>
                        {deptLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Department
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departmentsList.map((dept) => (
                      <TableRow key={dept.id}>
                        <TableCell className="font-bold">{dept.code}</TableCell>
                        <TableCell>{dept.name}</TableCell>
                        <TableCell className="text-slate-500 text-xs">
                          {new Date(dept.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:bg-red-50"
                            onClick={() => handleDeleteDept(dept.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {departmentsList.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                          No departments found. Use the "Add Department" button to create one.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Upload Tab */}
        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Student Registration</CardTitle>
              <CardDescription>Upload an Excel file to register multiple students at once</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="space-y-2">
                  <Label>Override Department <span className="text-red-500">*</span></Label>
                  <Select value={bulkSettings.department} onValueChange={(v) => setBulkSettings({ ...bulkSettings, department: v })}>
                    <SelectTrigger className={!bulkSettings.department ? "border-amber-300" : ""}>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentsList.map(dept => (
                        <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-slate-500">Selected department will apply to all students in file</p>
                </div>

                <div className="space-y-2">
                  <Label>Override Year</Label>
                  <Select value={bulkSettings.year} onValueChange={(v) => setBulkSettings({ ...bulkSettings, year: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(y => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Override Section</Label>
                  <div className="flex gap-2">
                    <Select value={bulkSettings.section} onValueChange={(v) => setBulkSettings({ ...bulkSettings, section: v })}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["A", "B", "C", "D"].map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Custom"
                      className="w-20"
                      value={bulkSettings.section}
                      onChange={(e) => setBulkSettings({ ...bulkSettings, section: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">Pick from list or type custom</p>
                </div>
              </div>

              <div className={`dropzone ${!bulkSettings.department ? 'opacity-50 pointer-events-none' : ''}`} data-testid="excel-dropzone">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  className="hidden"
                  id="excel-upload"
                  disabled={!bulkSettings.department}
                  data-testid="excel-input"
                />
                <label htmlFor="excel-upload" className={bulkSettings.department ? "cursor-pointer" : "cursor-not-allowed"}>
                  <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <p className="text-lg font-medium text-slate-700">
                    {bulkSettings.department ? 'Drop Excel file here or click to upload' : 'Please select a department first'}
                  </p>
                  <p className="text-sm text-slate-500 mt-2">Supported formats: .xlsx, .xls</p>
                </label>
              </div>

              {uploadProgress && (
                <div className={`p-4 rounded-lg ${uploadProgress.status === "success" ? "bg-emerald-50" :
                  uploadProgress.status === "error" ? "bg-red-50" : "bg-blue-50"
                  }`}>
                  <div className="flex items-center gap-3">
                    {uploadProgress.status === "uploading" && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
                    {uploadProgress.status === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    {uploadProgress.status === "error" && <AlertCircle className="w-5 h-5 text-red-600" />}
                    <p className={`font-medium ${uploadProgress.status === "success" ? "text-emerald-700" :
                      uploadProgress.status === "error" ? "text-red-700" : "text-blue-700"
                      }`}>
                      {uploadProgress.message}
                    </p>
                  </div>
                  {uploadProgress.errors?.length > 0 && (
                    <ul className="mt-3 text-sm text-red-600 list-disc pl-5">
                      {uploadProgress.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="bg-slate-50 rounded-lg p-6">
                <h3 className="font-medium text-slate-900 mb-3">Excel File Requirements</h3>
                <ul className="text-sm text-slate-600 space-y-2">
                  <li>• Required columns: <code className="bg-slate-200 px-1 rounded">student_name</code>, <code className="bg-slate-200 px-1 rounded">usn</code>, <code className="bg-slate-200 px-1 rounded">department</code>, <code className="bg-slate-200 px-1 rounded">year</code>, <code className="bg-slate-200 px-1 rounded">section</code></li>
                  <li>• Optional column: <code className="bg-slate-200 px-1 rounded">sno</code> (serial number)</li>
                  <li>• Email will be auto-generated as: usn@jainuniversity.ac.in</li>
                  <li>• Default password: 123456789</li>
                </ul>
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="mt-4"
                  data-testid="download-template"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parent Linking Tab */}
        <TabsContent value="link">
          <Card>
            <CardHeader>
              <CardTitle>Link Parent to Student</CardTitle>
              <CardDescription>Connect parent accounts to their children's student accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLinkParent} className="max-w-md space-y-6">
                <div className="space-y-2">
                  <Label>Select Parent</Label>
                  <Select value={parentLink.parent_id} onValueChange={(v) => setParentLink({ ...parentLink, parent_id: v })}>
                    <SelectTrigger data-testid="select-parent">
                      <SelectValue placeholder="Select a parent account" />
                    </SelectTrigger>
                    <SelectContent>
                      {parents.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.full_name} ({p.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Student Name</Label>
                  <Input
                    value={parentLink.student_username}
                    onChange={(e) => setParentLink({ ...parentLink, student_username: e.target.value })}
                    placeholder="Enter student's name (e.g., Tejasw.s)"
                    data-testid="student-name-link"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Last 5 digits of USN</Label>
                  <Input
                    value={parentLink.student_usn_digits}
                    onChange={(e) => setParentLink({ ...parentLink, student_usn_digits: e.target.value })}
                    placeholder="e.g., 22291"
                    maxLength={5}
                    data-testid="usn-digits-link"
                  />
                </div>

                <Button type="submit" className="bg-[#1a365d]" data-testid="link-parent-btn">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Link Parent to Student
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t">
                <h3 className="font-medium text-slate-900 mb-4">Current Parent-Student Links</h3>
                <div className="space-y-3">
                  {parents.map((parent) => {
                    const linkedStudent = students.find(s => s.id === parent.linked_student_id);
                    return (
                      <div key={parent.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">{parent.full_name}</p>
                          <p className="text-sm text-slate-500">{parent.username}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {linkedStudent ? (
                            <>
                              <LinkIcon className="w-4 h-4 text-emerald-600" />
                              <span className="text-emerald-700 font-medium">{linkedStudent.full_name}</span>
                            </>
                          ) : (
                            <span className="text-slate-400 italic">Not linked</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};
