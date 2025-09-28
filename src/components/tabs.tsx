import React from "react";
import {
  Tabs as TabsPrimitive,
  TabsContent,
  TabsTrigger,
  TabsList,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Props {
  tabs: any[];
  className?: string;
}

const Tabs = ({ tabs, className }: Props) => {
  return (
    <TabsPrimitive
      defaultValue="account"
      className={cn("w-[400px]", className)}
    >
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger value={tab.id}>{tab.label}</TabsTrigger>
        ))}
      </TabsList>
    </TabsPrimitive>
  );
};

export default Tabs;
