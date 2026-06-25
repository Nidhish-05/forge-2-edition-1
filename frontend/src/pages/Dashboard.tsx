import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../providers/ThemeProvider";
import { applicationService, CreateApplicationData } from "../services/application";
import { resumeService } from "../services/resume";
import { atsService } from "../services/ats";
import { interviewService } from "../services/interview";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Separator } from "../components/ui/separator";
import { Skeleton } from "../components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import {
  Plus,
  Briefcase,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Scan,
  Video,
  Loader2,
  Sparkles,
  HelpCircle,
  FileText,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Award,
  Sun,
  Moon,
  Smile,
  BookOpen,
  CheckCircle,
} from "lucide-react";
import { JobApplication, Resume, Interview, InterviewAnswer } from "../types";

// Schema for adding Kanban card
const cardSchema = zod.object({
  job_title: zod.string().min(2, "Job title is required"),
  company_name: zod.string().min(2, "Company name is required"),
  job_description: zod.string().optional(),
  resume_id: zod.string().optional(),
  status: zod.string().min(1),
});

type CardFormValues = {
  job_title: string;
  company_name: string;
  job_description?: string;
  resume_id?: string;
  status: string;
};

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { user, stats, checkAuth } = useAuthStore();
  const { theme, setTheme } = useTheme();

  // Kanban Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [scanApp, setScanApp] = useState<JobApplication | null>(null);
  const [scanResumeId, setScanResumeId] = useState("");
  const [scanning, setScanning] = useState(false);

  // Resume Modals/Detail
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [uploading, setUploading] = useState(false);

  // Interview States
  const [activeInterview, setActiveInterview] = useState<Interview | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<InterviewAnswer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);

  // Form hooks
  const cardForm = useForm<CardFormValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      status: "applied",
      job_description: "",
      resume_id: "",
    },
  });

  // Queries
  const { data: applications, isLoading: appsLoading } = useQuery<JobApplication[]>({
    queryKey: ["applications"],
    queryFn: applicationService.getApplications,
  });

  const { data: resumes, isLoading: resumesLoading } = useQuery<Resume[]>({
    queryKey: ["resumes"],
    queryFn: resumeService.getResumes,
  });

  const { data: interviews } = useQuery<Interview[]>({
    queryKey: ["interviews"],
    queryFn: interviewService.getInterviews,
  });

  // Mutations
  const createCardMutation = useMutation({
    mutationFn: (data: CardFormValues) =>
      applicationService.createApplication({
        job_title: data.job_title,
        company_name: data.company_name,
        job_description: data.job_description || null,
        resume_id: data.resume_id ? parseInt(data.resume_id) : null,
        status: data.status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["authMe"] });
      checkAuth();
      toast.success("Job added to Kanban Board!");
      setIsCreateOpen(false);
      cardForm.reset();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create application card");
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateApplicationData> }) =>
      applicationService.updateApplication(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      checkAuth();
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: applicationService.deleteApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["authMe"] });
      checkAuth();
      toast.success("Card deleted");
    },
  });

  const generateInterviewMutation = useMutation({
    mutationFn: (data: { resume_id: number; job_title: string; company_name?: string }) =>
      interviewService.generate({
        resume_id: data.resume_id,
        job_title: data.job_title,
        company_name: data.company_name,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      setActiveInterview(data);
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setCurrentAnswer("");
      toast.success("AI mock interview started!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to generate interview questions");
    },
  });

  const submitAnswersMutation = useMutation({
    mutationFn: ({ id, answers }: { id: string; answers: InterviewAnswer[] }) =>
      interviewService.submitAnswers(id, answers),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      queryClient.invalidateQueries({ queryKey: ["authMe"] });
      checkAuth();
      setActiveInterview(data);
      toast.success("Interview graded successfully!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Grading calculation failed");
    },
  });

  const deleteInterviewMutation = useMutation({
    mutationFn: interviewService.deleteInterview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      checkAuth();
      toast.success("Interview session deleted");
      if (activeInterview) setActiveInterview(null);
    },
  });

  // Action: Move card
  const handleMoveCard = (card: JobApplication, direction: "left" | "right") => {
    const statuses: JobApplication["status"][] = ["applied", "ats_scanned", "interviewing", "offered", "rejected"];
    const currentIndex = statuses.indexOf(card.status);
    let nextIndex = currentIndex + (direction === "left" ? -1 : 1);

    if (nextIndex >= 0 && nextIndex < statuses.length) {
      updateCardMutation.mutate({
        id: card.id,
        data: { status: statuses[nextIndex] },
      });
    }
  };

  // Action: Run ATS scan
  const handleAtsScan = async () => {
    if (!scanApp || !scanResumeId) {
      toast.error("Please select a resume to scan");
      return;
    }

    setScanning(true);
    const toastId = toast.loading("Evaluating resume match density via Gemini...");
    try {
      const result = await atsService.scan({
        resume_id: parseInt(scanResumeId),
        job_title: scanApp.job_title,
        company_name: scanApp.company_name || undefined,
        job_description: scanApp.job_description || "Please see standard requirements.",
      });

      await applicationService.updateApplication(scanApp.id, {
        score: result.score,
        status: "ats_scanned",
        resume_id: parseInt(scanResumeId),
      });

      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["authMe"] });
      checkAuth();
      toast.success(`Scan completed! Score: ${result.score}%`, { id: toastId });
      setIsScanOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "ATS scanning failed", { id: toastId });
    } finally {
      setScanning(false);
    }
  };

  // Action: Resume Upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const toastId = toast.loading(`Uploading and parsing ${file.name}...`);
    try {
      const parsedResume = await resumeService.uploadResume(file);
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      queryClient.invalidateQueries({ queryKey: ["authMe"] });
      checkAuth();
      setSelectedResume(parsedResume);
      toast.success("Resume parsed successfully!", { id: toastId });
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "File parsing failed", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleNextQuestion = (forced = false) => {
    const q = activeInterview?.questions?.[currentQuestionIndex];
    if (!q) return;

    const currentQA: InterviewAnswer = {
      question_id: q.id,
      answer: forced ? "No response provided in time." : currentAnswer.trim() || "Skipped question.",
    };

    const updatedAnswers = [...userAnswers, currentQA];
    setUserAnswers(updatedAnswers);
    setCurrentAnswer("");

    if (currentQuestionIndex + 1 < (activeInterview?.questions?.length ?? 0)) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      if (activeInterview?.id) {
        submitAnswersMutation.mutate({ id: activeInterview.id, answers: updatedAnswers });
      }
    }
  };

  // Timer loop for active mock interview questions
  useEffect(() => {
    if (!activeInterview || activeInterview.status !== "pending") return;
    const q = activeInterview.questions?.[currentQuestionIndex];
    if (!q) return;

    setTimeLeft(q.time_limit);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleNextQuestion(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex, activeInterview]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 60) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-destructive bg-destructive/10 border-destructive/20";
  };

  const columns = [
    { id: "applied", name: "Applied", border: "border-cyan-500/30", text: "text-cyan-400", shadow: "shadow-cyan-500/10", glow: "hover:border-cyan-400 hover:shadow-cyan-500/20" },
    { id: "ats_scanned", name: "ATS Scanned", border: "border-pink-500/30", text: "text-pink-400", shadow: "shadow-pink-500/10", glow: "hover:border-pink-400 hover:shadow-pink-500/20" },
    { id: "interviewing", name: "Interviewing", border: "border-yellow-500/30", text: "text-yellow-400", shadow: "shadow-yellow-500/10", glow: "hover:border-yellow-400 hover:shadow-yellow-500/20" },
    { id: "offered", name: "Offered", border: "border-green-500/30", text: "text-green-400", shadow: "shadow-green-500/10", glow: "hover:border-green-400 hover:shadow-green-500/20" },
    { id: "rejected", name: "Archived", border: "border-red-500/30", text: "text-red-400", shadow: "shadow-red-500/10", glow: "hover:border-red-400 hover:shadow-red-500/20" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Sleek Neon Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <Award className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Forge Sprint
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg text-muted-foreground hover:text-foreground"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-5 w-5 animate-pulse" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Single Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-300">
        
        {/* Welcome Section */}
        <div className="relative rounded-2xl border border-border/40 overflow-hidden bg-gradient-to-r from-primary/10 via-violet-500/5 to-transparent p-6 md:p-8">
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Unified AI Workspace
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Recruitment Accelerator & Pipeline
            </h2>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              Upload your resume, analyze matches, and practice interviews all in one single landing page dashboard.
            </p>
          </div>
        </div>

        {/* Overview Stats Row */}
        <div className="grid gap-6 grid-cols-2 md:grid-cols-5">
          {[
            { label: "Resumes", value: stats?.total_resumes ?? 0, color: "text-cyan-400 bg-cyan-500/10" },
            { label: "ATS Scans", value: stats?.total_ats_scans ?? 0, color: "text-pink-400 bg-pink-500/10" },
            { label: "Avg Score", value: stats?.average_ats_score ? `${stats.average_ats_score}%` : "N/A", color: "text-violet-400 bg-violet-500/10" },
            { label: "Mock Sessions", value: stats?.total_interviews ?? 0, color: "text-yellow-400 bg-yellow-500/10" },
            { label: "Pipeline Cards", value: applications?.length ?? 0, color: "text-emerald-400 bg-emerald-500/10" },
          ].map((m) => (
            <Card key={m.label} className="border border-border/40 bg-card/40 backdrop-blur-sm p-4 space-y-1">
              <span className="text-xs font-bold text-muted-foreground uppercase">{m.label}</span>
              <p className="text-2xl font-black text-foreground">{m.value}</p>
            </Card>
          ))}
        </div>

        {/* 1. KANBAN BOARD SECTION */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-foreground">Pipeline Kanban</h3>
              <p className="text-xs text-muted-foreground">Track application columns and evaluate profiles matching</p>
            </div>

            {/* Neon Add Card Trigger */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl font-bold py-5 px-5 border border-cyan-500 bg-cyan-950/20 text-cyan-400 hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all duration-300">
                  <Plus className="mr-1.5 h-4.5 w-4.5" /> Add Job Card
                </Button>
              </DialogTrigger>
              <DialogContent className="border border-border/40 bg-card/95 backdrop-blur-xl">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">Add Job Card</DialogTitle>
                  <DialogDescription>Add new application pipeline tracker card</DialogDescription>
                </DialogHeader>

                <form onSubmit={cardForm.handleSubmit((data) => createCardMutation.mutate(data))} className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Job Title</Label>
                    <Input placeholder="e.g. Fullstack Developer" className="rounded-xl border-border bg-background/50" {...cardForm.register("job_title")} />
                    {cardForm.formState.errors.job_title && <p className="text-xs text-destructive">{cardForm.formState.errors.job_title.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Company Name</Label>
                    <Input placeholder="e.g. Stripe" className="rounded-xl border-border bg-background/50" {...cardForm.register("company_name")} />
                    {cardForm.formState.errors.company_name && <p className="text-xs text-destructive">{cardForm.formState.errors.company_name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Link Resume (Optional)</Label>
                    <select className="flex w-full rounded-xl border border-input bg-background/50 px-3 py-3 text-sm focus-visible:outline-none" {...cardForm.register("resume_id")}>
                      <option value="">-- Choose Profile --</option>
                      {resumes?.map((r) => <option key={r.id} value={r.id}>{r.original_filename}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Job Description (Optional)</Label>
                    <Textarea placeholder="Paste description details..." className="min-h-[100px] rounded-xl border-border" {...cardForm.register("job_description")} />
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="rounded-xl font-bold px-6 border border-cyan-500 bg-cyan-950/20 text-cyan-400 hover:bg-cyan-500 hover:text-black">Create Card</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Kanban Columns Grid */}
          <div className="grid gap-6 md:grid-cols-5 items-start overflow-x-auto pb-4">
            {columns.map((col) => {
              const colCards = applications?.filter((c) => c.status === col.id) || [];
              return (
                <div key={col.id} className={`rounded-2xl border ${col.border} bg-card/25 p-4 space-y-4 min-w-[220px]`}>
                  <div className="flex items-center justify-between border-b border-border/30 pb-2">
                    <span className={`font-black text-xs tracking-wider uppercase ${col.text}`}>{col.name}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted/60 text-foreground font-bold">{colCards.length}</span>
                  </div>

                  <div className="space-y-4 min-h-[300px]">
                    {appsLoading ? (
                      <Skeleton className="h-28 rounded-xl w-full" />
                    ) : colCards.length > 0 ? (
                      colCards.map((card) => (
                        <div key={card.id} className={`group/card rounded-xl border border-border/40 bg-card/60 p-4 space-y-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-card hover:shadow-lg ${col.glow} ${col.shadow}`}>
                          <div className="space-y-1">
                            <div className="flex justify-between items-start gap-1">
                              <h4 className="font-bold text-sm text-foreground leading-snug group-hover/card:text-primary transition-colors truncate">{card.job_title}</h4>
                              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0" onClick={() => deleteCardMutation.mutate(card.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground font-semibold truncate">{card.company_name}</p>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {card.score !== null ? (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <TrendingUp className="h-3 w-3" /> {card.score}% Match
                              </span>
                            ) : (
                              <span className="text-[9px] px-2 py-0.5 rounded bg-muted/65 text-muted-foreground border border-border/20">Not Scanned</span>
                            )}
                            {card.resume ? (
                              <span className="text-[9px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 max-w-[120px] truncate" title={card.resume.original_filename}>
                                {card.resume.original_filename}
                              </span>
                            ) : null}
                          </div>

                          {/* Navigation & Action icons */}
                          <div className="flex items-center justify-between border-t border-border/30 pt-3">
                            <div className="flex items-center gap-1.5">
                              {/* Scan */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-md text-muted-foreground hover:text-pink-400 hover:bg-pink-500/10"
                                onClick={() => {
                                  setScanApp(card);
                                  setScanResumeId(card.resume_id ? String(card.resume_id) : "");
                                  setIsScanOpen(true);
                                }}
                              >
                                <Scan className="h-4 w-4" />
                              </Button>

                              {/* Interview mock link */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-md text-muted-foreground hover:text-yellow-400 hover:bg-yellow-500/10"
                                disabled={!card.resume_id}
                                onClick={() => generateInterviewMutation.mutate({ resume_id: card.resume_id!, job_title: card.job_title, company_name: card.company_name || undefined })}
                                title={card.resume_id ? "Launch Q&A mock session" : "Link a resume first"}
                              >
                                <Video className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={card.status === "applied"} onClick={() => handleMoveCard(card, "left")}><ChevronLeft className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={card.status === "rejected"} onClick={() => handleMoveCard(card, "right")}><ChevronRight className="h-3.5 w-3.5" /></Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-48 border border-dashed border-border/20 rounded-2xl p-4 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Empty Column</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. SPLIT ROW: RESUMES & INTERVIEWS */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* LEFT: RESUMES MODULE */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-foreground">Resumes</h3>
                <p className="text-xs text-muted-foreground">Upload and view parsed profiles</p>
              </div>

              <div className="relative">
                <input type="file" id="landing-resume-upload" className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileUpload} disabled={uploading} />
                <Button asChild rounded-xl className="font-bold text-xs py-4 px-4 border border-cyan-500 bg-cyan-950/20 text-cyan-400 hover:bg-cyan-500 hover:text-black">
                  <label htmlFor="landing-resume-upload" className="cursor-pointer flex items-center gap-1">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Upload
                  </label>
                </Button>
              </div>
            </div>

            <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
              <CardContent className="py-4 space-y-3">
                {resumesLoading ? (
                  <Skeleton className="h-16 rounded-xl w-full" />
                ) : resumes && resumes.length > 0 ? (
                  resumes.map((resume) => (
                    <div
                      key={resume.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                        selectedResume?.id === resume.id ? "border-primary bg-primary/5" : "border-border/30 hover:border-border hover:bg-muted/30"
                      }`}
                      onClick={() => setSelectedResume(resume)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4.5 w-4.5 text-primary shrink-0" />
                        <span className="text-xs font-semibold truncate text-foreground">{resume.original_filename}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); if (confirm("Delete resume?")) resumeService.deleteResume(resume.id).then(() => queryClient.invalidateQueries({ queryKey: ["resumes"] })); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-muted-foreground uppercase font-semibold">No Resumes Loaded</div>
                )}
              </CardContent>
            </Card>

            {/* Parsed resume previewer */}
            {selectedResume ? (
              <Card className="border border-border/40 bg-card/25 backdrop-blur-sm p-4 space-y-4 animate-in fade-in duration-300">
                <div className="space-y-1">
                  <div className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 w-fit font-bold uppercase">Parsed Details</div>
                  <h4 className="font-extrabold text-base text-foreground">{selectedResume.parsed_content?.name || selectedResume.original_filename}</h4>
                  <p className="text-xs text-muted-foreground italic">"{selectedResume.parsed_content?.summary || 'No summary parsed.'}"</p>
                </div>
                {selectedResume.parsed_content?.skills && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {selectedResume.parsed_content.skills.slice(0, 12).map((s) => (
                      <span key={s} className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary font-bold border border-primary/20">{s}</span>
                    ))}
                  </div>
                )}
              </Card>
            ) : null}
          </div>

          {/* RIGHT: AI MOCK INTERVIEW PORTAL */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <h3 className="text-xl font-bold text-foreground">AI Mock Interviews</h3>
              <p className="text-xs text-muted-foreground">Practice real-time Q&A evaluated by Gemini</p>
            </div>

            {activeInterview && activeInterview.status === "pending" ? (
              /* ACTIVE INTERVIEW PANEL */
              <Card className="border border-border/40 bg-card/25 backdrop-blur-sm relative overflow-hidden animate-in fade-in duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-yellow-500" />
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-center gap-2">
                    <div className="min-w-0">
                      <span className="text-[9px] font-black text-yellow-400 uppercase tracking-wider">Active Session</span>
                      <h4 className="font-bold text-sm text-foreground truncate">{activeInterview.job_title}</h4>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-destructive/10 border border-destructive/20 text-destructive px-3.5 py-1 text-xs font-bold animate-pulse">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{timeLeft}s</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-primary font-bold uppercase tracking-wider">Question {currentQuestionIndex + 1} of {activeInterview.questions.length}</p>
                  <p className="text-sm font-bold text-foreground leading-relaxed">{activeInterview.questions?.[currentQuestionIndex]?.question}</p>
                  <Textarea
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Type your structured answer here (STAR method recommended)..."
                    className="min-h-[120px] rounded-xl border-border bg-background/50 focus:bg-background resize-none text-xs leading-relaxed"
                  />
                </CardContent>
                <CardFooter className="flex items-center justify-between border-t border-border/20 pt-4 pb-4">
                  <span className="text-[10px] text-muted-foreground">Answer submits to advance question</span>
                  <Button onClick={() => handleNextQuestion(false)} className="rounded-xl font-bold text-xs py-4 px-5 gap-1 border border-yellow-500 bg-yellow-950/20 text-yellow-400 hover:bg-yellow-500 hover:text-black">
                    {currentQuestionIndex + 1 === activeInterview.questions.length ? "Finish & Grade" : "Next Question"} <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            ) : activeInterview && activeInterview.status === "completed" ? (
              /* REPORT CARD DETAILS */
              <Card className="border border-border/40 bg-card/25 backdrop-blur-sm overflow-hidden animate-in fade-in duration-300">
                <CardHeader className="bg-muted/10 border-b border-border/30 pb-4 text-center space-y-3">
                  <div>
                    <span className="text-[9px] font-black text-primary uppercase">Session Report Card</span>
                    <h4 className="font-extrabold text-base text-foreground truncate">{activeInterview.job_title}</h4>
                  </div>
                  <div className="flex justify-center items-center gap-4">
                    <span className={`text-2xl font-black px-3.5 py-1 rounded-xl border ${getScoreColor(activeInterview.score ?? 50)}`}>
                      {activeInterview.score}%
                    </span>
                    <span className="text-xs font-bold bg-muted text-foreground px-3.5 py-2 rounded-xl border border-border">
                      {activeInterview.feedback?.hire_recommendation || "Maybe"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto italic leading-relaxed">
                    "{activeInterview.feedback?.overall_feedback}"
                  </p>
                  <Button variant="outline" size="sm" className="rounded-lg text-[10px] h-7 border border-destructive/20 text-destructive hover:bg-destructive/10" onClick={() => deleteInterviewMutation.mutate(activeInterview.id)}>
                    Clear Report
                  </Button>
                </CardHeader>
                <CardContent className="py-4 space-y-4">
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">SWOT Q&A Feedback</h5>
                    {activeInterview.questions.map((q, idx) => {
                      const ans = activeInterview.answers?.find((a) => a.question_id === q.id);
                      const feed = activeInterview.feedback?.question_feedback?.find((f) => f.question_id === q.id);
                      return (
                        <div key={q.id} className="p-3 rounded-lg border border-border/40 bg-muted/15 space-y-2 text-xs">
                          <p className="font-bold text-foreground">Q{idx + 1}: {q.question}</p>
                          <p className="text-muted-foreground italic">Your Answer: "{ans?.answer || 'No response.'}"</p>
                          {feed && (
                            <div className="text-[10px] space-y-1 pt-1.5 border-t border-border/10">
                              <div className="text-emerald-400"><span className="font-extrabold">Went Well:</span> {feed.what_went_well}</div>
                              <div className="text-amber-400"><span className="font-extrabold">Improve:</span> {feed.what_to_improve}</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* IDLE STATE */
              <Card className="border border-border/40 bg-card/25 backdrop-blur-sm p-8 text-center flex flex-col justify-center items-center min-h-[220px]">
                <div className="max-w-xs space-y-3">
                  <Video className="h-6 w-6 text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground">Select a past interview from history or click a Kanban card video icon to launch a tailored Q&A mock session.</p>
                  
                  {interviews && interviews.length > 0 ? (
                    <div className="text-left space-y-2 max-h-[140px] overflow-y-auto pt-2 border-t border-border/20">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Past Sessions:</span>
                      {interviews.map((session) => (
                        <div key={session.id} className="flex justify-between items-center text-xs p-2 rounded-lg border border-border/20 bg-muted/10 cursor-pointer hover:border-primary" onClick={() => handleSelectPastSession(session)}>
                          <span className="truncate font-semibold max-w-[130px]">{session.job_title}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${getScoreColor(session.score ?? 50)}`}>{session.score}%</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* ATS MATCH SCAN DIALOG */}
      <Dialog open={isScanOpen} onOpenChange={setIsScanOpen}>
        <DialogContent className="border border-border/40 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-1.5"><Scan className="h-5 w-5 text-pink-400" /> Run ATS Scanner</DialogTitle>
            <DialogDescription>Match {scanApp?.job_title} at {scanApp?.company_name} against any professional profile</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Select Resume Profile</Label>
              <select className="flex w-full rounded-xl border border-input bg-background/50 px-3 py-3 text-sm focus-visible:outline-none" value={scanResumeId} onChange={(e) => setScanResumeId(e.target.value)}>
                <option value="">-- Choose Profile --</option>
                {resumes?.map((r) => <option key={r.id} value={r.id}>{r.original_filename}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button className="rounded-xl font-bold px-6 border border-pink-500 bg-pink-950/20 text-pink-400 hover:bg-pink-500 hover:text-black" onClick={handleAtsScan} disabled={scanning}>
              {scanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Match Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  function handleSelectPastSession(session: Interview) {
    setActiveInterview(session);
    if (session.status === "pending") {
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setCurrentAnswer("");
    }
  }
}
