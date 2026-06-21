"use client";

import { useState } from "react";
import { X, TrendingUp, Calendar, Hash } from "lucide-react";
import { db, Book } from "@/lib/db";

export default function TrackSessionModal({ 
  isOpen, 
  onClose, 
  book, 
  totalPagesRead 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  book: Book;
  totalPagesRead: number;
}) {
  const [pagesRead, setPagesRead] = useState("");
  
  const d = new Date();
  const [date, setDate] = useState(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPages = parseInt(pagesRead, 10);
    if (!parsedPages || parsedPages <= 0 || !book.id) return;

    await db.sessions.add({
      bookId: book.id,
      date,
      pagesRead: parsedPages,
      notes,
      createdAt: new Date(),
    });

    setPagesRead("");
    setNotes("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-cyan-500/5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Track Progress</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="mb-4 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <p className="text-sm text-slate-300 font-medium">{book.title}</p>
            <p className="text-xs text-slate-500 mt-1">Currently read: {totalPagesRead} / {book.totalPages}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Pages Read</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  max={book.totalPages - totalPagesRead}
                  value={pagesRead}
                  onChange={(e) => setPagesRead(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                  placeholder="25"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Date</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-sm font-medium text-slate-300">Notes <span className="text-slate-500 font-normal">(Optional)</span></label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all resize-none h-24"
              placeholder="What did you learn today?"
            ></textarea>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98]"
            >
              Save Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
