"use client";

import { useState } from "react";
import { X, Book, User, Hash, FileText, UploadCloud, Loader2 } from "lucide-react";
import { db } from "@/lib/db";
import { pdfjs } from "react-pdf";

// Configure pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function AddBookModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [type, setType] = useState<'physical' | 'pdf'>('physical');
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setTitle(selectedFile.name.replace('.pdf', ''));
    setIsProcessing(true);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjs.getDocument(arrayBuffer).promise;
      setTotalPages(pdf.numPages.toString());
    } catch (error) {
      console.error("Error parsing PDF:", error);
      alert("Could not read PDF file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !totalPages) return;
    if (type === 'pdf' && !file) {
      alert("Please upload a PDF file.");
      return;
    }

    await db.books.add({
      title,
      author,
      totalPages: parseInt(totalPages, 10),
      createdAt: new Date(),
      type,
      file: type === 'pdf' ? file! : undefined,
      fileType: type === 'pdf' ? file!.type : undefined,
    });

    setType('physical');
    setTitle("");
    setAuthor("");
    setTotalPages("");
    setFile(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Add to Library</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => setType('physical')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                type === 'physical' ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Physical Book
            </button>
            <button
              type="button"
              onClick={() => setType('pdf')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
                type === 'pdf' ? 'bg-purple-500/20 text-purple-400 shadow-sm' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <FileText className="w-4 h-4" /> PDF
            </button>
          </div>

          {type === 'pdf' && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Upload PDF</label>
              <div className="relative">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="pdf-upload"
                />
                <label
                  htmlFor="pdf-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer hover:bg-slate-800/50 hover:border-purple-500/50 transition-all bg-slate-950"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {isProcessing ? (
                      <Loader2 className="w-8 h-8 text-purple-400 mb-2 animate-spin" />
                    ) : file ? (
                      <FileText className="w-8 h-8 text-purple-400 mb-2" />
                    ) : (
                      <UploadCloud className="w-8 h-8 text-slate-500 mb-2" />
                    )}
                    <p className="text-sm text-slate-300 font-medium">
                      {isProcessing ? "Analyzing PDF..." : file ? file.name : "Click to upload PDF"}
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Title</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Book className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                placeholder="The Pragmatic Programmer"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Author <span className="text-slate-500 font-normal">(Optional)</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                placeholder="David Thomas, Andrew Hunt"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Total Pages</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Hash className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="number"
                required
                min="1"
                value={totalPages}
                onChange={(e) => setTotalPages(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                placeholder="352"
              />
            </div>
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
              disabled={isProcessing}
              className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98] disabled:opacity-50"
            >
              Save Book
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
