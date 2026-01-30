import { Card } from '@/app/components/ui/card';
import { Skeleton } from '@/app/components/ui/skeleton';

export function LoadingQuotes() {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 animate-pulse">
        <div className="h-6 bg-blue-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-blue-200 rounded w-1/2"></div>
      </div>

      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <Skeleton className="h-6 w-48 mb-2" />
              <div className="flex gap-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-10 w-20" />
          </div>
          
          <div className="space-y-2 mb-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          <Skeleton className="h-10 w-full" />
        </Card>
      ))}

      <div className="text-center text-sm text-gray-500 animate-pulse">
        ⏱️ Esperando cotizaciones...
      </div>
    </div>
  );
}
