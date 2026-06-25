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

import { ThemeToggle } from "./ThemeToggle";

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
      <div className="flex justify-end pt-4">
        <ThemeToggle />
      </div>
      
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="rounded-2xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 p-6 flex items-center justify-between shadow-sm hover:border-slate-300 dark:hover:border-white/20 transition-all duration-200">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1 tracking-widest uppercase">Pages Read Today</p>
            <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{pagesReadToday}</h3>
            {currentGoal && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                {goalProgress}% of {currentGoal.dailyPages} pages
              </p>
            )}
          </div>
          <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-[#1a1a1a] flex items-center justify-center">
            <BookOpen className="text-slate-700 dark:text-slate-300 w-6 h-6" />
          </div>
        </div>

        {/* Card 2 */}
        <div 
          onClick={() => setIsGoalOpen(true)}
          className="rounded-2xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 p-6 flex items-center justify-between shadow-sm hover:border-slate-300 dark:hover:border-white/20 transition-all duration-200 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1 tracking-widest uppercase">Daily Goal</p>
            <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {currentGoal ? currentGoal.dailyPages : "Set"}
            </h3>
            <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-2 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Click to update ↗</p>
          </div>
          <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-[#1a1a1a] flex items-center justify-center group-hover:bg-cyan-50 dark:group-hover:bg-cyan-950/30 transition-colors">
            <Target className="text-slate-700 dark:text-slate-300 group-hover:text-cyan-500 transition-colors w-6 h-6" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="rounded-2xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 p-6 flex items-center justify-between shadow-sm hover:border-slate-300 dark:hover:border-white/20 transition-all duration-200">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1 tracking-widest uppercase">Total Books</p>
            <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{books?.length || 0}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">In your library</p>
          </div>
          <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-[#1a1a1a] flex items-center justify-center">
            <Clock className="text-slate-700 dark:text-slate-300 w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Books Section */}
      <div className="mt-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            My Library
          </h2>
          <button
            onClick={() => setIsAddBookOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-black bg-[#00E5FF] hover:bg-[#00cce6] rounded-full transition-all hover:scale-105 active:scale-95"
          >
            <PlusCircle className="w-5 h-5" />
            <span className="hidden sm:inline">Add Book</span>
          </button>
        </div>

        {books === undefined ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="h-64 bg-slate-100 dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-white/10 animate-pulse"></div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-[#111111] rounded-3xl border border-slate-200 dark:border-white/10">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Your library is empty</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8">Add your first book to start tracking your reading journey.</p>
            <button
              onClick={() => setIsAddBookOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-black bg-[#00E5FF] hover:bg-[#00cce6] rounded-full transition-all hover:scale-105"
            >
              <PlusCircle className="w-5 h-5" />
              Add a new book
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
