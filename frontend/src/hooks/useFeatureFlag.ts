import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import apiClient from '../api/client';

export const useFeatureFlag = (flagName: string): boolean => {
  const [enabled, setEnabled] = useState(true);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const checkFlag = async () => {
      try {
        const res = await apiClient.get('/v1/organization');
        if (res.data?.success && res.data.data?.settings?.featureFlags) {
          const flags = res.data.data.settings.featureFlags;
          if (flags[flagName] !== undefined) {
            setEnabled(!!flags[flagName]);
          }
        }
      } catch {
        // Fallback default true
      }
    };

    if (user?.tenantId) {
      checkFlag();
    }
  }, [flagName, user?.tenantId]);

  return enabled;
};

export default useFeatureFlag;
