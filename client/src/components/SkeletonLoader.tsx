export function CardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div className="h-6 w-32 skeleton" />
        <div className="h-6 w-16 skeleton rounded-full" />
      </div>
      <div className="h-10 w-48 skeleton mt-4" />
      <div className="h-4 w-full skeleton" />
      <div className="flex justify-between pt-4 border-t border-teal-800/30">
        <div className="h-4 w-24 skeleton" />
        <div className="h-4 w-24 skeleton" />
      </div>
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="glass-card p-4 flex gap-4 items-center">
      <div className="h-12 w-12 skeleton rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-5 w-3/4 skeleton" />
        <div className="h-4 w-1/2 skeleton" />
      </div>
      <div className="h-8 w-16 skeleton shrink-0" />
    </div>
  );
}

export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className="h-4 skeleton" 
          style={{ width: i === lines - 1 ? '70%' : '100%' }} 
        />
      ))}
    </div>
  );
}
