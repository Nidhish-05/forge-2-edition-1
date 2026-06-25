import React from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  FileText,
  Scan,
  Video,
  Award,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
} from "lucide-react";

export default function Dashboard() {
  const { user, stats } = useAuthStore();

  const metrics = [
    {
      name: "Uploaded Resumes",
      value: stats?.total_resumes ?? 0,
      description: "Parsed document profiles",
      icon: FileText,
      color: "text-blue-500 bg-blue-500/10",
      link: "/resumes",
    },
    {
      name: "ATS Scans Run",
      value: stats?.total_ats_scans ?? 0,
      description: "Job description matches",
      icon: Scan,
      color: "text-emerald-500 bg-emerald-500/10",
      link: "/ats",
    },
    {
      name: "Average ATS Score",
      value: stats?.average_ats_score ? `${stats.average_ats_score}%` : "N/A",
      description: "Global profile alignment",
      icon: TrendingUp,
      color: "text-violet-500 bg-violet-500/10",
      link: "/ats",
    },
    {
      name: "Mock Interviews",
      value: stats?.total_interviews ?? 0,
      description: `Completed: ${stats?.completed_interviews ?? 0}`,
      icon: Video,
      color: "text-amber-500 bg-amber-500/10",
      link: "/interview",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl border border-border/40 overflow-hidden bg-gradient-to-r from-primary/10 via-violet-500/5 to-transparent p-6 md:p-8">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 blur-3xl rounded-full" />
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            AI Workspace Ready
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Welcome back, {user?.name || "Job Seeker"}!
          </h2>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
            Upload your resume, analyze keywords to optimize ATS compatibility scores, and participate in mock interviews tailored specifically for your target role.
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.name} className="border border-border/40 bg-card/40 backdrop-blur-sm relative overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 group">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">
                  {metric.name}
                </CardTitle>
                <div className={`p-2.5 rounded-xl ${metric.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-3xl font-bold tracking-tight text-foreground">{metric.value}</div>
                <p className="text-xs text-muted-foreground flex items-center justify-between">
                  <span>{metric.description}</span>
                  <Link to={metric.link} className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-primary font-semibold hover:underline">
                    Manage <ArrowRight className="h-3 w-3" />
                  </Link>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Primary Actions Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Quick Start Guides</CardTitle>
            <CardDescription>Get the most out of your Forge Sprint experience</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-start gap-4 p-4 rounded-xl border border-border/30 bg-muted/20 hover:bg-muted/40 transition-colors">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500 mt-1">
                <FileText className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-foreground">Step 1: Upload your resume</h4>
                <p className="text-xs text-muted-foreground">We parse details like skills, contact info, experience, and certifications automatically using Gemini.</p>
                <Link to="/resumes" className="inline-flex items-center gap-1 text-xs text-primary font-semibold pt-1 hover:underline">
                  Go to Resumes <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl border border-border/30 bg-muted/20 hover:bg-muted/40 transition-colors">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500 mt-1">
                <Scan className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-foreground">Step 2: Run an ATS Scan</h4>
                <p className="text-xs text-muted-foreground">Match your resume against any target job description. Obtain score breakdowns and keyword improvement suggestions.</p>
                <Link to="/ats" className="inline-flex items-center gap-1 text-xs text-primary font-semibold pt-1 hover:underline">
                  Optimize ATS Score <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl border border-border/30 bg-muted/20 hover:bg-muted/40 transition-colors">
              <div className="p-2.5 rounded-lg bg-violet-500/10 text-violet-500 mt-1">
                <Video className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-foreground">Step 3: Conduct Mock Interview</h4>
                <p className="text-xs text-muted-foreground">Generate technical, behavioral, and situational questions tailored directly to your background and the target role.</p>
                <Link to="/interview" className="inline-flex items-center gap-1 text-xs text-primary font-semibold pt-1 hover:underline">
                  Start Practice Session <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Stats Summary */}
        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Platform Status</CardTitle>
            <CardDescription>Connected workspace engines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/30 pb-3">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" /> Core Engine
                </span>
                <span className="text-sm font-bold text-foreground">Online</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/30 pb-3">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-500" /> AI Modality
                </span>
                <span className="text-xs px-2.5 py-1 font-semibold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Gemini API / Sim Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" /> Database Status
                </span>
                <span className="text-sm font-semibold text-foreground">PostgreSQL Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
