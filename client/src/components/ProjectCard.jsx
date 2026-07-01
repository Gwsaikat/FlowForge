import { useNavigate } from 'react-router-dom';
import { Calendar, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProjectCard({ project, index = 0 }) {
  const navigate = useNavigate();

  return (
    <motion.div 
      className="project-card card" 
      onClick={() => navigate(`/project/${project._id}`)}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="project-card-top">
        <h3>{project.name}</h3>
        {project.status === 'active' && (
          <span className="badge badge-active">Active</span>
        )}
      </div>
      <p className="project-card-desc">{project.description || 'No description provided.'}</p>
      <div className="flex justify-between items-center mt-auto">
        <div className="flex gap-3">
          <div className="flex items-center gap-1 project-card-meta">
            <Calendar size={14} />
            <span>
              {new Date(project.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          <div className="flex items-center gap-1 project-card-meta">
            <Users size={14} />
            <span>{project.members?.length || 0}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
