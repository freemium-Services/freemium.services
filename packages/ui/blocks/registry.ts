import React from 'react';
import { BlockData } from './types';

// Registry of block types to their React components
// Components will be imported once implemented
export const blockRegistry: Record<string, React.ComponentType<any>> = {
  hero: React.lazy(() => import('./hero')),
  faq: React.lazy(() => import('./faq')),
  tool_grid: React.lazy(() => import('./tool-grid')),
  workflow: React.lazy(() => import('./workflow')),
  operational_specs: React.lazy(() => import('./operational-specs')),
};

export interface BlockRendererProps {
  block: BlockData;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({ block }) => {
  const Component = blockRegistry[block.type];

  if (!Component) {
    console.warn(`Block type "${block.type}" not found in registry.`);
    return null;
  }

  return (
    <React.Suspense fallback={<div className="animate-pulse bg-white/5 h-40 rounded-3xl" />}>
      <Component {...block} />
    </React.Suspense>
  );
};
