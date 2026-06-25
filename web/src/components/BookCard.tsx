"use client";

import { useState } from "react";
import { Book as BookType, ReadingSession } from "@/lib/db";
import { BookOpen, Bookmark, TrendingUp, Trash2 } from "lucide-react";
import TrackSessionModal from "./TrackSessionModal";
import { db } from "@/lib/db";

export default function BookCard({ book, sessions }: { book: BookType; sessions: ReadingSession[] }) {
  const [isTrackOpen, setIsTrackOpen] = useState(false);

  const bookSessions = sessions.filter(s => s.bookId === book.id);
  const totalPagesRead = bookSessions.reduce((sum, s) => sum + s.pagesRead, 0);
  const progressPercent = Math.min(Math.round((totalPagesRead / book.totalPages) * 100), 100);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this book and all its data?")) return;
    if (book.id) {
      await db.sessions.where('bookId').equals(book.id).delete();
      await db.flashcards.where('bookId').equals(book.id).delete();
      await db.books.delete(book.id);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden flex flex-col group hover:border-slate-300 dark:hover:border-white/20 transition-all shadow-sm">
        <div className="h-32 bg-slate-100 dark:bg-[#1a1a1a] relative p-6 flex items-end">
          <button 
            onClick={handleDelete}
            className="absolute top-4 left-4 z-20 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-black/50 p-2 rounded-full"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="absolute top-4 right-4 bg-white dark:bg-[#222222] rounded-full px-3 py-1 text-xs font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-white/5 z-20 shadow-sm">
            {progressPercent}% Done
          </div>
          <Bookmark className="absolute text-slate-200 dark:text-slate-800/50 w-32 h-32 -right-8 -top-8" />
          <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight line-clamp-2 z-10 tracking-tight">{book.title}</h3>
        </div>
        
        <div className="p-5 flex-1 flex flex-col">
          {book.author && (
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 font-medium">{book.author}</p>
          )}

          <div className="mt-auto">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 font-bold uppercase tracking-wider">
              <span>{totalPagesRead} pages</span>
              <span>{book.totalPages} pages</span>
            </div>
            <div className="h-1.5 bg-slate-200 dark:bg-[#222222] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#00E5FF] rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {book.type === 'pdf' ? (
              <button
                onClick={() => window.location.href = `/book/${book.id}`}
                className="w-full flex items-center justify-center gap-2 bg-[#00E5FF] hover:bg-[#00cce6] text-black py-2.5 rounded-full transition-colors font-bold"
              >
                <BookOpen className="w-4 h-4" />
                Read
              </button>
            ) : (
              <div></div>
            )}
            <button 
              onClick={() => setIsTrackOpen(true)}
              className={`${book.type === 'pdf' ? 'col-span-1' : 'col-span-2'} w-full flex items-center justify-center gap-2 bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 text-slate-900 dark:text-white py-2.5 rounded-full transition-colors font-bold border border-slate-300 dark:border-white/20`}
            >
              <TrendingUp className="w-4 h-4" />
              Track
            </button>
          </div>
        </div>
      </div>

      <TrackSessionModal 
        isOpen={isTrackOpen} 
        onClose={() => setIsTrackOpen(false)} 
        book={book} 
        totalPagesRead={totalPagesRead} 
      />
    </>
  );
}
