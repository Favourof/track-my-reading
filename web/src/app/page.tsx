import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 md:mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">
              Track My Reading
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Your personal journey through books.</p>
          </div>
        </header>

        <Dashboard />
      </div>
    </main>
  );
}
