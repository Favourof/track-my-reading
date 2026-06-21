"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { API_URL } from "@/lib/config";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, Brain, ArrowLeft, Loader2, Maximize, CheckCircle2 } from "lucide-react";
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function ReaderContent() {
  const params = useParams();
  const router = useRouter();
  const bookId = parseInt(params.id as string, 10);

  const book = useLiveQuery(() => db.books.get(bookId), [bookId]);
  
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [startPage, setStartPage] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  
  const [liveSessionId, setLiveSessionId] = useState<number | null>(null);
  const [markedPages, setMarkedPages] = useState<Set<number>>(new Set());
  const [pageStartTime, setPageStartTime] = useState<number>(Date.now());

  useEffect(() => {
    if (book && !initialized) {
      const lastPage = book.lastPageRead || 1;
      setStartPage(lastPage);
      setPageNumber(lastPage);
      setPageStartTime(Date.now());
      setInitialized(true);
    }
  }, [book, initialized]);

  // Update start time whenever page changes
  useEffect(() => {
    setPageStartTime(Date.now());
  }, [pageNumber]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const checkAutoMark = async () => {
    if (Date.now() - pageStartTime > 20000 && !markedPages.has(pageNumber)) {
      await handleMarkAsRead(false);
    }
  };

  const goPrev = async () => {
    await checkAutoMark();
    const prevPage = Math.max(pageNumber - 1, 1);
    setPageNumber(prevPage);
    if (book) await db.books.update(book.id!, { lastPageRead: prevPage });
  };
  
  const goNext = async () => {
    await checkAutoMark();
    const nextPage = Math.min(pageNumber + 1, numPages || 1);
    setPageNumber(nextPage);
    if (book) await db.books.update(book.id!, { lastPageRead: nextPage });
  };

  const handleMarkAsRead = async (autoAdvance = true) => {
    if (!book || markedPages.has(pageNumber)) return;
    
    const newMarked = new Set(markedPages);
    newMarked.add(pageNumber);
    setMarkedPages(newMarked);

    if (liveSessionId) {
      const session = await db.sessions.get(liveSessionId);
      if (session) {
        await db.sessions.update(liveSessionId, { pagesRead: session.pagesRead + 1 });
      }
    } else {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const newSessionId = await db.sessions.add({
        bookId: book.id!,
        date: dateStr,
        pagesRead: 1,
        notes: `Auto-extracted session`,
        createdAt: new Date(),
      });
      setLiveSessionId(newSessionId as number);
    }

    await db.books.update(book.id!, { lastPageRead: pageNumber });

    if (autoAdvance && numPages && pageNumber < numPages) {
      setPageNumber(prev => prev + 1);
      await db.books.update(book.id!, { lastPageRead: pageNumber + 1 });
    }
  };

  const handleEndSession = async () => {
    if (!book || !book.file) return;
    setIsExtracting(true);
    setError(null);

    try {
      if (markedPages.size === 0) {
        router.push("/");
        return;
      }

      const arrayBuffer = await book.file.arrayBuffer();
      const pdf = await pdfjs.getDocument(arrayBuffer).promise;
      
      let extractedText = "";
      const sortedPages = Array.from(markedPages).sort((a, b) => a - b);
      for (const p of sortedPages) {
        const page = await pdf.getPage(p);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        extractedText += pageText + "\n\n";
      }

      if (liveSessionId) {
        const res = await fetch(`${API_URL}/ai/flashcards`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            sessionNotes: extractedText.slice(0, 15000),
            bookTitle: book.title 
          })
        });

        const data = await res.json();
        if (data.flashcards && Array.isArray(data.flashcards)) {
          for (const card of data.flashcards) {
            await db.flashcards.add({
              sessionId: liveSessionId,
              bookId: book.id!,
              question: card.question,
              answer: card.answer,
              createdAt: new Date(),
            });
          }
        }
      }

      router.push("/");
    } catch (err: any) {
      console.error("Failed to end session:", err);
      setError(err.message || "Failed to generate flashcards. Please check your connection to the AI proxy.");
    } finally {
      setIsExtracting(false);
    }
  };

  if (book === undefined) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /></div>;
  }

  if (!book) {
    return <div className="min-h-screen flex items-center justify-center text-slate-300">Book not found</div>;
  }

  if (book.type === 'physical') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">{book.title}</h2>
        <p className="text-slate-400 max-w-md">
          This is a physical book. You cannot read it directly in the app. Use the tracker on the dashboard to log your sessions.
        </p>
        <button 
          onClick={() => router.push("/")}
          className="mt-6 px-6 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-950 flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <header className={`p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10 transition-transform ${isFullscreen ? '-translate-y-full absolute w-full' : ''}`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/")}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">{book.title}</h1>
            <p className="text-xs text-slate-400">
              Pages read this session: <span className="text-cyan-400 font-bold">{markedPages.size}</span>
              {markedPages.size > 0 && (
                <span className="ml-2 text-slate-500 font-mono">
                  (Pages: {Array.from(markedPages).sort((a,b)=>a-b).slice(-5).join(', ')}{markedPages.size > 5 ? ', ...' : ''})
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <Maximize className="w-4 h-4" />
          </button>
          <button 
            onClick={handleEndSession}
            disabled={isExtracting}
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-400 text-slate-950 px-5 py-2 rounded-xl font-bold transition-colors disabled:opacity-50"
          >
            {isExtracting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Brain className="w-4 h-4" />
            )}
            End & Generate Flashcards
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-500/10 border-b border-red-500/20 p-4 text-center text-red-400 font-medium z-20 relative">
          {error}
        </div>
      )}

      <main className="flex-1 overflow-y-auto flex justify-center bg-slate-950 p-4 md:p-8 relative">
        {isFullscreen && (
          <button 
            onClick={() => setIsFullscreen(false)}
            className="fixed top-4 right-4 z-50 bg-slate-800/80 p-2 rounded-full text-white backdrop-blur-md"
          >
            <Maximize className="w-4 h-4" />
          </button>
        )}

        {book.file && (
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden max-w-[800px] w-full">
            <Document
              file={book.file}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<div className="h-[800px] flex items-center justify-center text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /></div>}
            >
              <Page 
                pageNumber={pageNumber} 
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="w-full"
                width={typeof window !== 'undefined' ? Math.min(window.innerWidth - 32, 800) : 800}
              />
            </Document>
          </div>
        )}
      </main>

      <footer className="p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky bottom-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            disabled={pageNumber <= 1}
            onClick={goPrev}
            className="p-3 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <span className="text-slate-300 font-medium font-mono min-w-[80px] text-center">
            {pageNumber} <span className="text-slate-600">/</span> {numPages || '-'}
          </span>

          <button
            disabled={pageNumber >= (numPages || 1)}
            onClick={goNext}
            className="p-3 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <button
          onClick={() => handleMarkAsRead(true)}
          disabled={markedPages.has(pageNumber)}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
            markedPages.has(pageNumber)
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-lg shadow-cyan-500/20 active:scale-[0.98]"
          }`}
        >
          {markedPages.has(pageNumber) ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Marked Read
            </>
          ) : (
            "Mark as Read & Next"
          )}
        </button>
      </footer>
    </div>
  );
}
