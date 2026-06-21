"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Search, BookA, Loader2 } from "lucide-react";
import { API_URL } from "@/lib/config";

export default function Dictionary() {
  const dictionary = useLiveQuery(() => db.dictionary.orderBy('createdAt').reverse().toArray());
  const [word, setWord] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) return;

    // Check if word already exists in local db
    const existing = await db.dictionary.where("word").equalsIgnoreCase(word.trim()).first();
    if (existing) {
      setWord("");
      return; // Already in history
    }

    setIsSearching(true);
    try {
      const res = await fetch(`${API_URL}/ai/dictionary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: word.trim() })
      });
      
      const data = await res.json();
      if (data.definition) {
        await db.dictionary.add({
          word: word.trim().toLowerCase(),
          definition: data.definition,
          example: data.example || "",
          createdAt: new Date(),
        });
        setWord("");
      }
    } catch (error) {
      console.error("Failed to search dictionary", error);
      alert("Failed to fetch definition. Please check if backend is running.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <BookA className="text-rose-400 w-6 h-6" />
        <h2 className="text-2xl font-bold text-white">AI Dictionary</h2>
      </div>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-500" />
          </div>
          <input
            type="text"
            required
            value={word}
            onChange={(e) => setWord(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-4 pl-12 pr-16 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all text-lg"
            placeholder="Lookup a difficult word..."
          />
          <button 
            type="submit" 
            disabled={isSearching}
            className="absolute inset-y-2 right-2 px-4 bg-rose-500 hover:bg-rose-400 text-slate-900 font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Define"}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Recent Searches</h3>
        
        {dictionary === undefined ? (
          <div className="animate-pulse space-y-3">
            {[1,2].map(i => <div key={i} className="h-24 bg-slate-800/50 rounded-xl"></div>)}
          </div>
        ) : dictionary.length === 0 ? (
          <p className="text-slate-500 text-sm italic">No words looked up yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dictionary.map(entry => (
              <div key={entry.id} className="bg-slate-900 border border-slate-700/50 rounded-xl p-5">
                <h4 className="text-lg font-bold text-rose-400 capitalize mb-2">{entry.word}</h4>
                <p className="text-slate-300 text-sm leading-relaxed mb-3">{entry.definition}</p>
                {entry.example && (
                  <p className="text-slate-500 text-xs italic border-l-2 border-rose-500/30 pl-3">
                    "{entry.example}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
