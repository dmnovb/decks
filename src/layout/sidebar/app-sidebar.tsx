"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter as SidebarFooterPrimitive,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useDecks } from "@/providers/decks-provider";
import useDeleteDeck from "@/hooks/use-delete-deck";
import CreateNew from "./create-new";
import Link from "next/link";
import { SidebarFooter, SidebarItem } from "@/components/Sidebar";

export const AppSidebar = () => {
  const { isLoading, state } = useDecks();
  const { handleDelete } = useDeleteDeck();

  const { decks } = state;

  return (
    <Sidebar>
      <Link href="/">
        <SidebarHeader className="text-xl font-extrabold flex gap-2 p-4.5 border-b-1">
          DECK
        </SidebarHeader>
      </Link>

      <SidebarMenuItem className="border-b w-full list-none p-4">
        <CreateNew />
      </SidebarMenuItem>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            {!isLoading ? (
              <SidebarMenu>
                {decks?.map(({ id, title, description }) => (
                  <SidebarItem
                    id={id!}
                    title={title!}
                    description={description}
                    key={id}
                    onEvent={() => handleDelete(id!)}
                  />
                ))}
              </SidebarMenu>
            ) : (
              <SkeletonLoader />
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooterPrimitive>
        <SidebarFooter />
      </SidebarFooterPrimitive>
    </Sidebar>
  );
};

const SkeletonLoader = () => (
  <div className="flex items-center gap-2">
    <Skeleton className="h-[20px] w-[20px]" />

    <div className="flex flex-col flex-1 gap-2">
      <Skeleton className="h-[20px] w-1/2" />
      <Skeleton className="h-[15px] w-full" />
    </div>
  </div>
);
