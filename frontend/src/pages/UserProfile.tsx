import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { toast } from "sonner";
import { useAuthStore } from "../store/authStore";
import { authService } from "../services/auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Sparkles, User, Key, Loader2, Info } from "lucide-react";

const profileSchema = zod.object({
  name: zod.string().min(2, "Name must be at least 2 characters"),
  email: zod.string().email("Please enter a valid email address"),
});

const passwordSchema = zod
  .object({
    current_password: zod.string().min(1, "Current password is required"),
    new_password: zod.string().min(8, "New password must be at least 8 characters"),
    new_password_confirmation: zod.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.new_password === data.new_password_confirmation, {
    message: "New passwords do not match",
    path: ["new_password_confirmation"],
  });

type ProfileFormValues = zod.infer<typeof profileSchema>;
type PasswordFormValues = zod.infer<typeof passwordSchema>;

export default function UserProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const onUpdateProfile = async (data: ProfileFormValues) => {
    setUpdatingProfile(true);
    try {
      await authService.updateProfile({
        name: data.name,
        email: data.email,
      });
      queryClient.invalidateQueries({ queryKey: ["authMe"] });
      toast.success("Profile details updated successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update profile details");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const onUpdatePassword = async (data: PasswordFormValues) => {
    setUpdatingPassword(true);
    try {
      await authService.updateProfile({
        current_password: data.current_password,
        password: data.new_password,
        password_confirmation: data.new_password_confirmation,
      });
      passwordForm.reset({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      });
      toast.success("Password changed successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to change password. Verify inputs.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">Your Settings</h2>
        <p className="text-muted-foreground text-sm">Configure your personal preferences and password security</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Profile Card */}
        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> Profile Specifications
            </CardTitle>
            <CardDescription>Update your public account email and name indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                <Input
                  id="name"
                  className="rounded-xl border-border bg-background/50 focus:bg-background py-5"
                  {...profileForm.register("name")}
                />
                {profileForm.formState.errors.name && (
                  <p className="text-xs font-medium text-destructive">{profileForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  className="rounded-xl border-border bg-background/50 focus:bg-background py-5"
                  {...profileForm.register("email")}
                />
                {profileForm.formState.errors.email && (
                  <p className="text-xs font-medium text-destructive">{profileForm.formState.errors.email.message}</p>
                )}
              </div>

              <Button type="submit" className="rounded-xl font-bold" disabled={updatingProfile}>
                {updatingProfile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Profiles...
                  </>
                ) : (
                  "Save Profile details"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Card */}
        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Key className="h-5 w-5 text-indigo-400" /> Password Security
            </CardTitle>
            <CardDescription>Modify your existing credentials configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onUpdatePassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Password</Label>
                <Input
                  id="current_password"
                  type="password"
                  placeholder="••••••••"
                  className="rounded-xl border-border bg-background/50 focus:bg-background py-5"
                  {...passwordForm.register("current_password")}
                />
                {passwordForm.formState.errors.current_password && (
                  <p className="text-xs font-medium text-destructive">{passwordForm.formState.errors.current_password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New Password</Label>
                <Input
                  id="new_password"
                  type="password"
                  placeholder="Min. 8 characters"
                  className="rounded-xl border-border bg-background/50 focus:bg-background py-5"
                  {...passwordForm.register("new_password")}
                />
                {passwordForm.formState.errors.new_password && (
                  <p className="text-xs font-medium text-destructive">{passwordForm.formState.errors.new_password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password_confirmation" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirm New Password</Label>
                <Input
                  id="new_password_confirmation"
                  type="password"
                  placeholder="••••••••"
                  className="rounded-xl border-border bg-background/50 focus:bg-background py-5"
                  {...passwordForm.register("new_password_confirmation")}
                />
                {passwordForm.formState.errors.new_password_confirmation && (
                  <p className="text-xs font-medium text-destructive">{passwordForm.formState.errors.new_password_confirmation.message}</p>
                )}
              </div>

              <Button type="submit" className="rounded-xl font-bold" disabled={updatingPassword}>
                {updatingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Credentials...
                  </>
                ) : (
                  "Change Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 rounded-xl border border-blue-500/10 bg-blue-500/5 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-400 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-foreground">API Token Management</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Forge Sprint uses Laravel Sanctum bearer tokens stored inside your local storage instance for routing authorizations. Session security is verified on every workspace request.
          </p>
        </div>
      </div>
    </div>
  );
}
