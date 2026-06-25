"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Sparkles, Brain, ChevronRight, ChevronLeft } from "lucide-react";
import { API_URL } from "@/lib/config";

export default function AIFlashcards() {
  const flashcards = useLiveQuery(() => db.flashcards.toArray());
  const sessions = useLiveQuery(() => db.sessions.toArray());
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const handleGenerate = async () => {
    // Find sessions with notes but no flashcards yet
    // For simplicity, let's just generate for the most recent session with notes
    if (!sessions || sessions.length === 0) return;
    
    const sessionsWithNotes = sessions.filter(s => s.notes && s.notes.length > 10);
    if (sessionsWithNotes.length === 0) {
      alert("No reading sessions with notes found. Add notes to your reading sessions to generate flashcards.");
      return;
    }
    
    const latestSession = sessionsWithNotes[sessionsWithNotes.length - 1];
    
    setIsGenerating(true);
    try {
      const res = await fetch(`${API_URL}/ai/flashcards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: latestSession.notes })
      });
      
      const data = await res.json();
      if (data.flashcards && Array.isArray(data.flashcards)) {
        for (const card of data.flashcards) {
          await db.flashcards.add({
            sessionId: latestSession.id!,
            bookId: latestSession.bookId,
            question: card.question,
            answer: card.answer,
            createdAt: new Date(),
          });
        }
      }
    } catch (error) {
      console.error("Failed to generate flashcards", error);
      alert("Failed to generate flashcards. Please check if the backend is running.");
    } finally {
      setIsGenerating(false);
    }
  };

  const nextCard = () => {
    if (flashcards && activeCardIndex < flashcards.length - 1) {
      setActiveCardIndex(prev => prev + 1);
      setShowAnswer(false);
    }
  };

  const prevCard = () => {
    if (activeCardIndex > 0) {
      setActiveCardIndex(prev => prev - 1);
      setShowAnswer(false);
    }
  };

  if (!flashcards) return <div className="animate-pulse h-64 bg-slate-800/50 rounded-2xl"></div>;

  return (
    <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-tight">
          <Brain className="text-[#00E5FF] w-6 h-6" />
          AI Flashcards
        </h2>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 text-slate-900 dark:text-white py-2 px-4 rounded-full transition-all border border-slate-300 dark:border-white/20 font-bold text-sm"
        >
          <Sparkles className="w-4 h-4" />
          {isGenerating ? "Generating..." : "Generate from Notes"}
        </button>
      </div>

      {flashcards.length === 0 ? (
        <div className="text-center py-12 border border-slate-200 dark:border-white/10 border-dashed rounded-2xl bg-slate-50 dark:bg-[#1a1a1a]">
          <Brain className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No flashcards yet. Read and add notes to generate some!</p>
        </div>
      ) : (
        <div className="relative">
          <div 
            onClick={() => setShowAnswer(!showAnswer)}
            className="w-full max-w-2xl mx-auto h-64 [perspective:1000px] cursor-pointer group"
          >
            <div className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${showAnswer ? '[transform:rotateY(180deg)]' : ''}`}>
              {/* Front */}
              <div className="absolute inset-0 [backface-visibility:hidden] bg-slate-50 dark:bg-[#1a1a1a] rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-sm border border-slate-200 dark:border-white/10">
                <span className="absolute top-4 left-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Question</span>
                <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">{flashcards[activeCardIndex].question}</p>
                <p className="absolute bottom-4 text-xs text-slate-400 dark:text-slate-500 font-medium">Click to reveal answer</p>
              </div>
              
              {/* Back */}
              <div className="absolute inset-0 [backface-visibility:hidden] bg-white dark:bg-[#222222] rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-sm border border-slate-200 dark:border-white/10 [transform:rotateY(180deg)]">
                <span className="absolute top-4 left-4 text-xs font-bold text-[#00E5FF] uppercase tracking-widest">Answer</span>
                <p className="text-lg md:text-xl text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{flashcards[activeCardIndex].answer}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-8">
            <button 
              onClick={prevCard} 
              disabled={activeCardIndex === 0}
              className="p-3 rounded-full bg-slate-100 dark:bg-[#1a1a1a] text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-[#2a2a2a] transition-colors border border-slate-200 dark:border-white/5"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-slate-500 dark:text-slate-400 font-bold tracking-widest text-sm">
              {activeCardIndex + 1} / {flashcards.length}
            </span>
            <button 
              onClick={nextCard} 
              disabled={activeCardIndex === flashcards.length - 1}
              className="p-3 rounded-full bg-slate-100 dark:bg-[#1a1a1a] text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-[#2a2a2a] transition-colors border border-slate-200 dark:border-white/5"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
