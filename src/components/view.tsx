"use client";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  title: string | React.ReactNode;
  subTitle?: string | React.ReactNode;
  children: React.ReactNode;
  isLoading?: boolean;
}

const View = ({ isLoading, children, title, subTitle }: Props) => {
  return (
    <div>
      <div className="flex flex-col gap-1">
        <span className="text-xl font-semibold">
          {isLoading ? <Skeleton className="w-[150px] h-[25px] rounded-xs" /> : title}
        </span>
        <span className="text-sm text-muted pb-4">
          {isLoading ? <Skeleton className="w-[100px] h-[15px] rounded-xs" /> : subTitle}
        </span>
      </div>
      {children}
    </div>
  );
};

export default View;
