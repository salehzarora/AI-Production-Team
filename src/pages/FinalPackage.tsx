import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { useProject } from '../hooks/useProject';
import { AGENTS } from '../data/agents';
import OutputPanel from '../components/OutputPanel';
import CopyButton from '../components/CopyButton';
import type { AgentId } from '../types';

export default function FinalPackage() {
  const { id } = useParams();
  const { project, loading } = useProject(id);

  if (loading) return <div className="text-slate-400">Loading...</div>;
  if (!project) {
    return (
      <div className="card p-10 text-center">
        <p className="text-slate-300">Project not found.</p>
        <Link to="/" className="btn-ghost mt-4 inline-flex">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  function exportJson() {
    if (!project) return;
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const sections: { agentId: AgentId; title: string }[] = [
    { agentId: 'script', title: 'Script' },
    { agentId: 'character', title: 'Character Bible' },
    { agentId: 'scene', title: 'Scene Bible' },
    { agentId: 'storyboard', title: 'Storyboard' },
    { agentId: 'prompt', title: 'Prompts by Shot' },
    { agentId: 'consistency', title: 'Consistency Checklist' },
    { agentId: 'marketing', title: 'Marketing Package' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            to={`/project/${project.id}`}
            className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" /> Back to workflow
          </Link>
          <h1 className="text-3xl font-bold mt-1">Final Package</h1>
          <div className="text-sm text-slate-400 mt-0.5">
            {project.platform} · {project.style} · {project.duration}s
          </div>
        </div>
        <button onClick={exportJson} className="btn-primary">
          <Download className="w-4 h-4" />
          Export JSON
        </button>
      </div>

      <div className="card p-5 bg-bg-panel/40 flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="section-title mb-1.5">Original idea</div>
          <p className="text-slate-200 leading-relaxed">{project.idea}</p>
        </div>
        <CopyButton text={project.idea} variant="soft" />
      </div>

      {sections.map((s) => {
        const step = project.steps.find((st) => st.agentId === s.agentId);
        if (!step?.output) {
          return (
            <section key={s.agentId} className="card p-5">
              <h2 className="text-lg font-semibold mb-1">{s.title}</h2>
              <p className="text-sm text-slate-400">
                Not yet generated. Run the {AGENTS[s.agentId].name} in the workflow.
              </p>
            </section>
          );
        }
        return (
          <section key={s.agentId} className="card p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{s.title}</h2>
              <CopyButton
                text={JSON.stringify(step.output, null, 2)}
                label="Copy JSON"
                variant="soft"
              />
            </div>
            <OutputPanel agentId={s.agentId} output={step.output} editable={false} />
          </section>
        );
      })}
    </div>
  );
}
