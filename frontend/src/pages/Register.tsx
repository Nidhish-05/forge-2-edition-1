import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { toast } from "sonner";
import { useAuthStore } from "../store/authStore";
import { authService } from "../services/auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Award, Loader2 } from "lucide-react";

const registerSchema = zod
  .object({
    name: zod.string().min(2, "Name must be at least 2 characters"),
    email: zod.string().email("Please enter a valid email address"),
    password: zod.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: zod.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

type RegisterFormValues = zod.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const loginStore = useAuthStore((state) => state.login);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setSubmitting(true);
    try {
      const response = await authService.register(data);
      loginStore(response.token, response.user);
      toast.success("Account created successfully! Welcome to Forge Sprint.");
      navigate("/");
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || "Registration failed. Email may already be registered.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md border border-border/40 bg-card/60 backdrop-blur-xl shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-violet-500 to-indigo-600" />
        <CardHeader className="space-y-2 text-center pt-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Award className="h-6 w-6" />
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Create Account
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Unlock AI-powered recruitment tools today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Full Name
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                className="rounded-xl border-border bg-background/50 focus:bg-background transition-all duration-300 py-6"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs font-medium text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="rounded-xl border-border bg-background/50 focus:bg-background transition-all duration-300 py-6"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs font-medium text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 8 characters"
                className="rounded-xl border-border bg-background/50 focus:bg-background transition-all duration-300 py-6"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs font-medium text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_confirmation" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Confirm Password
              </Label>
              <Input
                id="password_confirmation"
                type="password"
                placeholder="••••••••"
                className="rounded-xl border-border bg-background/50 focus:bg-background transition-all duration-300 py-6"
                {...register("password_confirmation")}
              />
              {errors.password_confirmation && (
                <p className="text-xs font-medium text-destructive">{errors.password_confirmation.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full rounded-xl py-6 font-bold shadow-lg shadow-primary/10" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 border-t border-border/30 pt-6 pb-8 text-center text-sm text-muted-foreground">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline hover:text-primary/95 transition-colors">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
