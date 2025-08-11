export const metadata = {
  title: "Anime Site",
  description: "Streaming legal dengan data statis JSON"
};

import "./globals.css";

function ThemeToggle(){
  return (
    <button
      className="ml-auto px-3 py-1.5 rounded-lg text-sm bg-white/90 hover:bg-white border shadow-soft text-slate-800 dark:bg-slate-800 dark:text-white dark:border-slate-700"
      onClick={() => {
        const html = document.documentElement;
        const next = html.classList.contains("dark") ? "light" : "dark";
        html.classList.toggle("dark", next === "dark");
        try { localStorage.setItem("theme", next); } catch {}
      }}
    >
      🌓 Theme
    </button>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{__html:`
          (function(){
            try{
              var t = localStorage.getItem('theme');
              if(!t){ t = (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); }
              if(t==='dark') document.documentElement.classList.add('dark');
            }catch(e){}
          })();`
        }}/>
      </head>
      <body>
        <header className="bg-gradient-to-r from-brand-500 to-blue-400 text-white shadow-soft dark:from-slate-900 dark:to-slate-800">
          <div className="max-w-6xl mx-auto p-4 flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold">🎞️ Anime Stream</h1>
              <p className="text-white/80 text-sm">Demo auto-generate halaman dari datavideo.json</p>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="max-w-6xl mx-auto p-6">{children}</main>
        <footer className="py-8 text-center text-sm opacity-60">© 2025</footer>
      </body>
    </html>
  );
}
