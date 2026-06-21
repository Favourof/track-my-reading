"use client";

import { useState, useEffect } from "react";
import { X, Target } from "lucide-react";
import { db } from "@/lib/db";

export default function SetGoalModal({ isOpen, onClose, currentGoal }: { isOpen: boolean; onClose: () => void; currentGoal: number }) {
  const [pages, setPages] = useState("");

  useEffect(() => {
    if (isOpen) {
      setPages(currentGoal > 0 ? currentGoal.toString() : "20");
    }
  }, [isOpen, currentGoal]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(pages, 10);
    if (!parsed || parsed <= 0) return;

    await db.goals.add({
      dailyPages: parsed,
      updatedAt: new Date(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl w-full max-w-sm shadow-2xl shadow-indigo-500/10 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-indigo-500/5">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Daily Goal</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-slate-400 text-sm">
            Set a realistic daily reading goal to build a consistent habit.
          </p>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Pages per day</label>
            <input
              type="number"
              required
              min="1"
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-xl font-bold text-center text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
            >
              Update Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
