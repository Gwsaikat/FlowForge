import { useEffect, useState } from 'react';
import { getProjectDeadline } from '../services/projectService.js';
import { format, differenceInDays } from 'date-fns';
import { Calendar, Target, Clock, AlertTriangle } from 'lucide-react';

export default function DeadlineWidget({ deadline, projectDuration }) {
  if (!deadline) return null;

  const targetDate = new Date(deadline);
  const diffDays = differenceInDays(targetDate, new Date());
  const buffer = diffDays - projectDuration;

  let driftColor = 'var(--success)';
  let StatusIcon = CheckCircle;
  if (buffer < 0) {
    driftColor = 'var(--danger)';
    StatusIcon = AlertTriangle;
  } else if (buffer <= 3) {
    driftColor = 'var(--warning)';
    StatusIcon = AlertTriangle;
  }

  return (
    <div className="deadline-widget">
      <div className="deadline-stat">
        <div className="deadline-label"><Target size={12} style={{ display: 'inline', marginRight: 4 }} /> Target Deadline</div>
        <div className="deadline-value">{format(targetDate, 'MMM d, yyyy')}</div>
        <div className="deadline-date">{diffDays} days from now</div>
      </div>
      <div className="deadline-stat">
        <div className="deadline-label"><Clock size={12} style={{ display: 'inline', marginRight: 4 }} /> Target vs Actual</div>
        <div className="deadline-value" style={{ color: driftColor }}>
          {buffer >= 0 ? '+' : ''}{buffer} days
        </div>
        <div className="deadline-drift" style={{ color: driftColor }}>
          <StatusIcon size={12} />
          {buffer < 0 ? 'Projected to miss deadline' : 'On track for deadline'}
        </div>
      </div>
    </div>
  );
}

function CheckCircle({ size }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
}
