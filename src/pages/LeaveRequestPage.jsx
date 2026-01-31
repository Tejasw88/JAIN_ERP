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
import { Textarea } from "../components/ui/textarea";
import { Loader2, FileText, Send, Check, X, Forward, Download, Clock, Calendar } from "lucide-react";

export const LeaveRequestPage = () => {
    const { user } = useAuth();
    const isTeacher = user?.role === "Teacher";
    const isStudent = user?.role === "Student";

    const [loading, setLoading] = useState(true);
    const [myRequests, setMyRequests] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);

    // New request form
    const [showNewRequest, setShowNewRequest] = useState(false);
    const [newRequest, setNewRequest] = useState({
        leave_type: "sick",
        start_date: "",
        end_date: "",
        reason: ""
    });

    // Approval dialog
    const [showApproval, setShowApproval] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [approvalRemarks, setApprovalRemarks] = useState("");

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (isStudent) {
                const res = await apiClient.get("/leave/my-requests");
                setMyRequests(res.data);
            }

            if (isTeacher) {
                const res = await apiClient.get("/leave/requests");
                setPendingRequests(res.data);
            }
        } catch (error) {
            toast.error("Failed to load leave requests");
        } finally {
            setLoading(false);
        }
    }, [isStudent, isTeacher]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmitRequest = async () => {
        try {
            await apiClient.post("/leave/request", newRequest);
            toast.success("Leave request submitted!");
            setShowNewRequest(false);
            setNewRequest({ leave_type: "sick", start_date: "", end_date: "", reason: "" });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to submit request");
        }
    };

    const handleApprove = async (status) => {
        if (!selectedRequest) return;
        try {
            await apiClient.put(`/leave/${selectedRequest.id}/approve`, {
                status,
                remarks: approvalRemarks
            });
            toast.success(`Leave request ${status}`);
            setShowApproval(false);
            setSelectedRequest(null);
            setApprovalRemarks("");
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to update request");
        }
    };

    const handleForwardToHod = async (requestId) => {
        try {
            await apiClient.put(`/leave/${requestId}/forward-to-hod`);
            toast.success("Request forwarded to HOD");
            fetchData();
        } catch (error) {
            toast.error("Failed to forward request");
        }
    };

    const handleDownloadPdf = async (requestId) => {
        try {
            const res = await apiClient.get(`/leave/${requestId}/pdf`);
            const data = res.data;

            // Generate PDF content (simple HTML for now, can use jspdf library)
            const pdfContent = `
        <html>
        <head>
          <title>Leave Approval Letter</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #1a365d; }
            .content { line-height: 1.8; }
            .signature { margin-top: 50px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">JAIN University</div>
            <p>Learning Management System</p>
            <h2>Leave Approval Letter</h2>
          </div>
          <div class="content">
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>To:</strong> ${data.student_name}</p>
            <p><strong>USN:</strong> ${data.usn}</p>
            <p><strong>Department:</strong> ${data.department}</p>
            <p><strong>Year:</strong> ${data.year}</p>
            <br/>
            <p>This is to certify that your leave request has been <strong>APPROVED</strong>.</p>
            <br/>
            <p><strong>Leave Type:</strong> ${data.leave_type}</p>
            <p><strong>From:</strong> ${data.start_date}</p>
            <p><strong>To:</strong> ${data.end_date}</p>
            <p><strong>Reason:</strong> ${data.reason}</p>
            ${data.remarks ? `<p><strong>Remarks:</strong> ${data.remarks}</p>` : ''}
            <div class="signature">
              <p><strong>Approved By:</strong> ${data.approved_by}</p>
              <p><strong>Approved On:</strong> ${data.approved_at}</p>
              <br/><br/>
              <p>_____________________</p>
              <p>${data.approved_by}</p>
              <p>Class Teacher / HOD</p>
            </div>
          </div>
        </body>
        </html>
      `;

            // Open in new window for printing
            const printWindow = window.open('', '_blank');
            printWindow.document.write(pdfContent);
            printWindow.document.close();
            printWindow.print();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to generate PDF");
        }
    };

    const getStatusBadge = (status) => {
        const variants = {
            pending: { class: "bg-amber-100 text-amber-700", label: "Pending" },
            approved: { class: "bg-green-100 text-green-700", label: "Approved" },
            rejected: { class: "bg-red-100 text-red-700", label: "Rejected" },
            forwarded_to_hod: { class: "bg-blue-100 text-blue-700", label: "Forwarded to HOD" },
            hod_approved: { class: "bg-emerald-100 text-emerald-700", label: "HOD Approved" },
            hod_rejected: { class: "bg-red-100 text-red-700", label: "HOD Rejected" }
        };
        const v = variants[status] || variants.pending;
        return <Badge className={v.class}>{v.label}</Badge>;
    };

    const openApprovalDialog = (request) => {
        setSelectedRequest(request);
        setApprovalRemarks("");
        setShowApproval(true);
    };

    return (
        <DashboardLayout title="Leave Requests">
            <div className="space-y-6">
                <Tabs defaultValue={isStudent ? "active-requests" : "pending"}>
                    <div className="flex items-center justify-between mb-4">
                        <TabsList>
                            {isStudent && (
                                <>
                                    <TabsTrigger value="active-requests">Active Requests</TabsTrigger>
                                    <TabsTrigger value="history">History</TabsTrigger>
                                </>
                            )}
                            {isTeacher && <TabsTrigger value="pending">Pending Approvals</TabsTrigger>}
                        </TabsList>

                        {isStudent && (
                            <Dialog open={showNewRequest} onOpenChange={setShowNewRequest}>
                                <DialogTrigger asChild>
                                    <Button className="bg-[#1a365d] hover:bg-[#102a43]">
                                        <Send className="w-4 h-4 mr-2" />
                                        New Request
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Submit Leave Request</DialogTitle>
                                        <DialogDescription>
                                            Fill in the details for your leave application
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Leave Type</Label>
                                            <Select
                                                value={newRequest.leave_type}
                                                onValueChange={(v) => setNewRequest({ ...newRequest, leave_type: v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="sick">Sick Leave</SelectItem>
                                                    <SelectItem value="personal">Personal Leave</SelectItem>
                                                    <SelectItem value="emergency">Emergency Leave</SelectItem>
                                                    <SelectItem value="academic">Academic Leave</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Start Date</Label>
                                                <Input
                                                    type="date"
                                                    value={newRequest.start_date}
                                                    onChange={(e) => setNewRequest({ ...newRequest, start_date: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>End Date</Label>
                                                <Input
                                                    type="date"
                                                    value={newRequest.end_date}
                                                    onChange={(e) => setNewRequest({ ...newRequest, end_date: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Reason</Label>
                                            <Textarea
                                                value={newRequest.reason}
                                                onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                                                placeholder="Explain the reason for your leave..."
                                                rows={4}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setShowNewRequest(false)}>Cancel</Button>
                                        <Button
                                            onClick={handleSubmitRequest}
                                            className="bg-[#1a365d]"
                                            disabled={!newRequest.start_date || !newRequest.end_date || !newRequest.reason}
                                        >
                                            Submit Request
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>

                    {/* Student: Active Requests */}
                    {isStudent && (
                        <TabsContent value="active-requests">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="w-5 h-5" />
                                        Active Requests
                                    </CardTitle>
                                    <CardDescription>Track your pending leave applications</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loading ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        </div>
                                    ) : myRequests.filter(r => ['pending', 'forwarded_to_hod'].includes(r.status)).length > 0 ? (
                                        <div className="space-y-4">
                                            {myRequests.filter(r => ['pending', 'forwarded_to_hod'].includes(r.status)).map((req) => (
                                                <div key={req.id} className="border rounded-lg p-4 bg-slate-50 border-slate-200">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Badge variant="outline" className="capitalize">{req.leave_type}</Badge>
                                                                {getStatusBadge(req.status)}
                                                            </div>
                                                            <p className="text-sm font-medium text-slate-900">
                                                                <Calendar className="w-3 h-3 inline mr-1" />
                                                                {req.start_date} to {req.end_date}
                                                            </p>
                                                            <p className="text-sm text-slate-600 mt-1">{req.reason}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-slate-500 border-2 border-dashed rounded-lg">
                                            <Clock className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                            <p className="font-medium text-slate-600">No active requests</p>
                                            <p className="text-sm">Submit a new request to see it here</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}

                    {/* Student: History */}
                    {isStudent && (
                        <TabsContent value="history">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="w-5 h-5" />
                                        Request History
                                    </CardTitle>
                                    <CardDescription>View your previous (Approved/Rejected) requests</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loading ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        </div>
                                    ) : myRequests.filter(r => !['pending', 'forwarded_to_hod'].includes(r.status)).length > 0 ? (
                                        <div className="space-y-4">
                                            {myRequests.filter(r => !['pending', 'forwarded_to_hod'].includes(r.status)).map((req) => (
                                                <div key={req.id} className={`border rounded-lg p-4 ${req.status.includes('approved') ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'}`}>
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Badge variant="outline" className="capitalize">{req.leave_type}</Badge>
                                                                {getStatusBadge(req.status)}
                                                            </div>
                                                            <p className="text-sm font-medium text-slate-900">
                                                                <Calendar className="w-3 h-3 inline mr-1" />
                                                                {req.start_date} to {req.end_date}
                                                            </p>
                                                            <p className="text-sm text-slate-600 mt-1">{req.reason}</p>
                                                            {req.remarks && (
                                                                <div className="mt-2 p-2 bg-white/60 rounded text-xs text-slate-500 italic">
                                                                    Remarks: {req.remarks}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {(req.status === 'approved' || req.status === 'hod_approved' || req.status === 'hod_approved' || req.status === 'forwarded_to_hod') && (
                                                            <div className="flex flex-col gap-2">
                                                                {(req.status === 'approved' || req.status === 'hod_approved') && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="bg-white"
                                                                        onClick={() => handleDownloadPdf(req.id)}
                                                                    >
                                                                        <Download className="w-3 h-3 mr-1" />
                                                                        Download PDF
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-slate-500 border-2 border-dashed rounded-lg">
                                            <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                            <p className="font-medium text-slate-600">No previous requests</p>
                                            <p className="text-sm">Processed requests will appear here</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}

                    {/* Teacher: Pending Approvals */}
                    {isTeacher && (
                        <TabsContent value="pending">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="w-5 h-5" />
                                        Pending Approvals
                                    </CardTitle>
                                    <CardDescription>Leave requests awaiting your action</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loading ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        </div>
                                    ) : pendingRequests.length > 0 ? (
                                        <div className="space-y-4">
                                            {pendingRequests.map((req) => (
                                                <div key={req.id} className="border rounded-lg p-4">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <p className="font-medium">{req.student_name}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Badge variant="outline" className="capitalize">{req.leave_type}</Badge>
                                                                {getStatusBadge(req.status)}
                                                            </div>
                                                            <p className="text-sm text-slate-600 mt-2">
                                                                <Calendar className="w-3 h-3 inline mr-1" />
                                                                {req.start_date} to {req.end_date}
                                                            </p>
                                                            <p className="text-sm text-slate-500 mt-1">{req.reason}</p>
                                                        </div>
                                                        {req.status === 'pending' && (
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => openApprovalDialog(req)}
                                                                >
                                                                    Review
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleForwardToHod(req.id)}
                                                                    title="Forward to HOD"
                                                                >
                                                                    <Forward className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-slate-500">
                                            <Check className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                            <p>No pending leave requests</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}
                </Tabs>

                {/* Approval Dialog */}
                <Dialog open={showApproval} onOpenChange={setShowApproval}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Review Leave Request</DialogTitle>
                            <DialogDescription>
                                {selectedRequest?.student_name} - {selectedRequest?.leave_type}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <p className="text-sm mb-2">
                                <strong>Duration:</strong> {selectedRequest?.start_date} to {selectedRequest?.end_date}
                            </p>
                            <p className="text-sm mb-4">
                                <strong>Reason:</strong> {selectedRequest?.reason}
                            </p>
                            <div className="space-y-2">
                                <Label>Remarks (Optional)</Label>
                                <Textarea
                                    value={approvalRemarks}
                                    onChange={(e) => setApprovalRemarks(e.target.value)}
                                    placeholder="Add any remarks..."
                                    rows={3}
                                />
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button
                                variant="destructive"
                                onClick={() => handleApprove('rejected')}
                            >
                                <X className="w-4 h-4 mr-1" />
                                Reject
                            </Button>
                            <Button
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApprove('approved')}
                            >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};
