export default function ProjectCard({ project, onClick }) {
  const memberCount = project.members?.length || 1;
  const deadline = project.deadline
    ? new Date(project.deadline).toLocaleDateString()
    : null;

  return (
    <div className="card" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <h3>{project.name}</h3>
        <span className="badge badge-active">{project.status}</span>
      </div>
      {project.description && (
        <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0', fontSize: '0.9rem' }}>
          {project.description}
        </p>
      )}
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        {memberCount} member{memberCount !== 1 ? 's' : ''}
        {deadline && ` · Due ${deadline}`}
        {project.projectDuration > 0 && ` · ${project.projectDuration}d duration`}
      </div>
    </div>
  );
}
