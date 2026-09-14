"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [checking, setChecking] = useState(true);

  // ponytail: Verify recovery session exists before allowing password update.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setChecking(false);
      if (!session) {
        toast.error("No active session. Please use the recovery link from your email.");
        router.replace("/login");
      }
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
      } else {
        setDone(true);
        toast.success("Password updated!");
        setTimeout(() => router.push("/dashboard"), 2000);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary text-slate-900 py-12 px-4 flex items-center justify-center">
      <div className="max-w-md w-full space-y-6">
        {/* BRAND HEADER */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50/80 border border-blue-100 rounded-full">
            <Zap className="w-4 h-4 text-blue-600 fill-blue-600" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">BerojgarDegreeWala</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Set New Password</h1>
          <p className="text-slate-600 text-sm font-medium">Choose a strong password for your account</p>
        </div>

        <Card className="p-8 space-y-5">
          {checking ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          ) : done ? (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <p className="text-sm font-medium text-slate-700">
                Password updated successfully. Redirecting to dashboard…
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  label="New Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 bottom-3.5 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <Input
                label="Confirm Password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                minLength={8}
              />

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
              </Button>
            </form>
          )}

          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs font-medium text-slate-600">
              <Link href="/login" className="text-blue-600 font-semibold hover:underline">
                Back to Sign In
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
