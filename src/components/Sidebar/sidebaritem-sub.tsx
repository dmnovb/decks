import React from "react";
import { SidebarMenuSubButton, SidebarMenuSubItem } from "@/components/ui/sidebar";

interface Props {
  title?: string;
}

const SidebarItemSub = ({ title }: Props) => {
  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton>{title}</SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
};

export default SidebarItemSub;
