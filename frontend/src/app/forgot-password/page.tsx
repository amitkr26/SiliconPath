"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, Loader2, Mail, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
      });
      if (error) {
        toast.error(error.message);
      } else {
        setSent(true);
        toast.success("Recovery email sent!");
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border-2 border-slate-900 rounded-full shadow-brutal-sm">
            <Zap className="w-4 h-4 text-blue-600 fill-blue-600" />
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">BerojgarDegreeWala</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Reset Password</h1>
          <p className="text-slate-600 text-sm font-medium">
            Enter your email and we&apos;ll send you a recovery link
          </p>
        </div>

        <Card className="p-8 space-y-5">
          {sent ? (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <p className="text-sm font-medium text-slate-700">
                Check your inbox for a password recovery link.
              </p>
              <p className="text-xs text-slate-500">
                Didn&apos;t receive it? Check your spam folder or{" "}
                <button
                  onClick={() => { setSent(false); setEmail(""); }}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  try again
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Mail className="w-4 h-4" /> Send Recovery Link</>}
              </Button>
            </form>
          )}

          <div className="pt-4 border-t-2 border-slate-900 text-center">
            <p className="text-xs font-bold">
              <Link href="/login" className="text-blue-600 hover:underline">
                Back to Sign In
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
