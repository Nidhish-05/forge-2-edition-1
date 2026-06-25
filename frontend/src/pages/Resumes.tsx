import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resumeService } from "../services/resume";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Skeleton } from "../components/ui/skeleton";
import {
  UploadCloud,
  FileText,
  Trash2,
  Loader2,
  Briefcase,
  GraduationCap,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  User,
  Plus,
} from "lucide-react";
import { Resume } from "../types";

export default function Resumes() {
  const queryClient = useQueryClient();
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch Resumes
  const { data: resumes, isLoading } = useQuery<Resume[]>({
    queryKey: ["resumes"],
    queryFn: resumeService.getResumes,
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: resumeService.deleteResume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      toast.success("Resume deleted successfully");
      if (selectedResume) {
        setSelectedResume(null);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete resume");
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit");
      return;
    }

    setUploading(true);
    const toastId = toast.loading(`Uploading and parsing ${file.name}...`);
    try {
      const parsedResume = await resumeService.uploadResume(file);
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      setSelectedResume(parsedResume);
      toast.success("Resume uploaded and parsed successfully!", { id: toastId });
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || "Failed to parse document. Please check the file type.";
      toast.error(message, { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this resume? This action cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Your Resumes</h2>
          <p className="text-muted-foreground text-sm">Upload, parse, and review your professional profiles</p>
        </div>

        <div className="relative">
          <input
            type="file"
            id="resume-upload"
            className="hidden"
            accept=".pdf,.docx,.txt"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <Button asChild rounded-xl className="font-bold py-6 px-6" disabled={uploading}>
            <label htmlFor="resume-upload" className="cursor-pointer flex items-center gap-2">
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              {uploading ? "Parsing Resume..." : "Upload Resume"}
            </label>
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Resumes List */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">Resume Repository</CardTitle>
              <CardDescription>Select a resume below to view its extracted data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl w-full" />
                ))
              ) : resumes && resumes.length > 0 ? (
                resumes.map((resume) => (
                  <div
                    key={resume.id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                      selectedResume?.id === resume.id
                        ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                        : "border-border/30 hover:border-border hover:bg-muted/30"
                    }`}
                    onClick={() => setSelectedResume(resume)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate text-foreground">
                          {resume.original_filename}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(resume.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      onClick={(e) => handleDelete(resume.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 space-y-3 border border-dashed border-border/40 rounded-2xl bg-muted/10">
                  <UploadCloud className="h-10 w-10 text-muted-foreground mx-auto" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">No Resumes Found</p>
                    <p className="text-xs text-muted-foreground">Upload a PDF, DOCX, or TXT file to get started.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resume Detail Parser Panel */}
        <div className="lg:col-span-2">
          {selectedResume ? (
            <Card className="border border-border/40 bg-card/25 backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
              <CardHeader className="bg-muted/20 border-b border-border/40 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                      Gemini Auto-Parsed
                    </div>
                    <CardTitle className="text-2xl font-bold">
                      {selectedResume.parsed_content?.name || selectedResume.original_filename}
                    </CardTitle>
                    <p className="text-muted-foreground text-sm">{selectedResume.parsed_content?.summary || "No professional summary provided."}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  {selectedResume.parsed_content?.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 text-primary/80" />
                      <span className="truncate">{selectedResume.parsed_content.email}</span>
                    </div>
                  )}
                  {selectedResume.parsed_content?.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 text-primary/80" />
                      <span>{selectedResume.parsed_content.phone}</span>
                    </div>
                  )}
                  {selectedResume.parsed_content?.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground col-span-1 sm:col-span-2">
                      <MapPin className="h-4 w-4 text-primary/80" />
                      <span>{selectedResume.parsed_content.location}</span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="py-6 space-y-6">
                {/* Skills Badges */}
                {selectedResume.parsed_content?.skills && selectedResume.parsed_content.skills.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedResume.parsed_content.skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-xs px-3 py-1.5 font-bold rounded-lg bg-primary/10 text-primary border border-primary/20"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <Separator className="bg-border/30" />

                {/* Experience Timeline */}
                {selectedResume.parsed_content?.experience && selectedResume.parsed_content.experience.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-primary" /> Work Experience
                    </h3>
                    <div className="relative border-l border-border/40 pl-6 ml-3 space-y-6">
                      {selectedResume.parsed_content.experience.map((exp, idx) => (
                        <div key={idx} className="relative group">
                          {/* Dot marker */}
                          <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background transition-transform duration-300 group-hover:scale-125" />
                          <div className="space-y-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <h4 className="font-bold text-sm text-foreground">{exp.role}</h4>
                              <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md self-start sm:self-center">
                                {exp.duration}
                              </span>
                            </div>
                            <p className="text-xs text-primary/95 font-semibold">{exp.company}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                              {exp.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator className="bg-border/30" />

                {/* Education Timeline */}
                {selectedResume.parsed_content?.education && selectedResume.parsed_content.education.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-primary" /> Education
                    </h3>
                    <div className="relative border-l border-border/40 pl-6 ml-3 space-y-6">
                      {selectedResume.parsed_content.education.map((edu, idx) => (
                        <div key={idx} className="relative group">
                          {/* Dot marker */}
                          <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background transition-transform duration-300 group-hover:scale-125" />
                          <div className="space-y-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <h4 className="font-bold text-sm text-foreground">{edu.degree}</h4>
                              {edu.year && (
                                <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md self-start sm:self-center">
                                  {edu.year}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-primary/95 font-semibold">{edu.institution}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center p-8 border border-dashed border-border/30 rounded-2xl bg-card/10 text-center">
              <div className="max-w-sm space-y-3">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary w-fit mx-auto">
                  <User className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-foreground">No Profile Selected</h3>
                <p className="text-xs text-muted-foreground">Select an uploaded resume from your repository to see parsed structured details.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
