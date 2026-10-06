import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Global two-key chord keyboard navigation inspired by Fernly & GitHub:
 * 'G' then 'D' -> /dashboard
 * 'G' then 'T' -> /tasks
 * 'G' then 'C' -> /calendar
 * 'G' then 'R' -> /reports
 * 'G' then 'S' -> /settings
 * 'G' then 'P' -> /projects
 */
export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const leaderKeyRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing inside an input, textarea, or contentEditable element
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      if (leaderKeyRef.current === 'g') {
        leaderKeyRef.current = null;
        if (timerRef.current) clearTimeout(timerRef.current);

        switch (key) {
          case 'd':
            e.preventDefault();
            navigate('/dashboard');
            break;
          case 't':
            e.preventDefault();
            navigate('/tasks');
            break;
          case 'c':
            e.preventDefault();
            navigate('/calendar');
            break;
          case 'r':
            e.preventDefault();
            navigate('/reports');
            break;
          case 's':
            e.preventDefault();
            navigate('/settings');
            break;
          case 'p':
            e.preventDefault();
            navigate('/projects');
            break;
          default:
            break;
        }
        return;
      }

      if (key === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        leaderKeyRef.current = 'g';
        if (timerRef.current) clearTimeout(timerRef.current);
        // Leader key window expires after 1 second
        timerRef.current = setTimeout(() => {
          leaderKeyRef.current = null;
        }, 1000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [navigate]);
}

export default useKeyboardShortcuts;
