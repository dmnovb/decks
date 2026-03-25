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
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-1 px-4 py-4 sm:px-8 sm:py-5 border-b border-border shrink-0">
        <div className="text-sm font-semibold leading-[1.5]">
          {isLoading ? <Skeleton className="w-[150px] h-[25px] rounded-xs" /> : title}
        </div>
        {subTitle && (
          <span className="text-xs text-muted-foreground">
            {isLoading ? <Skeleton className="w-[100px] h-[15px] rounded-xs" /> : subTitle}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-8">{children}</div>
    </div>
  );
};

export default View;
