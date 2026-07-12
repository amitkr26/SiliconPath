// src/app/academy/[track]/assessment/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Award, CheckCircle2, XCircle, Trophy, 
  HelpCircle, RefreshCw, ChevronRight, Check, X, AlertTriangle 
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getTrackBySlug, getTrackAssessment, saveAssessmentResult, getCompletedDays, getDaysForTrack } from "@/lib/academy/queries";
import { LearningTrack, TrackAssessment, AssessmentQuestion } from "@/lib/academy/types";
import { Toaster, toast } from "sonner";

export default function TrackAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const trackSlug = params.track as string;

  const [track, setTrack] = useState<LearningTrack | null>(null);
  const [assessment, setAssessment] = useState<TrackAssessment | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Quiz state
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scorePercent, setScorePercent] = useState(0);
  const [passed, setPassed] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    async function loadAssessment() {
      try {
        const t = await getTrackBySlug(trackSlug);
        if (!t) {
          toast.error("Track not found");
          router.push("/academy");
          return;
        }
        setTrack(t);

        const ass = await getTrackAssessment(t.id);
        if (!ass) {
          toast.error("Assessment not configured for this track yet.");
          router.push(`/academy/${trackSlug}`);
          return;
        }
        setAssessment(ass);

        const supabaseClient = createClient();
        const { data: { user } } = await supabaseClient.auth.getUser();
        setUser(user);

        // Gate: require all days completed before showing assessment
        if (user) {
          const [completedDayIds, trackDays] = await Promise.all([
            getCompletedDays(user.id).catch(() => [] as string[]),
            getDaysForTrack(t.id).catch(() => [] as any[]),
          ]);
          const allDayIds = trackDays.map((d: any) => d.id);
          const completedCount = allDayIds.filter((id: string) => completedDayIds.includes(id)).length;
          const allDone = completedCount === allDayIds.length && allDayIds.length > 0;
          if (!allDone) {
            toast.warning("Complete all days before taking the assessment.");
            router.push(`/academy/${trackSlug}`);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to load assessment:", err);
      } finally {
        setLoading(false);
      }
    }
    if (trackSlug) {
      loadAssessment();
    }
  }, [trackSlug, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] text-gray-100 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan/20 border-t-cyan rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-400 text-sm">Opening testing terminal...</p>
      </div>
    );
  }

  if (!track || !assessment) return null;

  const handleSelectOption = (qIdx: number, val: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [qIdx]: val }));
  };

  const handleTextChange = (qIdx: number, val: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [qIdx]: val }));
  };

  const handleSubmitQuiz = async () => {
    // Verify all questions are answered
    const unanswered = assessment.questions.some((_, idx) => !answers[idx]);
    if (unanswered) {
      toast.warning("Please answer all questions before submitting.");
      return;
    }

    // Calculate score
    let correctCount = 0;
    assessment.questions.forEach((q, idx) => {
      const userAns = answers[idx]?.trim().toLowerCase();
      const correctAns = q.correct.trim().toLowerCase();
      if (userAns === correctAns) {
        correctCount++;
      }
    });

    const totalQuestions = assessment.questions.length;
    const finalScore = Math.round((correctCount / totalQuestions) * 100);
    const hasPassed = finalScore >= assessment.passing_score_percent;

    setScorePercent(finalScore);
    setPassed(hasPassed);
    setIsSubmitted(true);

    try {
      const userId = user?.id || null;
      await saveAssessmentResult(userId, track.id, track.slug, finalScore, hasPassed, answers);
      
      if (hasPassed) {
        toast.success(`Congratulations! You passed the ${track.title} assessment!`);
      } else {
        toast.error(`Assessment failed. You scored ${finalScore}%, passing score is ${assessment.passing_score_percent}%.`);
      }
    } catch (err) {
      console.error("Failed to save assessment score:", err);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setIsSubmitted(false);
    setScorePercent(0);
    setPassed(false);
    toast.info("Assessment restarted. Good luck!");
  };

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Glow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full filter blur-[150px] pointer-events-none opacity-10"
        style={{ backgroundColor: track.color }}
      ></div>

      <div className="max-w-3xl mx-auto relative z-10 space-y-10">
        {/* Navigation */}
        <Link 
          href={`/academy/${track.slug}`} 
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-cyan transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Cancel and return to Track
        </Link>

        {/* Header Panel */}
        <div className="text-center space-y-3 pb-6 border-b border-[#374151]/40">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 mb-2">
            <Trophy className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">
            {track.title} Gating Assessment
          </h1>
          <p className="text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
            Verify your understanding of all materials in this track. Scoring **{assessment.passing_score_percent}%** or higher unlocks the next course in the VLSI curriculum.
          </p>
        </div>

        {/* Gating Status / Result Cards */}
        {isSubmitted && (
          <div className={`p-6 md:p-8 rounded-3xl border text-center space-y-4 shadow-xl ${
            passed 
              ? "bg-emerald-500/10 border-emerald-500/30 shadow-emerald-500/5" 
              : "bg-red-500/10 border-red-500/30 shadow-red-500/5"
          }`}>
            <div className="inline-flex p-4 rounded-full bg-black/40">
              {passed ? (
                <Award className="w-12 h-12 text-emerald-400 animate-bounce" />
              ) : (
                <AlertTriangle className="w-12 h-12 text-red-400" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-white">
                {passed ? "Assessment Passed!" : "Assessment Failed"}
              </h3>
              <p className="text-sm text-gray-400">
                You scored <strong className="text-white text-base">{scorePercent}%</strong>. Required passing score: {assessment.passing_score_percent}%.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {passed ? (
                <Link
                  href="/academy"
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-gray-950 transition-colors shadow-lg shadow-emerald-500/20"
                >
                  Return to Academy Dashboard
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-400 text-gray-950 transition-colors shadow-lg shadow-red-500/20 flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-4 h-4 animate-spin-reverse" />
                    Retry Assessment
                  </button>
                  <Link
                    href={`/academy/${track.slug}`}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#1F2937] hover:bg-[#374151] text-gray-200 transition-colors"
                  >
                    Review Curriculum Days
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        {/* Questions Terminal */}
        <div className="space-y-8">
          {assessment.questions.map((q, idx) => {
            const userAns = answers[idx] || "";
            const isCorrect = userAns.trim().toLowerCase() === q.correct.trim().toLowerCase();

            return (
              <div 
                key={idx}
                className={`p-6 rounded-3xl border transition-all duration-300 ${
                  isSubmitted
                    ? isCorrect
                      ? "bg-emerald-500/5 border-emerald-500/20"
                      : "bg-red-500/5 border-red-500/20"
                    : "bg-[#111827]/40 border-[#374151]/50 shadow-md hover:border-gray-700"
                }`}
              >
                {/* Question Header */}
                <div className="flex justify-between items-center gap-4 border-b border-[#374151]/20 pb-3 mb-4">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Question {idx + 1}
                  </span>
                  {isSubmitted && (
                    <span className={`flex items-center gap-1 text-xs font-bold ${
                      isCorrect ? "text-emerald-400" : "text-red-400"
                    }`}>
                      {isCorrect ? (
                        <>
                          <Check className="w-4 h-4" /> Correct
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4" /> Incorrect
                        </>
                      )}
                    </span>
                  )}
                </div>

                <p className="text-base text-gray-200 font-semibold mb-4 leading-relaxed">
                  {q.q}
                </p>

                {/* Answer Options */}
                {q.type === "mcq" && q.options ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt) => {
                      const isSelected = userAns === opt;
                      const isCorrectOption = opt === q.correct;
                      
                      let btnStyle = "bg-[#1F2937]/30 border-[#374151]/40 hover:bg-[#1F2937]/70 text-gray-300";
                      
                      if (isSubmitted) {
                        if (isCorrectOption) {
                          btnStyle = "bg-emerald-500/20 border-emerald-500/80 text-emerald-200 font-semibold";
                        } else if (isSelected) {
                          btnStyle = "bg-red-500/20 border-red-500/80 text-red-200";
                        } else {
                          btnStyle = "bg-gray-800/10 border-gray-900 text-gray-600 opacity-60";
                        }
                      } else if (isSelected) {
                        btnStyle = "bg-cyan/20 border-cyan text-cyan font-semibold shadow-md shadow-cyan/10";
                      }

                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={isSubmitted}
                          onClick={() => handleSelectOption(idx, opt)}
                          className={`w-full p-4 text-left rounded-2xl border text-sm transition-all duration-200 flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {isSubmitted && isCorrectOption && <Check className="w-4 h-4 text-emerald-400" />}
                          {isSubmitted && isSelected && !isCorrectOption && <X className="w-4 h-4 text-red-400" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      disabled={isSubmitted}
                      value={userAns}
                      onChange={(e) => handleTextChange(idx, e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full bg-[#111827]/60 border border-[#374151]/80 rounded-2xl px-4 py-3.5 text-gray-100 placeholder-gray-500 text-sm focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/30 disabled:opacity-75"
                    />
                    {isSubmitted && (
                      <div className="flex items-center gap-2 text-sm pt-1">
                        <span className="text-gray-400">Correct Answer:</span>
                        <code className="bg-gray-800 text-emerald-400 px-2 py-0.5 rounded font-mono font-medium">
                          {q.correct}
                        </code>
                      </div>
                    )}
                  </div>
                )}

                {/* Explanation */}
                {isSubmitted && q.exp && (
                  <div className="mt-4 p-4 bg-[#1F2937]/30 border-t border-[#374151]/20 rounded-2xl">
                    <p className="text-xs text-cyan font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5" /> Explanation
                    </p>
                    <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
                      {q.exp}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit Panel */}
        {!isSubmitted && (
          <div className="p-6 bg-[#1F2937]/20 border border-[#374151]/40 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left space-y-1">
              <h4 className="text-sm font-bold text-gray-200">Ready to submit?</h4>
              <p className="text-xs text-gray-500">Ensure you have answered all questions. You can retry if you don&apos;t pass.</p>
            </div>

            <button
              type="button"
              onClick={handleSubmitQuiz}
              className="w-full sm:w-auto px-8 py-3 rounded-2xl text-sm font-extrabold bg-cyan text-gray-900 hover:bg-[#00E5FF]/80 transition-colors shadow-lg shadow-cyan/20 flex items-center justify-center gap-1.5"
            >
              Submit Assessment
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}
