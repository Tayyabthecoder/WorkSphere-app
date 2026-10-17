import { useState, useEffect } from 'react';

/**
 * Returns the id of the section currently most visible in the viewport.
 * Uses IntersectionObserver for efficiency.
 */
export function useActiveSection(sectionIds: string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!sectionIds.length) return;

    const visibleSections = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleSections.set(entry.target.id, entry.intersectionRatio);
          } else {
            visibleSections.delete(entry.target.id);
          }
        });

        // Pick section with highest intersection or the first matching visible
        if (visibleSections.size > 0) {
          // Find first section in sectionIds order that is currently visible
          const firstVisible = sectionIds.find((id) => visibleSections.has(id));
          if (firstVisible) {
            setActiveId(firstVisible);
          }
        }
      },
      {
        rootMargin: '-10% 0px -65% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [sectionIds]);

  return activeId;
}
