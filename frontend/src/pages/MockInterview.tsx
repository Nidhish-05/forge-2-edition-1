import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resumeService } from "../services/resume";
import { interviewService } from "../services/interview";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Separator } from "../components/ui/separator";
import { Skeleton } from "../components/ui/skeleton";
import {
  Video,
  Sparkles,
  Loader2,
  ChevronRight,
  Send,
  Award,
  BookOpen,
  ArrowRight,
  TrendingUp,
  AwardIcon,
  Smile,
  AlertCircle,
  HelpCircle,
  Clock,
  Trash2,
} from "lucide-react";
import { Interview, Resume, InterviewQuestion, InterviewAnswer } from "../types";

const startSchema = zod.object({
  resume_id: zod.string().min(1, "Please select a resume"),
  job_title: zod.string().min(3, "Job title is required"),
  company_name: zod.string().optional(),
  job_description: zod.string().optional(),
});

type StartFormValues = zod.infer<typeof startSchema>;

export default function MockInterview() {
  const queryClient = useQueryClient();
  const [activeInterview, setActiveInterview] = useState<Interview | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<InterviewAnswer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);

  // Fetch Resumes
  const { data: resumes } = useQuery<Resume[]>({
    queryKey: ["resumes"],
    queryFn: resumeService.getResumes,
  });

  // Fetch past interviews list
  const { data: interviews, isLoading: listLoading } = useQuery<Interview[]>({
    queryKey: ["interviews"],
    queryFn: interviewService.getInterviews,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StartFormValues>({
    resolver: zodResolver(startSchema),
  });

  // Generate Interview Mutation
  const generateMutation = useMutation({
    mutationFn: (data: StartFormValues) =>
      interviewService.generate({
        resume_id: parseInt(data.resume_id),
        job_title: data.job_title,
        company_name: data.company_name,
        job_description: data.job_description,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      setActiveInterview(data);
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setCurrentAnswer("");
      toast.success("Interview session initialized!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to generate interview questions");
    },
  });

  // Submit Evaluation Mutation
  const submitAnswersMutation = useMutation({
    mutationFn: ({ id, answers }: { id: string; answers: InterviewAnswer[] }) =>
      interviewService.submitAnswers(id, answers),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      setActiveInterview(data);
      toast.success("Interview submitted for grading!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Evaluation failed. Please try again.");
    },
  });

  // Delete Interview Mutation
  const deleteMutation = useMutation({
    mutationFn: interviewService.deleteInterview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      toast.success("Session deleted successfully");
      if (activeInterview) {
        setActiveInterview(null);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete session");
    },
  });

  const currentQuestion = activeInterview?.questions?.[currentQuestionIndex];

  // Timer loop logic
  useEffect(() => {
    if (!activeInterview || activeInterview.status !== "pending" || !currentQuestion) return;

    // Reset timer when question changes
    setTimeLeft(currentQuestion.time_limit);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleNextQuestion(true); // force submit on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex, activeInterview]);

  const handleNextQuestion = (forced = false) => {
    if (!currentQuestion) return;

    const currentQA: InterviewAnswer = {
      question_id: currentQuestion.id,
      answer: forced ? "No response provided in time." : currentAnswer.trim() || "Skipped question.",
    };

    const updatedAnswers = [...userAnswers, currentQA];
    setUserAnswers(updatedAnswers);
    setCurrentAnswer("");

    if (currentQuestionIndex + 1 < (activeInterview?.questions?.length ?? 0)) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Completed last question. Submit answers automatically
      if (activeInterview?.id) {
        submitAnswersMutation.mutate({ id: activeInterview.id, answers: updatedAnswers });
      }
    }
  };

  const handleStartSession = (data: StartFormValues) => {
    generateMutation.mutate(data);
  };

  const handleSelectPastSession = (session: Interview) => {
    setActiveInterview(session);
    // If pending, reset state. If completed, load details
    if (session.status === "pending") {
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setCurrentAnswer("");
    }
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this session record?")) {
      deleteMutation.mutate(id);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 60) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-destructive bg-destructive/10 border-destructive/20";
  };

  const formatTime = (sec: number) => {
    const min = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${min}:${remaining < 10 ? "0" : ""}${remaining}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">AI Mock Interviews</h2>
        <p className="text-muted-foreground text-sm">Participate in dynamic, AI-tailored Q&A sessions with grading breakdowns</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left column: Setup Form + History */}
        <div className="lg:col-span-5 space-y-6">
          {!activeInterview || activeInterview.status === "completed" ? (
            <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> Start Practice Session
                </CardTitle>
                <CardDescription>Tailor the mock interview based on your background and target profile</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(handleStartSession)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resume_id" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Profile</Label>
                    <select
                      id="resume_id"
                      className="flex w-full rounded-xl border border-input bg-background/50 px-3 py-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...register("resume_id")}
                    >
                      <option value="">-- Select Resume --</option>
                      {resumes?.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.original_filename}
                        </option>
                      ))}
                    </select>
                    {errors.resume_id && (
                      <p className="text-xs font-medium text-destructive">{errors.resume_id.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="job_title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target Role</Label>
                    <Input
                      id="job_title"
                      placeholder="e.g. Lead Frontend Engineer"
                      className="rounded-xl border-border bg-background/50 focus:bg-background py-5"
                      {...register("job_title")}
                    />
                    {errors.job_title && (
                      <p className="text-xs font-medium text-destructive">{errors.job_title.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company_name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company (Optional)</Label>
                    <Input
                      id="company_name"
                      placeholder="e.g. Google"
                      className="rounded-xl border-border bg-background/50 focus:bg-background py-5"
                      {...register("company_name")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="job_description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Job Description (Optional)</Label>
                    <Textarea
                      id="job_description"
                      placeholder="Paste details to adjust question generation..."
                      className="min-h-[100px] rounded-xl border-border bg-background/50 focus:bg-background"
                      {...register("job_description")}
                    />
                  </div>

                  <Button type="submit" className="w-full rounded-xl py-6 font-bold" disabled={generateMutation.isPending}>
                    {generateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Tailored Q&A...
                      </>
                    ) : (
                      "Generate Q&A Session"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : null}

          {/* Past Sessions Card */}
          <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">Practice History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {listLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-xl w-full" />
                ))
              ) : interviews && interviews.length > 0 ? (
                interviews.map((session) => (
                  <div
                    key={session.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                      activeInterview?.id === session.id
                        ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                        : "border-border/30 hover:border-border hover:bg-muted/30"
                    }`}
                    onClick={() => handleSelectPastSession(session)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                        <Video className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate text-foreground">{session.job_title}</p>
                        <p className="text-xs text-muted-foreground">
                          {session.company_name ? `${session.company_name} • ` : ""}
                          {new Date(session.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {session.status === "completed" ? (
                        <span className={`text-xs px-2.5 py-1 font-extrabold rounded-md border ${getScoreColor(session.score ?? 50)}`}>
                          {session.score}% Grade
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold uppercase">
                          Pending
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={(e) => handleDeleteSession(session.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No interview sessions recorded yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Active Session Portal OR Report details */}
        <div className="lg:col-span-7">
          {activeInterview && activeInterview.status === "pending" ? (
            /* Active Q&A Interface */
            <Card className="border border-border/40 bg-card/25 backdrop-blur-sm relative overflow-hidden animate-in fade-in duration-300">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-indigo-500 to-primary/50" />
              <CardHeader className="border-b border-border/40 pb-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Active session</span>
                    <CardTitle className="text-xl font-bold">{activeInterview.job_title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-destructive/10 border border-destructive/20 text-destructive px-3.5 py-1 text-sm font-bold animate-pulse">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(timeLeft)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  {activeInterview.questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className={`h-1.5 flex-1 rounded-full ${
                        idx === currentQuestionIndex
                          ? "bg-primary shadow shadow-primary/20"
                          : idx < currentQuestionIndex
                          ? "bg-primary/45"
                          : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
              </CardHeader>
              <CardContent className="py-8 space-y-6">
                <div className="space-y-4">
                  <div className="inline-flex gap-2 items-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <HelpCircle className="h-4 w-4 text-primary" /> Question {currentQuestionIndex + 1} of {activeInterview.questions.length}
                  </div>
                  <h3 className="text-lg font-bold leading-relaxed text-foreground">
                    {currentQuestion?.question}
                  </h3>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="answer" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your Answer Response</Label>
                  <Textarea
                    id="answer"
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Type your structured answer here (preferably using the STAR method format)..."
                    className="min-h-[180px] rounded-xl border-border bg-background/50 focus:bg-background resize-none leading-relaxed"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between border-t border-border/30 pt-6 pb-6 bg-muted/10">
                <div className="text-xs text-muted-foreground">
                  Pressing submit advances immediately. Skipping counts as empty response.
                </div>
                <Button
                  onClick={() => handleNextQuestion(false)}
                  className="rounded-xl font-bold px-6 py-5 gap-2"
                  disabled={submitAnswersMutation.isPending}
                >
                  {currentQuestionIndex + 1 === activeInterview.questions.length ? "Finish Session" : "Next Question"}{" "}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ) : activeInterview && activeInterview.status === "completed" ? (
            /* Completed Interview Session Report details */
            <Card className="border border-border/40 bg-card/25 backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
              <CardHeader className="bg-muted/20 border-b border-border/40 pb-6 text-center space-y-4 relative">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Interview Report Card</h3>
                  <p className="text-lg font-bold text-foreground truncate">{activeInterview.job_title}</p>
                  {activeInterview.company_name && (
                    <p className="text-xs text-muted-foreground">{activeInterview.company_name}</p>
                  )}
                </div>

                <div className="flex items-center justify-center gap-6">
                  <div className="text-center">
                    <span className={`text-3xl font-black px-4 py-2 rounded-xl border ${getScoreColor(activeInterview.score ?? 50)}`}>
                      {activeInterview.score}%
                    </span>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider pt-2">Overall Score</p>
                  </div>
                  <div className="text-center">
                    <span className="text-base font-bold bg-muted/60 text-foreground px-3.5 py-2.5 rounded-xl border border-border">
                      {activeInterview.feedback?.hire_recommendation || "Maybe"}
                    </span>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider pt-2">Decision</p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground max-w-lg mx-auto italic leading-relaxed pt-2">
                  "{activeInterview.feedback?.overall_feedback}"
                </p>
              </CardHeader>

              <CardContent className="py-6 space-y-6">
                {/* Strengths / Improvements */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/5 space-y-2">
                    <span className="text-xs font-bold text-emerald-500 uppercase flex items-center gap-1.5">
                      <Smile className="h-4 w-4 text-emerald-500" /> Key Strengths
                    </span>
                    <ul className="text-[11px] text-muted-foreground space-y-1.5 list-disc pl-4">
                      {activeInterview.feedback?.top_strengths.map((str, idx) => (
                        <li key={idx}>{str}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-500/5 space-y-2">
                    <span className="text-xs font-bold text-amber-500 uppercase flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-amber-500" /> Areas of improvement
                    </span>
                    <ul className="text-[11px] text-muted-foreground space-y-1.5 list-disc pl-4">
                      {activeInterview.feedback?.key_improvements.map((imp, idx) => (
                        <li key={idx}>{imp}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Separator className="bg-border/30" />

                {/* Per Question Answers breakdown */}
                <div className="space-y-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Responses Breakdown</h4>

                  <div className="space-y-6">
                    {activeInterview.questions.map((q, idx) => {
                      const ansObj = activeInterview.answers?.find((a) => a.question_id === q.id);
                      const fdb = activeInterview.feedback?.question_feedback?.find((f) => f.question_id === q.id);

                      return (
                        <div key={q.id} className="p-4 rounded-xl border border-border bg-muted/15 space-y-3">
                          <div className="flex items-center justify-between border-b border-border/30 pb-2">
                            <span className="text-[11px] font-bold text-primary">Question {idx + 1} ({q.type})</span>
                            {fdb && (
                              <span className={`text-[10px] px-2 py-0.5 font-extrabold rounded ${getScoreColor(fdb.score)}`}>
                                {fdb.score}% ({fdb.rating})
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground leading-relaxed">{q.question}</p>
                            <p className="text-xs text-muted-foreground mt-2 italic bg-muted/40 p-2.5 rounded-lg border border-border/20 leading-relaxed">
                              " {ansObj?.answer || "No response submitted."} "
                            </p>
                          </div>

                          {fdb && (
                            <div className="text-[11px] space-y-2 pt-1.5">
                              <div className="text-emerald-500 flex gap-1">
                                <span className="font-extrabold">Went Well:</span>
                                <span className="text-muted-foreground">{fdb.what_went_well}</span>
                              </div>
                              <div className="text-amber-500 flex gap-1">
                                <span className="font-extrabold">To Improve:</span>
                                <span className="text-muted-foreground">{fdb.what_to_improve}</span>
                              </div>
                              <div className="text-primary/90 flex flex-col gap-1 pt-1 border-t border-border/20">
                                <span className="font-extrabold flex items-center gap-1"><BookOpen className="h-3.5 w-3.5 text-primary" /> Perfect Model Answer Hints:</span>
                                <span className="text-muted-foreground leading-relaxed">{fdb.ideal_answer}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Idle Screen */
            <div className="h-full min-h-[300px] flex items-center justify-center p-8 border border-dashed border-border/30 rounded-2xl bg-card/10 text-center">
              <div className="max-w-sm space-y-3">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary w-fit mx-auto animate-bounce">
                  <Video className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-foreground">Ready for Practice</h3>
                <p className="text-xs text-muted-foreground">Select a past mock session, or launch a new dynamic evaluation using the configuration setup panel on the left.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
