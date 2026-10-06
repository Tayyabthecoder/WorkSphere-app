import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  KanbanSquare,
  GanttChartSquare,
  Calendar,
  Table,
  Zap,
  Users,
} from 'lucide-react';

interface ProjectSubNavProps {
  projectId: string;
  methodology?: 'Agile' | 'Waterfall' | 'Hybrid' | 'Kanban' | string;
}

export const ProjectSubNav: React.FC<ProjectSubNavProps> = ({
  projectId,
  methodology = 'Agile',
}) => {
  const location = useLocation();
  const isAgileOrHybrid =
    methodology === 'Agile' || methodology === 'Hybrid' || !methodology;

  const basePath = `/projects/${projectId}`;

  const navItems = [
    {
      label: 'Overview',
      to: basePath,
      end: true,
      icon: LayoutDashboard,
    },
    {
      label: 'Kanban Board',
      to: `${basePath}/board`,
      end: false,
      icon: KanbanSquare,
    },
    {
      label: 'List / Table',
      to: `${basePath}/list`,
      end: false,
      icon: Table,
    },
    {
      label: 'Timeline (Gantt)',
      to: `${basePath}/timeline`,
      end: false,
      icon: GanttChartSquare,
    },
    {
      label: 'Calendar',
      to: `${basePath}/calendar`,
      end: false,
      icon: Calendar,
    },
    ...(isAgileOrHybrid
      ? [
          {
            label: 'Backlog & Sprints',
            to: `${basePath}/backlog`,
            end: false,
            icon: Zap,
          },
        ]
      : []),
    {
      label: 'Capacity',
      to: `${basePath}/capacity`,
      end: false,
      icon: Users,
    },
  ];

  return (
    <div className="flex items-center gap-1.5 border-b border-border/80 pb-2 overflow-x-auto no-scrollbar">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.end
          ? location.pathname === item.to
          : location.pathname.startsWith(item.to);

        return (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
              isActive
                ? 'text-brand-emerald bg-brand-emerald/10 font-semibold shadow-2xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-low'
            }`}
          >
            <Icon
              className={`w-3.5 h-3.5 ${
                isActive ? 'text-brand-emerald' : 'text-text-muted'
              }`}
            />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </div>
  );
};

export default ProjectSubNav;
