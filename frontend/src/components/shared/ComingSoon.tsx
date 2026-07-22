import React from 'react';
import Link from 'next/link';
import { CircuitBoard, Home } from 'lucide-react';

interface ComingSoonProps {
  feature: string;
  description: string;
}

export function ComingSoon({ feature, description }: ComingSoonProps) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 bg-navy text-text-primary">
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center animate-pulse">
          <CircuitBoard className="w-8 h-8 text-accent" />
        </div>
      </div>
      <h1 className="text-3xl font-display font-bold mb-3">
        {feature} <span className="text-accent">Coming Soon</span>
      </h1>
      <p className="text-text-secondary max-w-md mb-8 text-sm sm:text-base leading-relaxed">
        {description}
      </p>
      <div className="flex gap-4">
        <Link 
          href="/" 
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors text-sm"
        >
          <Home className="w-4 h-4" />
          <span>Go Home</span>
        </Link>
        <Link 
          href="/opportunities" 
          className="px-5 py-2.5 rounded-lg bg-accent text-navy font-semibold hover:bg-opacity-90 transition-colors text-sm"
        >
          Explore Opportunities
        </Link>
      </div>
      <p className="text-xs text-text-muted mt-8">
        This feature is dormant and will activate automatically when our community grows.
      </p>
    </div>
  );
}
export default ComingSoon;
