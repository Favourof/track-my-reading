import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 selection:bg-cyan-500/30">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 md:mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Track My Reading
            </h1>
            <p className="text-slate-400 mt-2">Your personal journey through books.</p>
          </div>
        </header>

        <Dashboard />
      </div>
    </main>
  );
}
