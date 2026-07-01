import { useEffect, useState } from 'react';
import { getProjectHealth } from '../services/projectService.js';
import { useGraphStore } from '../store/useGraphStore.js';
import { tasksToGraph } from '../utils/graphLayout.js';

export default function GraphHealthPanel({ projectId, onClose }) {
  const [report, setReport] = useState(null);
  const setTasks = useGraphStore((s) => s.setTasks);
  const tasks = useGraphStore((s) => s.tasks);

  useEffect(() => {
    getProjectHealth(projectId).then(setReport).catch(() => {});
  }, [projectId]);

  function highlightInGraph() {
    if (!report) return;
    const highlightEdges = report.redundantEdges || [];
    const highlightNodes = [
      ...(report.godTasks || []).map((g) => g.taskId),
      ...(report.orphanedTasks || []).map((o) => o.taskId),
    ];
    const { nodes, edges } = tasksToGraph(tasks, highlightEdges, highlightNodes);
    useGraphStore.setState({ nodes, edges });
  }

  if (!report) return <div className="panel"><div className="spinner" /></div>;

  return (
    <div className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h3>Graph Health Report</h3>
        <button className="btn btn-secondary" onClick={onClose}>×</button>
      </div>
      <div style={{ fontSize: '1.5rem', margin: '1rem 0' }}>
        Health Score: {report.healthScore}/100 {report.totalSmells > 0 ? '⚠️' : '✅'}
      </div>

      {report.redundantEdges?.length > 0 && (
        <section style={{ marginBottom: 12 }}>
          <h4>Redundant Edges ({report.redundantEdges.length})</h4>
          {report.redundantEdges.map((e, i) => (
            <p key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>⚠️ {e.reason}</p>
          ))}
        </section>
      )}

      {report.godTasks?.length > 0 && (
        <section style={{ marginBottom: 12 }}>
          <h4>God Tasks ({report.godTasks.length})</h4>
          {report.godTasks.map((g) => (
            <p key={g.taskId} style={{ fontSize: '0.85rem' }}>🔴 &quot;{g.title}&quot; has {g.dependentCount} dependents</p>
          ))}
        </section>
      )}

      {report.orphanedTasks?.length > 0 && (
        <section style={{ marginBottom: 12 }}>
          <h4>Orphaned Tasks ({report.orphanedTasks.length})</h4>
          {report.orphanedTasks.map((o) => (
            <p key={o.taskId} style={{ fontSize: '0.85rem' }}>⚪ &quot;{o.title}&quot; has no connections</p>
          ))}
        </section>
      )}

      {report.longChains?.length > 0 && (
        <section style={{ marginBottom: 12 }}>
          <h4>Long Chains ({report.longChains.length})</h4>
          {report.longChains.map((c, i) => (
            <p key={i} style={{ fontSize: '0.85rem' }}>⚠️ Chain of {c.length} tasks ({c.chainDuration} days)</p>
          ))}
        </section>
      )}

      <button className="btn btn-primary" onClick={highlightInGraph}>Highlight in Graph</button>
    </div>
  );
}
