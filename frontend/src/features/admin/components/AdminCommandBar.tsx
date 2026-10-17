import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Building2,
  Users,
  Briefcase,
  X,
  ExternalLink,
  Loader2,
  ArrowRight,
  Command,
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import apiClient from '../../../api/client';

interface AdminCommandBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminCommandBar: React.FC<AdminCommandBarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ tenants: any[]; users: any[]; projects: any[] }>({
    tenants: [],
    users: [],
    projects: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ tenants: [], users: [], projects: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults({ tenants: [], users: [], projects: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const res = await apiClient.get(`/v1/admin/search?q=${encodeURIComponent(query.trim())}`);
        if (res.data?.success && res.data.data) {
          setResults(res.data.data);
        }
      } catch (err) {
        console.error('Failed to search admin resources:', err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalHits = results.tenants.length + results.users.length + results.projects.length;

  const handleSelectTenant = (tenantId: string) => {
    onClose();
    navigate(`/admin/tenants/${tenantId}`);
  };

  const handleSelectUser = () => {
    onClose();
    navigate('/admin/users');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-brand-evergreen/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="mx-auto max-w-2xl transform overflow-hidden rounded-2xl bg-surface-card border border-border/80 shadow-2xl transition-all relative z-10 flex flex-col">
        {/* Search Input Box */}
        <div className="relative flex items-center px-4 py-3 border-b border-border/80 bg-surface-low/30">
          <Search className="w-5 h-5 text-brand-emerald shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across all tenants, users, and initiatives (e.g. acme, john@foo)..."
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-brand-emerald animate-spin shrink-0" />
          ) : query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-text-muted hover:text-text-primary p-1"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-surface-low text-text-muted border border-border/80">
              ESC
            </kbd>
          )}
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-3 flex flex-col gap-3">
          {query.trim().length >= 2 && totalHits === 0 && !isLoading && (
            <div className="py-12 text-center text-xs text-text-muted">
              No matching tenants, users, or projects found for &quot;{query}&quot;.
            </div>
          )}

          {query.trim().length < 2 && (
            <div className="py-8 text-center text-xs text-text-muted">
              Type at least 2 characters to search across platform fleets.
            </div>
          )}

          {/* Tenants Section */}
          {results.tenants.length > 0 && (
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted px-2 mb-1 block">
                Organizations &amp; Fleets ({results.tenants.length})
              </span>
              <div className="flex flex-col gap-1">
                {results.tenants.map((t) => (
                  <div
                    key={t.tenantId}
                    onClick={() => handleSelectTenant(t.tenantId)}
                    className="p-2.5 rounded-xl hover:bg-surface-low/60 flex items-center justify-between cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-brand-emerald/10 text-brand-emerald">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-text-primary block group-hover:text-brand-emerald">
                          {t.name}
                        </span>
                        <span className="text-[10px] font-mono text-text-muted">
                          {t.slug}.worksphere.app &bull; {t.tenantId}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={t.status === 'active' ? 'completed' : 'pending'} size="sm">
                        {t.status}
                      </Badge>
                      <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-brand-emerald group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Users Section */}
          {results.users.length > 0 && (
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted px-2 mb-1 block">
                Platform Seat Users ({results.users.length})
              </span>
              <div className="flex flex-col gap-1">
                {results.users.map((u) => (
                  <div
                    key={u.userId}
                    onClick={handleSelectUser}
                    className="p-2.5 rounded-xl hover:bg-surface-low/60 flex items-center justify-between cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-text-primary block group-hover:text-blue-600">
                          {u.name}
                        </span>
                        <span className="text-[10px] font-mono text-text-muted">
                          {u.email} &bull; Fleet: {u.tenantId}
                        </span>
                      </div>
                    </div>
                    <Badge variant="neutral" size="sm">
                      {u.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects Section */}
          {results.projects.length > 0 && (
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted px-2 mb-1 block">
                Initiative Projects ({results.projects.length})
              </span>
              <div className="flex flex-col gap-1">
                {results.projects.map((p) => (
                  <div
                    key={p.projectId}
                    onClick={() => handleSelectTenant(p.tenantId)}
                    className="p-2.5 rounded-xl hover:bg-surface-low/60 flex items-center justify-between cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-text-primary block group-hover:text-purple-600">
                          {p.name}
                        </span>
                        <span className="text-[10px] font-mono text-text-muted">
                          {p.projectId} &bull; Fleet: {p.tenantId}
                        </span>
                      </div>
                    </div>
                    <Badge variant="neutral" size="sm">
                      {p.methodology}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border/80 bg-surface-low/40 flex items-center justify-between text-[11px] text-text-muted">
          <span>Global Cross-Tenant Inspection</span>
          <span className="font-mono text-[10px]">ESC to close</span>
        </div>
      </div>
    </div>
  );
};

export default AdminCommandBar;
