import React from 'react';
import MarketingLayout from '../../components/marketing/MarketingLayout';
import HeroSection from '../../components/marketing/home/HeroSection';
import StatsSection from '../../components/marketing/home/StatsSection';
import CoreFeaturesBento from '../../components/marketing/home/CoreFeaturesBento';
import MethodologySwitcher from '../../components/marketing/home/MethodologySwitcher';
import TestimonialsSection from '../../components/marketing/home/TestimonialsSection';
import LatestBlogsSection from '../../components/marketing/home/LatestBlogsSection';
import CtaBanner from '../../components/marketing/home/CtaBanner';

export const HomePage: React.FC = () => {
  return (
    <MarketingLayout>
      <HeroSection />
      <StatsSection />
      <CoreFeaturesBento />
      <MethodologySwitcher />
      <TestimonialsSection />
      <LatestBlogsSection />
      <CtaBanner />
    </MarketingLayout>
  );
};

export default HomePage;
