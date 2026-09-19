// src/app/academy/[track]/assessment/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Award, Trophy,
  HelpCircle, RefreshCw, ChevronRight, Check, X, AlertTriangle
} from "lucide-react";
import { api } from "@/lib/api-client";
import { LearningTrack, TrackAssessment } from "@/lib/academy/types";
import { getCompletedDaysLocal, markTrackPassedLocal, saveAssessmentResultLocal } from "@/lib/academy/progress-local";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { Toaster, toast } from "sonner";

export default function TrackAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const trackSlug = params.track as string;

  const [track, setTrack] = useState<LearningTrack | null>(null);
  const [assessment, setAssessment] = useState<TrackAssessment | null>(null);
  const [loading, setLoading] = useState(true);

  // Quiz state
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scorePercent, setScorePercent] = useState(0);
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    async function loadAssessment() {
      try {
        const t = await api.get<LearningTrack>(`/api/academy/tracks/${trackSlug}`);
        if (!t) {
          toast.error("Track not found");
          router.push("/academy");
          return;
        }
        setTrack(t);

        const ass = await api.get<TrackAssessment>(`/api/academy/tracks/${t.id}/assessment`);
        if (!ass) {
          toast.error("Assessment not configured for this track yet.");
          router.push(`/academy/${trackSlug}`);
          return;
        }
        setAssessment(ass);

        const localCompleted = getCompletedDaysLocal(trackSlug);
        const trackDays = await api.get<{ id: string; day_number: number }[]>(`/api/academy/tracks/${t.id}/days`).catch(() => [] as { id: string; day_number: number }[]);
        const allDone = trackDays.length > 0 && trackDays.every((d) => localCompleted.includes(d.id));
        if (!allDone) {
          toast.warning("Complete all days before taking the assessment.");
          router.push(`/academy/${trackSlug}`);
          return;
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
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500 font-medium">Opening assessment...</p>
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
    const unanswered = assessment.questions.some((_, idx) => !answers[idx]);
    if (unanswered) {
      toast.warning("Please answer all questions before submitting.");
      return;
    }

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
      if (hasPassed) {
        markTrackPassedLocal(track.slug);
        saveAssessmentResultLocal({
          scorePercent: finalScore,
          passed: true,
          trackSlug: track.slug,
          completedAt: new Date().toISOString(),
        });
      }

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
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Navigation */}
        <Link
          href={`/academy/${track.slug}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Cancel and return to Track
        </Link>

        {/* Header Panel */}
        <Card className="p-8 text-center space-y-3">
          <div className="inline-flex p-4 rounded-xl bg-blue-600 text-white shadow-sm mb-2">
            <Trophy className="w-7 h-7" />
          </div>
          <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">
            {track.title} Gating Assessment
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Verify your understanding of all materials in this track. Scoring{" "}
            <strong className="text-slate-900 font-semibold">{assessment.passing_score_percent}%</strong>{" "}
            or higher unlocks the next track in the VLSI curriculum.
          </p>
        </Card>

        {/* Gating Status / Result Cards */}
        {isSubmitted && (
          <Card className={cn("p-8 text-center space-y-4 border", passed ? "bg-emerald-50/60 border-emerald-200" : "bg-red-50/60 border-red-200")}>
            <div className="inline-flex p-4 rounded-full bg-white border border-slate-200 shadow-sm">
              {passed ? (
                <Award className="w-10 h-10 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-10 h-10 text-red-600" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="font-display text-2xl font-bold text-slate-900">
                {passed ? "Assessment Passed!" : "Assessment Failed"}
              </h3>
              <p className="text-sm text-slate-600">
                You scored <strong className="text-slate-900 font-semibold">{scorePercent}%</strong>. Required passing score: {assessment.passing_score_percent}%.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {passed ? (
                <Button href="/academy" size="lg">
                  Return to Academy Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="danger" size="lg" onClick={handleRetry}>
                    <RefreshCw className="w-4 h-4" />
                    Retry Assessment
                  </Button>
                  <Button variant="secondary" size="lg" href={`/academy/${track.slug}`}>
                    Review Curriculum Days
                  </Button>
                </>
              )}
            </div>
          </Card>
        )}

        {/* Questions Terminal */}
        <div className="space-y-6">
          {assessment.questions.map((q, idx) => {
            const userAns = answers[idx] || "";
            const isCorrect = userAns.trim().toLowerCase() === q.correct.trim().toLowerCase();

            return (
              <Card
                key={idx}
                className={cn("p-6 transition-all duration-300", isSubmitted && (isCorrect ? "bg-emerald-50/60 border-emerald-200" : "bg-red-50/60 border-red-200"))}
              >
                {/* Question Header */}
                <div className="flex justify-between items-center gap-4 border-b border-slate-100 pb-3 mb-4">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Question {idx + 1}
                  </span>
                  {isSubmitted && (
                    isCorrect ? (
                      <Badge tone="success">
                        <Check className="w-3 h-3" /> Correct
                      </Badge>
                    ) : (
                      <Badge tone="danger">
                        <X className="w-3 h-3" /> Incorrect
                      </Badge>
                    )
                  )}
                </div>

                <p className="text-base text-slate-900 font-semibold mb-4 leading-relaxed">
                  {q.q}
                </p>

                {/* Answer Options */}
                {q.type === "mcq" && q.options ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt) => {
                      const isSelected = userAns === opt;
                      const isCorrectOption = opt === q.correct;

                      let btnStyle = "bg-white border border-slate-200 text-slate-900 hover:bg-blue-50/50 hover:border-blue-200 font-medium";

                      if (isSubmitted) {
                        if (isCorrectOption) {
                          btnStyle = "bg-emerald-50 border border-emerald-300 text-emerald-900 font-semibold";
                        } else if (isSelected) {
                          btnStyle = "bg-red-50 border border-red-300 text-red-900 font-semibold";
                        } else {
                          btnStyle = "bg-slate-50 border border-slate-100 text-slate-400 opacity-70";
                        }
                      } else if (isSelected) {
                        btnStyle = "bg-blue-600 border border-blue-600 text-white font-semibold shadow-sm";
                      }

                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={isSubmitted}
                          onClick={() => handleSelectOption(idx, opt)}
                          className={`w-full p-4 text-left rounded-lg text-sm transition-all duration-200 flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {isSubmitted && isCorrectOption && <Check className="w-4 h-4 text-emerald-700" />}
                          {isSubmitted && isSelected && !isCorrectOption && <X className="w-4 h-4 text-red-700" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Input
                      type="text"
                      disabled={isSubmitted}
                      value={userAns}
                      onChange={(e) => handleTextChange(idx, e.target.value)}
                      placeholder="Type your answer here..."
                    />
                    {isSubmitted && (
                      <div className="flex items-center gap-2 text-sm pt-1 font-medium">
                        <span className="text-slate-600">Correct Answer:</span>
                        <code className="bg-slate-900 text-white px-3 py-1 rounded-lg font-mono text-xs">
                          {q.correct}
                        </code>
                      </div>
                    )}
                  </div>
                )}

                {/* Explanation */}
                {isSubmitted && q.exp && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-blue-600" /> Explanation
                    </p>
                    <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
                      {q.exp}
                    </p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Submit Panel */}
        {!isSubmitted && (
          <Card className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left space-y-1">
              <h4 className="text-sm font-semibold text-slate-900">Ready to submit?</h4>
              <p className="text-xs text-slate-500">Ensure you have answered all questions. You can retry if you don&apos;t pass.</p>
            </div>

            <Button size="lg" onClick={handleSubmitQuiz} className="w-full sm:w-auto">
              Submit Assessment
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Card>
        )}
      </div>
      <Toaster position="bottom-right" theme="light" />
    </div>
  );
}