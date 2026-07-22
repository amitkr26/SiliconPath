// src/components/academy/PracticeQuiz.tsx
"use client";

import React, { useState } from "react";
import { LearningQuestion } from "../../lib/academy/types";
import { CheckCircle2, XCircle, AlertCircle, HelpCircle, ArrowRight } from "lucide-react";

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
    if (submitted[questionId]) return; // locked after submit
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionValue }));
  };

  const handleInputChange = (questionId: string, value: string) => {
    if (submitted[questionId]) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmitQuestion = (questionId: string, correctAnswer: string) => {
    if (submitted[questionId]) return;
    
    const userAns = selectedAnswers[questionId]?.trim().toLowerCase();
    const correctAns = correctAnswer.trim().toLowerCase();
    
    const isCorrect = userAns === correctAns;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
    
    setSubmitted((prev) => ({ ...prev, [questionId]: true }));
    setShowExplanation((prev) => ({ ...prev, [questionId]: true }));

    // Check if all questions are submitted
    const newSubmittedCount = Object.keys(submitted).length + 1;
    if (newSubmittedCount === questions.length) {
      onQuizCompleted();
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-[#374151]/50 pb-4">
        <h3 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-cyan" />
          Daily Practice & Concept Verification
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          Verify your knowledge of today&apos;s topics. Submit each answer to see detailed explanations.
        </p>
      </div>

      <div className="space-y-6">
        {questions.map((q, idx) => {
          const isSubmitted = submitted[q.id];
          const selectedAns = selectedAnswers[q.id] || "";
          const isCorrect = selectedAns.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();

          return (
            <div
              key={q.id}
              className={`p-5 rounded-2xl border transition-all duration-300 ${
                isSubmitted
                  ? isCorrect
                    ? "bg-emerald-500/5 border-emerald-500/30"
                    : "bg-red-500/5 border-red-500/30"
                  : "bg-[#111827]/40 border-[#374151]/50 hover:border-gray-700"
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start gap-3 justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-800 text-gray-400">
                  Question {idx + 1}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${
                    q.difficulty === "easy"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : q.difficulty === "medium"
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {q.difficulty}
                </span>
              </div>

              <p className="text-base text-gray-200 font-medium mt-3 whitespace-pre-wrap">
                {q.question}
              </p>

              {/* Input Styles depending on MCQ/True-False/Short Answer */}
              <div className="mt-4 space-y-2">
                {q.question_type === "mcq" || q.question_type === "truefalse" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options?.map((opt) => {
                      const isSelected = selectedAns === opt.value;
                      const isCorrectOption = opt.value === q.correct_answer;
                      let btnStyle = "bg-[#1F2937]/40 border-[#374151]/50 hover:bg-[#1F2937]/80 text-gray-300";

                      if (isSubmitted) {
                        if (isCorrectOption) {
                          btnStyle = "bg-emerald-500/20 border-emerald-500/80 text-emerald-200 font-medium";
                        } else if (isSelected) {
                          btnStyle = "bg-red-500/20 border-red-500/80 text-red-200";
                        } else {
                          btnStyle = "bg-gray-800/20 border-gray-800 text-gray-600 opacity-60";
                        }
                      } else if (isSelected) {
                        btnStyle = "bg-cyan/20 border-cyan text-cyan font-medium shadow-md shadow-cyan/10";
                      }

                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelectOption(q.id, opt.value)}
                          disabled={isSubmitted}
                          className={`w-full p-3.5 text-left rounded-xl border text-sm transition-all duration-200 flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt.label}</span>
                          {isSubmitted && isCorrectOption && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          {isSubmitted && isSelected && !isCorrectOption && <XCircle className="w-4 h-4 text-red-400" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      disabled={isSubmitted}
                      value={selectedAns}
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full bg-[#111827]/60 border border-[#374151]/80 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-500 text-sm focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/30 disabled:opacity-75 disabled:text-gray-400"
                    />
                    {isSubmitted && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">Correct Answer:</span>
                        <code className="bg-gray-800 text-emerald-400 px-2 py-0.5 rounded font-mono font-medium">
                          {q.correct_answer}
                        </code>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button */}
              {!isSubmitted && (
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    disabled={!selectedAns}
                    onClick={() => handleSubmitQuestion(q.id, q.correct_answer)}
                    className="px-5 py-2 rounded-xl text-sm font-semibold bg-cyan text-gray-900 hover:bg-[#00E5FF]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-1 shadow-lg shadow-cyan/20"
                  >
                    Check Answer
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Detailed Explanation */}
              {isSubmitted && q.explanation && (
                <div className="mt-4 p-4 bg-[#1F2937]/30 border-t border-[#374151]/20 rounded-xl">
                  <div className="flex gap-2 text-xs text-gray-400 font-semibold items-center uppercase tracking-wider mb-2">
                    <AlertCircle className="w-4 h-4 text-cyan" />
                    <span>Explanation</span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {q.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default PracticeQuiz;
