"use client";

import clsx from 'clsx';

export function Skeleton({ className = "" }) {
  return (
    <div className={clsx("skeleton-shimmer rounded-[var(--r-control)]", className)} />
  );
}

export function FeedItemSkeleton() {
  return (
    <div className="py-4 space-y-3 border-b border-[var(--hairline)]">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full skeleton-shimmer flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="w-28 h-3.5 skeleton-shimmer rounded" />
          <div className="w-20 h-2.5 skeleton-shimmer rounded" />
        </div>
      </div>
      <div className="space-y-2 pt-1">
        <div className="w-full h-3.5 skeleton-shimmer rounded" />
        <div className="w-4/5 h-3.5 skeleton-shimmer rounded" />
        <div className="w-2/3 h-3.5 skeleton-shimmer rounded" />
      </div>
      <div className="flex items-center space-x-6 pt-2">
        <div className="w-12 h-6 skeleton-shimmer rounded-full" />
        <div className="w-12 h-6 skeleton-shimmer rounded-full" />
        <div className="w-12 h-6 skeleton-shimmer rounded-full" />
      </div>
    </div>
  );
}

export function ListCardSkeleton() {
  return (
    <div className="p-4 rounded-[var(--r-card)] bg-[var(--surface-1)] border border-[var(--hairline)] space-y-3">
      <div className="flex justify-between items-start">
        <div className="w-1/2 h-4 skeleton-shimmer rounded" />
        <div className="w-16 h-3 skeleton-shimmer rounded" />
      </div>
      <div className="space-y-2">
        <div className="w-full h-3.5 skeleton-shimmer rounded" />
        <div className="w-3/4 h-3.5 skeleton-shimmer rounded" />
      </div>
      <div className="w-24 h-3 skeleton-shimmer rounded pt-1" />
    </div>
  );
}
