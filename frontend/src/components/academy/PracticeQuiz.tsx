// src/components/academy/PracticeQuiz.tsx
"use client";

import React, { useState } from "react";
import { LearningQuestion } from "../../lib/academy/types";
import { CheckCircle2, XCircle, AlertCircle, HelpCircle, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

interface PracticeQuizProps {
  questions: LearningQuestion[];
  onQuizCompleted: () => void;
}

export const PracticeQuiz: React.FC<PracticeQuizProps> = ({ questions, onQuizCompleted }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState<number>(0);

  if (!questions || questions.length === 0) return null;

  const handleSelectOption = (questionId: string, optionValue: string) => {
    if (submitted[questionId]) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionValue }));
  };

  const handleInputChange = (questionId: string, value: string) => {
    if (submitted[questionId]) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmitQuestion = (questionId: string, rawCorrectAnswer: any) => {
    if (submitted[questionId]) return;

    const userAns = (selectedAnswers[questionId] || "").trim().toLowerCase();
    const correctAns = String(rawCorrectAnswer ?? "").trim().toLowerCase();

    const q = questions.find((item) => item.id === questionId);
    let isCorrect = userAns === correctAns;
    if (!isCorrect && q) {
      const rawOpts = (q as any).options || [];
      const matchedOpt = rawOpts.map((opt: any, oIdx: number) => {
        if (typeof opt === "string") {
          return { value: String(oIdx).toLowerCase(), alt: opt.trim().toLowerCase() };
        }
        return { value: String(opt.value ?? oIdx).toLowerCase(), alt: String(opt.label || opt.value || "").trim().toLowerCase() };
      }).find((o: any) => o.value === userAns || o.alt === userAns);

      if (matchedOpt && (matchedOpt.value === correctAns || matchedOpt.alt === correctAns)) {
        isCorrect = true;
      }
    }

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setSubmitted((prev) => ({ ...prev, [questionId]: true }));
    setShowExplanation((prev) => ({ ...prev, [questionId]: true }));

    const newSubmittedCount = Object.keys(submitted).length + 1;
    if (newSubmittedCount === questions.length) {
      onQuizCompleted();
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b-2 border-slate-900 pb-4">
        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-blue-600 stroke-[2.5]" />
          Daily Practice & Concept Verification
        </h3>
        <p className="text-sm font-medium text-slate-600 mt-1">
          Verify your knowledge of today&apos;s topics. Submit each answer to see detailed explanations.
        </p>
      </div>

      <div className="space-y-6">
        {questions.map((q, idx) => {
          const isSubmitted = submitted[q.id];
          const selectedAns = selectedAnswers[q.id] || "";
          const rawOptions = (q as any).options || [];
          const normalizedOptions = rawOptions.map((opt: any, oIdx: number) => {
            if (typeof opt === "string") {
              return {
                value: String(oIdx),
                label: opt,
                altValue: opt.trim().toLowerCase(),
              };
            }
            return {
              value: String(opt.value ?? oIdx),
              label: String(opt.label || opt.value || ""),
              altValue: String(opt.value || opt.label || "").trim().toLowerCase(),
            };
          });

          const strCorrectAns = String(q.correct_answer ?? "").trim().toLowerCase();
          const matchedSelected = normalizedOptions.find((o: any) => o.value.toLowerCase() === selectedAns.trim().toLowerCase() || o.altValue === selectedAns.trim().toLowerCase());
          const isCorrect = selectedAns.trim().toLowerCase() === strCorrectAns || Boolean(matchedSelected && (matchedSelected.value.toLowerCase() === strCorrectAns || matchedSelected.altValue === strCorrectAns));

          return (
            <Card
              key={q.id}
              className={cn(
                "p-6 transition-all duration-300",
                isSubmitted && (isCorrect ? "bg-emerald-50" : "bg-red-50")
              )}
            >
              {/* Question Header */}
              <div className="flex items-start gap-3 justify-between">
                <Badge tone="inverse">Question {idx + 1}</Badge>
                {q.difficulty === "easy" ? (
                  <Badge tone="success">{q.difficulty}</Badge>
                ) : q.difficulty === "medium" ? (
                  <Badge tone="accent">{q.difficulty}</Badge>
                ) : (
                  <Badge tone="danger">{q.difficulty}</Badge>
                )}
              </div>

              <p className="text-base text-slate-900 font-bold mt-3 whitespace-pre-wrap">
                {q.question}
              </p>

              {/* Input Styles depending on MCQ/True-False/Short Answer */}
              <div className="mt-4 space-y-3">
                {normalizedOptions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {normalizedOptions.map((opt: any) => {
                      const isSelected = selectedAns === opt.value;
                      const isCorrectOption =
                        opt.value.toLowerCase() === strCorrectAns ||
                        opt.altValue === strCorrectAns;

                      let btnStyle = "bg-white border-2 border-slate-900 text-slate-900 hover:bg-blue-50 font-bold shadow-brutal-sm";

                      if (isSubmitted) {
                        if (isCorrectOption) {
                          btnStyle = "bg-emerald-100 border-2 border-slate-900 text-emerald-950 font-black shadow-brutal-sm";
                        } else if (isSelected) {
                          btnStyle = "bg-red-100 border-2 border-slate-900 text-red-950 font-black shadow-brutal-sm";
                        } else {
                          btnStyle = "bg-slate-100 border-2 border-slate-300 text-slate-400 opacity-60 shadow-none";
                        }
                      } else if (isSelected) {
                        btnStyle = "bg-blue-600 border-2 border-slate-900 text-white font-black shadow-brutal";
                      }

                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelectOption(q.id, opt.value)}
                          disabled={isSubmitted}
                          className={`w-full p-4 text-left rounded-xl text-sm transition-all duration-200 flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt.label}</span>
                          {isSubmitted && isCorrectOption && <CheckCircle2 className="w-4 h-4 text-emerald-700 stroke-[3]" />}
                          {isSubmitted && isSelected && !isCorrectOption && <XCircle className="w-4 h-4 text-red-700 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Input
                      type="text"
                      disabled={isSubmitted}
                      value={selectedAns}
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                      placeholder="Type your answer here..."
                    />
                    {isSubmitted && (
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <span className="text-slate-600">Correct Answer:</span>
                        <code className="bg-slate-900 text-white px-3 py-1 rounded-lg font-mono text-xs">
                          {String(q.correct_answer)}
                        </code>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button */}
              {!isSubmitted && (
                <div className="mt-5 flex justify-end">
                  <Button
                    disabled={!selectedAns}
                    onClick={() => handleSubmitQuestion(q.id, q.correct_answer)}
                  >
                    Check Answer
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </Button>
                </div>
              )}

              {/* Detailed Explanation */}
              {isSubmitted && q.explanation && (
                <div className="mt-4 p-4 bg-blue-50 border-2 border-slate-900 rounded-xl shadow-brutal-sm">
                  <div className="flex gap-2 text-xs text-blue-700 font-black items-center uppercase tracking-wider mb-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 stroke-[2.5]" />
                    <span>Explanation</span>
                  </div>
                  <p className="text-sm text-slate-900 font-medium leading-relaxed whitespace-pre-wrap">
                    {q.explanation}
                  </p>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
export default PracticeQuiz;