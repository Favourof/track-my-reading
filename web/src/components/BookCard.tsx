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
      <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl overflow-hidden flex flex-col group hover:border-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/5 transition-all">
        <div className="h-32 bg-gradient-to-br from-slate-700 to-slate-900 relative p-6 flex items-end">
          <button 
            onClick={handleDelete}
            className="absolute top-4 left-4 z-20 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/50 p-2 rounded-full backdrop-blur-sm"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="absolute top-4 right-4 bg-slate-950/40 backdrop-blur-md rounded-full px-3 py-1 text-xs font-semibold text-cyan-300 border border-slate-600/50 z-20">
            {progressPercent}% Done
          </div>
          <Bookmark className="absolute text-slate-800 w-32 h-32 -right-8 -top-8 opacity-20" />
          <h3 className="text-xl font-bold text-white leading-tight line-clamp-2 z-10">{book.title}</h3>
        </div>
        
        <div className="p-5 flex-1 flex flex-col">
          {book.author && (
            <p className="text-slate-400 text-sm mb-4">{book.author}</p>
          )}

          <div className="mt-auto">
            <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
              <span>{totalPagesRead} pages</span>
              <span>{book.totalPages} pages</span>
            </div>
            <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {book.type === 'pdf' ? (
              <button
                onClick={() => window.location.href = `/book/${book.id}`}
                className="w-full flex items-center justify-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 py-2.5 rounded-xl transition-colors font-medium border border-purple-500/30"
              >
                <BookOpen className="w-4 h-4" />
                Read
              </button>
            ) : (
              <div></div>
            )}
            <button 
              onClick={() => setIsTrackOpen(true)}
              className={`${book.type === 'pdf' ? 'col-span-1' : 'col-span-2'} w-full flex items-center justify-center gap-2 bg-slate-700/30 hover:bg-slate-700 hover:text-cyan-300 text-slate-300 py-2.5 rounded-xl transition-colors font-medium border border-slate-600/30`}
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
