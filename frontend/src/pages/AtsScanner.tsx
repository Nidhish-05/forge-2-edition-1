import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resumeService } from "../services/resume";
import { atsService } from "../services/ats";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Separator } from "../components/ui/separator";
import { Skeleton } from "../components/ui/skeleton";
import {
  FileText,
  Scan,
  Loader2,
  Sparkles,
  Award,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
} from "lucide-react";
import { AtsScore, Resume } from "../types";

const scanSchema = zod.object({
  resume_id: zod.string().min(1, "Please select a resume"),
  job_title: zod.string().min(3, "Job title is required (min 3 chars)"),
  company_name: zod.string().optional(),
  job_description: zod.string().min(50, "Please enter a detailed job description (min 50 chars)"),
});

type ScanFormValues = zod.infer<typeof scanSchema>;

export default function AtsScanner() {
  const queryClient = useQueryClient();
  const [selectedScan, setSelectedScan] = useState<AtsScore | null>(null);

  // Fetch Resumes for dropdown selector
  const { data: resumes } = useQuery<Resume[]>({
    queryKey: ["resumes"],
    queryFn: resumeService.getResumes,
  });

  // Fetch past scan history
  const { data: scans, isLoading: scansLoading } = useQuery<AtsScore[]>({
    queryKey: ["atsScans"],
    queryFn: atsService.getHistory,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ScanFormValues>({
    resolver: zodResolver(scanSchema),
  });

  // Scan Mutation
  const scanMutation = useMutation({
    mutationFn: (data: ScanFormValues) =>
      atsService.scan({
        resume_id: parseInt(data.resume_id),
        job_title: data.job_title,
        company_name: data.company_name,
        job_description: data.job_description,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["atsScans"] });
      setSelectedScan(data);
      toast.success("ATS scan completed successfully!");
      reset({ resume_id: "", job_title: "", company_name: "", job_description: "" });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to calculate ATS score. Verify inputs.");
    },
  });

  const onSubmit = (data: ScanFormValues) => {
    scanMutation.mutate(data);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 60) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-destructive bg-destructive/10 border-destructive/20";
  };

  const getScoreRingColor = (score: number) => {
    if (score >= 80) return "stroke-emerald-500";
    if (score >= 60) return "stroke-amber-500";
    return "stroke-red-500";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">ATS Scoring</h2>
        <p className="text-muted-foreground text-sm">Optimize your resume against target roles using keyword density analysis</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Side: Scan Form & History */}
        <div className="lg:col-span-7 space-y-6">
          {/* New Scan Card */}
          <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Create New ATS Scan
              </CardTitle>
              <CardDescription>Compare any resume against a job description to extract missing keywords</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resume_id" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Resume</Label>
                  <select
                    id="resume_id"
                    className="flex w-full rounded-xl border border-input bg-background/50 px-3 py-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register("resume_id")}
                  >
                    <option value="">-- Choose one --</option>
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="job_title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target Job Title</Label>
                    <Input
                      id="job_title"
                      placeholder="e.g. Software Engineer"
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
                      placeholder="e.g. Acme Corp"
                      className="rounded-xl border-border bg-background/50 focus:bg-background py-5"
                      {...register("company_name")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job_description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Job Description</Label>
                  <Textarea
                    id="job_description"
                    placeholder="Paste the full job description details here..."
                    className="min-h-[160px] rounded-xl border-border bg-background/50 focus:bg-background"
                    {...register("job_description")}
                  />
                  {errors.job_description && (
                    <p className="text-xs font-medium text-destructive">{errors.job_description.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full rounded-xl py-6 font-bold" disabled={scanMutation.isPending}>
                  {scanMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Match Details...
                    </>
                  ) : (
                    "Run Match Scan"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Past History */}
          <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">Past ATS Evaluations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {scansLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-xl w-full" />
                ))
              ) : scans && scans.length > 0 ? (
                scans.map((scan) => (
                  <div
                    key={scan.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                      selectedScan?.id === scan.id
                        ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                        : "border-border/30 hover:border-border hover:bg-muted/30"
                    }`}
                    onClick={() => setSelectedScan(scan)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                        <Scan className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate text-foreground">{scan.job_title}</p>
                        <p className="text-xs text-muted-foreground">
                          {scan.company_name ? `${scan.company_name} • ` : ""}
                          {new Date(scan.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2.5 py-1 font-extrabold rounded-md border ${getScoreColor(scan.score)}`}>
                        {scan.score}% Match
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No scan evaluations recorded yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Scan Analysis Results Dashboard */}
        <div className="lg:col-span-5">
          {selectedScan ? (
            <Card className="border border-border/40 bg-card/25 backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
              <CardHeader className="bg-muted/20 border-b border-border/40 pb-6 text-center space-y-4 relative">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Match Quality</h3>
                  <p className="text-lg font-bold truncate text-foreground">{selectedScan.job_title}</p>
                  {selectedScan.company_name && (
                    <p className="text-xs text-muted-foreground">{selectedScan.company_name}</p>
                  )}
                </div>

                {/* Score Circle SVG */}
                <div className="relative flex items-center justify-center h-28 w-28 mx-auto">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="48" className="stroke-muted fill-transparent" strokeWidth="8" />
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      className={`fill-transparent transition-all duration-1000 ${getScoreRingColor(selectedScan.score)}`}
                      strokeWidth="8"
                      strokeDasharray="301.6"
                      strokeDashoffset={301.6 - (301.6 * selectedScan.score) / 100}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-foreground">{selectedScan.score}%</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Score</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground max-w-xs mx-auto italic">
                  "{selectedScan.feedback.summary}"
                </p>
              </CardHeader>

              <CardContent className="py-6 space-y-6">
                {/* Keywords Summary */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-primary" /> Keyword Distribution
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl border border-emerald-500/10 bg-emerald-500/5 space-y-1">
                      <span className="text-[10px] font-bold text-emerald-500 uppercase">Matched Terms</span>
                      <p className="text-lg font-extrabold text-foreground">{selectedScan.feedback.matched_keywords.length}</p>
                    </div>
                    <div className="p-3 rounded-xl border border-destructive/10 bg-destructive/5 space-y-1">
                      <span className="text-[10px] font-bold text-destructive uppercase">Missing Terms</span>
                      <p className="text-lg font-extrabold text-foreground">{selectedScan.feedback.missing_keywords.length}</p>
                    </div>
                  </div>
                </div>

                {/* Keyword Details */}
                {selectedScan.feedback.missing_keywords.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-foreground">Top Missing Skills Keywords</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedScan.feedback.missing_keywords.slice(0, 10).map((kw) => (
                        <span key={kw} className="text-[11px] px-2.5 py-1 rounded-md bg-destructive/10 text-destructive border border-destructive/20 font-medium">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <Separator className="bg-border/30" />

                {/* Strengths & Weaknesses (SWOT Breakdown) */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">SWOT Match Analysis</h4>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4 text-emerald-500" /> Strong Matches
                      </span>
                      <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
                        {selectedScan.feedback.strengths.map((str, idx) => (
                          <li key={idx}>{str}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1 pt-1">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 text-amber-500" /> Improvement Opportunities
                      </span>
                      <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
                        {selectedScan.feedback.weaknesses.map((weak, idx) => (
                          <li key={idx}>{weak}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <Separator className="bg-border/30" />

                {/* Action Suggestions */}
                {selectedScan.feedback.suggestions && selectedScan.feedback.suggestions.length > 0 && (
                  <div className="p-4 rounded-xl border border-primary/10 bg-primary/5 space-y-3">
                    <h4 className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                      <Lightbulb className="h-4 w-4 text-primary" /> Actionable Recommendations
                    </h4>
                    <ul className="text-xs text-foreground space-y-2">
                      {selectedScan.feedback.suggestions.map((sug, idx) => (
                        <li key={idx} className="flex gap-2 items-start">
                          <span className="text-primary font-black mt-0.5">•</span>
                          <span>{sug}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center p-8 border border-dashed border-border/30 rounded-2xl bg-card/10 text-center">
              <div className="max-w-sm space-y-3">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary w-fit mx-auto">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-foreground">No Report Selected</h3>
                <p className="text-xs text-muted-foreground">Select a report from the history list, or scan a new job specification to obtain breakdown evaluations.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
