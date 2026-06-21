"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { PlusCircle, Target, BookOpen, Clock } from "lucide-react";
import dynamic from 'next/dynamic';
import SetGoalModal from "./SetGoalModal";
import BookCard from "./BookCard";
import AIFlashcards from "./AIFlashcards";
import Dictionary from "./Dictionary";

const AddBookModal = dynamic(() => import('./AddBookModal'), { ssr: false });

export default function Dashboard() {
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [isGoalOpen, setIsGoalOpen] = useState(false);

  const books = useLiveQuery(() => db.books.toArray());
  const goals = useLiveQuery(() => db.goals.toArray());
  const sessions = useLiveQuery(() => db.sessions.toArray());

  const currentGoal = goals?.length ? goals[goals.length - 1] : null;
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
  const todaySessions = sessions?.filter(s => s.date === today) || [];
  const pagesReadToday = todaySessions.reduce((sum, s) => sum + s.pagesRead, 0);

  const goalProgress = currentGoal 
    ? Math.min(Math.round((pagesReadToday / currentGoal.dailyPages) * 100), 100) 
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 flex items-center justify-between shadow-xl shadow-black/10 transition-transform hover:scale-[1.02]">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">Pages Read Today</p>
            <h3 className="text-3xl font-bold text-white">{pagesReadToday}</h3>
            {currentGoal && (
              <p className="text-xs text-cyan-400 mt-2">
                {goalProgress}% of {currentGoal.dailyPages} pages goal
              </p>
            )}
          </div>
          <div className="h-12 w-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
            <BookOpen className="text-cyan-400 w-6 h-6" />
          </div>
        </div>

        <div 
          onClick={() => setIsGoalOpen(true)}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 flex items-center justify-between shadow-xl shadow-black/10 cursor-pointer hover:bg-slate-800 transition-all hover:scale-[1.02] group"
        >
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">Daily Goal</p>
            <h3 className="text-3xl font-bold text-white">
              {currentGoal ? currentGoal.dailyPages : "Not Set"}
            </h3>
            <p className="text-xs text-slate-500 mt-2 group-hover:text-cyan-400 transition-colors">Click to set goal</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <Target className="text-indigo-400 w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 flex items-center justify-between shadow-xl shadow-black/10 transition-transform hover:scale-[1.02]">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">Total Books</p>
            <h3 className="text-3xl font-bold text-white">{books?.length || 0}</h3>
            <p className="text-xs text-slate-500 mt-2">In your library</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Clock className="text-emerald-400 w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Books Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            My Library
          </h2>
          <button
            onClick={() => setIsAddBookOpen(true)}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold py-2 px-4 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:-translate-y-0.5 active:translate-y-0"
          >
            <PlusCircle className="w-5 h-5" />
            <span className="hidden sm:inline">Add Book</span>
          </button>
        </div>

        {books === undefined ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="h-64 bg-slate-800/50 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-16 bg-slate-800/20 rounded-2xl border border-slate-700/30 border-dashed">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-300">Your library is empty</h3>
            <p className="text-slate-500 mt-2 max-w-sm mx-auto">Add your first book to start tracking your reading journey and building habits.</p>
            <button
              onClick={() => setIsAddBookOpen(true)}
              className="mt-6 text-cyan-400 font-medium hover:text-cyan-300 transition-colors"
            >
              + Add a new book
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map(book => (
              <BookCard key={book.id} book={book} sessions={sessions || []} />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-12">
        <AIFlashcards />
        <Dictionary />
      </div>

      <AddBookModal isOpen={isAddBookOpen} onClose={() => setIsAddBookOpen(false)} />
      <SetGoalModal isOpen={isGoalOpen} onClose={() => setIsGoalOpen(false)} currentGoal={currentGoal?.dailyPages || 0} />
    </div>
  );
}
