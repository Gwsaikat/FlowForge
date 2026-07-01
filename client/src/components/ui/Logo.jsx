import { Link } from 'react-router-dom';

export default function Logo({ to = '/', size = 'md', onClick }) {
  const sizes = { sm: 'logo-sm', md: 'logo-md', lg: 'logo-lg' };
  const content = (
    <span className={`logo ${sizes[size]}`}>
      <span className="logo-mark">
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <rect width="32" height="32" rx="8" fill="url(#lg)" />
          <path d="M8 22V10h3v12H8zm6-8v8h3V14h-3zm6 4v4h3v-4h-3z" fill="white" />
          <defs>
            <linearGradient id="lg" x1="0" y1="0" x2="32" y2="32">
              <stop stopColor="#818CF8" />
              <stop offset="1" stopColor="#6366F1" />
            </linearGradient>
          </defs>
        </svg>
      </span>
      <span className="logo-text">FlowForge</span>
    </span>
  );

  if (onClick) {
    return (
      <button type="button" className="logo-btn" onClick={onClick}>
        {content}
      </button>
    );
  }

  return to ? <Link to={to} className="logo-link">{content}</Link> : content;
}
