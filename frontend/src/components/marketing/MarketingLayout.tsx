import React from 'react';
import { Outlet } from 'react-router-dom';
import MarketingHeader from './MarketingHeader';
import MarketingFooter from './MarketingFooter';

interface MarketingLayoutProps {
  children?: React.ReactNode;
}

export const MarketingLayout: React.FC<MarketingLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 font-sans selection:bg-[#64F9BC] selection:text-[#003629]">
      <MarketingHeader />
      <main className="flex-1">
        {children || <Outlet />}
      </main>
      <MarketingFooter />
    </div>
  );
};

export default MarketingLayout;
