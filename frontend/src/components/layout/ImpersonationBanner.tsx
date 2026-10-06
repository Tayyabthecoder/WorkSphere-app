import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldAlert, LogOut, Loader2 } from 'lucide-react';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store/auth';

export const ImpersonationBanner: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const [token, setToken] = useState<string | null>(null);
  const [isEnding, setIsEnding] = useState(false);

  useEffect(() => {
    // Check URL query param first
    const urlToken = searchParams.get('impersonationToken');
    if (urlToken) {
      sessionStorage.setItem('active_impersonation_token', urlToken);
      setToken(urlToken);
      return;
    }

    // Check sessionStorage
    const stored = sessionStorage.getItem('active_impersonation_token');
    if (stored) {
      setToken(stored);
      return;
    }

    // Check auth store
    if ((user as any)?.isImpersonated) {
      setToken('active');
    }
  }, [searchParams, user]);

  if (!token) return null;

  const handleEndSession = async () => {
    try {
      setIsEnding(true);
      await apiClient.post('/admin/impersonate/end').catch(() => {});
    } finally {
      sessionStorage.removeItem('active_impersonation_token');
      setToken(null);
      setIsEnding(false);
      navigate('/admin');
    }
  };

  return (
    <div
      className="w-full bg-rose-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md z-50 sticky top-0"
      role="alert"
    >
      <div className="flex items-center gap-2 max-w-7xl mx-auto flex-1">
        <ShieldAlert className="w-4 h-4 text-rose-200 animate-pulse shrink-0" />
        <span className="tracking-wide">
          READ-ONLY INSPECTION MODE &bull; Viewing tenant workspace as Platform Super Admin.
        </span>
        <span className="text-[11px] font-mono text-rose-200 hidden sm:inline">
          (Data mutations blocked &bull; Session logged)
        </span>
      </div>

      <button
        type="button"
        onClick={handleEndSession}
        disabled={isEnding}
        className="flex items-center gap-1.5 px-3 py-1 bg-white text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-bold transition-all shadow-2xs shrink-0 cursor-pointer disabled:opacity-75"
      >
        {isEnding ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <LogOut className="w-3.5 h-3.5" />
        )}
        <span>Exit Session</span>
      </button>
    </div>
  );
};

export default ImpersonationBanner;
