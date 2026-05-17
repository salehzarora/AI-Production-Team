import { Link } from 'react-router-dom';
import { PlusCircle, Trash2, ArrowRight, Sparkles } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { progressPct } from '../utils/project';
import { TARGET_TOOL_LABELS } from '../types';

export default function Dashboard() {
  const { projects, remove } = useProjects();

  return (
    <div className="space-y-10">
      <section className="text-center pt-8 pb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-bg-border bg-bg-panel/60 text-xs text-slate-300 mb-5">
          <Sparkles className="w-3 h-3 text-accent-blue" />
          Frontend MVP · mock AI outputs
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-br from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          AI Production Team
        </h1>
        <p className="mt-3 text-slate-400 max-w-2xl mx-auto">
          Turn one video idea into a complete animation production package. Seven specialist agents work as a pipeline — script, characters, scenes, storyboard, prompts, consistency, marketing.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link to="/new" className="btn-primary px-6 py-3 text-base">
            <PlusCircle className="w-5 h-5" />
            New Production
          </Link>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Saved projects</h2>
          <span className="text-xs text-slate-500">{projects.length} stored locally</span>
        </div>

        {projects.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-slate-300">No projects yet. Start your first production above.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => {
              const pct = progressPct(p);
              return (
                <div key={p.id} className="card card-hover p-5 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate">{p.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {p.platform} · {p.style} · {p.duration}s
                      </div>
                      <div className="mt-2">
                        <span
                          className={`badge ${
                            (p.targetTool ?? 'general') === 'vidu'
                              ? 'border-accent-violet/40 text-accent-violet bg-accent-violet/10'
                              : 'border-bg-border text-slate-400 bg-bg-panel/50'
                          }`}
                        >
                          {TARGET_TOOL_LABELS[p.targetTool ?? 'general']}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Delete this project?')) remove(p.id);
                      }}
                      className="text-slate-500 hover:text-accent-pink transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                      <span>Progress</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-bg-panel rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent-blue to-accent-violet"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <Link
                    to={`/project/${p.id}`}
                    className="btn-ghost mt-auto justify-between"
                  >
                    <span>Open project</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
