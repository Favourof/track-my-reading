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
    <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Brain className="text-purple-400 w-6 h-6" />
          AI Flashcards
        </h2>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 py-2 px-4 rounded-xl transition-all border border-purple-500/30"
        >
          <Sparkles className="w-4 h-4" />
          {isGenerating ? "Generating..." : "Generate from Notes"}
        </button>
      </div>

      {flashcards.length === 0 ? (
        <div className="text-center py-12 border border-slate-700/30 border-dashed rounded-xl">
          <Brain className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No flashcards yet. Read and add notes to generate some!</p>
        </div>
      ) : (
        <div className="relative">
          <div 
            onClick={() => setShowAnswer(!showAnswer)}
            className="w-full max-w-2xl mx-auto h-64 perspective-1000 cursor-pointer group"
          >
            <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${showAnswer ? 'rotate-y-180' : ''}`}>
              {/* Front */}
              <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-xl border border-slate-600/50">
                <span className="absolute top-4 left-4 text-xs font-semibold text-purple-400 bg-purple-400/10 px-3 py-1 rounded-full">Question</span>
                <p className="text-xl md:text-2xl font-medium text-white">{flashcards[activeCardIndex].question}</p>
                <p className="absolute bottom-4 text-xs text-slate-500 group-hover:text-slate-400 transition-colors">Click to reveal answer</p>
              </div>
              
              {/* Back */}
              <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-purple-900 to-slate-900 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-xl border border-purple-500/30 rotate-y-180">
                <span className="absolute top-4 left-4 text-xs font-semibold text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full">Answer</span>
                <p className="text-lg md:text-xl text-white leading-relaxed">{flashcards[activeCardIndex].answer}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-8">
            <button 
              onClick={prevCard} 
              disabled={activeCardIndex === 0}
              className="p-3 rounded-full bg-slate-800 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-slate-400 font-medium">
              {activeCardIndex + 1} / {flashcards.length}
            </span>
            <button 
              onClick={nextCard} 
              disabled={activeCardIndex === flashcards.length - 1}
              className="p-3 rounded-full bg-slate-800 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
