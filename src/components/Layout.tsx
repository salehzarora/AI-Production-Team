import { Link, NavLink, Outlet } from 'react-router-dom';
import { Sparkles, LayoutDashboard, PlusCircle } from 'lucide-react';

export default function Layout() {
  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-bg-border/60 backdrop-blur-md bg-bg-base/60 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-blue to-accent-violet shadow-glow grid place-items-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide">AI Production Team</div>
              <div className="text-[11px] text-slate-400 -mt-0.5">
                Idea → Animation Package
              </div>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `btn ${isActive ? 'bg-bg-border/70 text-white' : 'btn-ghost'}`
              }
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/new" className="btn-primary">
              <PlusCircle className="w-4 h-4" />
              <span>New Production</span>
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-bg-border/60 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4 text-xs text-slate-500 flex items-center justify-between">
          <span>AI Production Team · Frontend MVP · Mock outputs</span>
          <span>Local-only · No backend · localStorage</span>
        </div>
      </footer>
    </div>
  );
}
