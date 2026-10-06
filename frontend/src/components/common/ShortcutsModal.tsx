import React from 'react';
import { Keyboard } from 'lucide-react';
import { Modal } from '../ui/Modal';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  items: Array<{
    description: string;
    keys: string[];
  }>;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const shortcutGroups: ShortcutGroup[] = [
    {
      title: 'Global Navigation & Search',
      items: [
        { description: 'Open Universal Command Palette', keys: ['⌘ / Ctrl', 'K'] },
        { description: 'Open Keyboard Shortcuts Guide', keys: ['?'] },
        { description: 'Close any modal, drawer, or dialog', keys: ['Esc'] },
      ],
    },
    {
      title: 'Quick Navigation (Press in sequence)',
      items: [
        { description: 'Navigate to Executive Dashboard', keys: ['G', 'D'] },
        { description: 'Navigate to Project Portfolio', keys: ['G', 'P'] },
        { description: 'Navigate to Deliverables & Tasks', keys: ['G', 'T'] },
        { description: 'Navigate to Sprints & Agile', keys: ['G', 'S'] },
        { description: 'Navigate to Timesheet Tracking', keys: ['G', 'C'] },
        { description: 'Navigate to Organization Settings', keys: ['G', 'O'] },
      ],
    },
    {
      title: 'Work & Delivery Actions',
      items: [
        { description: 'Create new project deliverable', keys: ['C'] },
        { description: 'Execute selected command item', keys: ['Enter'] },
        { description: 'Cancel quick inline action', keys: ['Esc'] },
      ],
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      description="Accelerate your workflow with quick keybindings"
      icon={<Keyboard className="w-4 h-4 text-brand-emerald" />}
      maxWidth="lg"
    >
      <div className="flex flex-col gap-6 py-1">
        {shortcutGroups.map((group) => (
          <div key={group.title} className="flex flex-col gap-2.5">
            <h4 className="text-[11px] font-bold font-mono uppercase tracking-wider text-text-muted">
              {group.title}
            </h4>
            <div className="divide-y divide-border/60 rounded-xl border border-border/80 bg-surface-low/30 overflow-hidden">
              {group.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3.5 py-2.5 hover:bg-surface-card transition-colors"
                >
                  <span className="text-xs text-text-primary font-medium">
                    {item.description}
                  </span>
                  <div className="flex items-center gap-1">
                    {item.keys.map((k, kIdx) => (
                      <kbd
                        key={kIdx}
                        className="px-2 py-0.5 text-[10px] font-mono font-semibold text-text-primary bg-surface-card border border-border/90 rounded shadow-2xs min-w-[20px] text-center"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default ShortcutsModal;
