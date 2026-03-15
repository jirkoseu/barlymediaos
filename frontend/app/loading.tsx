// app/dashboard/loading.tsx
import { Skeleton } from "@/components/ui/skeleton"; // Příklad se Shadcn

export default function DashboardLoading() {
  // Zobrazí se uvnitř layout.tsx
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/2" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}