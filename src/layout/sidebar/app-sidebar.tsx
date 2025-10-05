"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter as SidebarFooterPrimitive,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useDecks } from "@/providers/decks-provider";
import { SidebarFooter, SidebarItem } from "@/components/Sidebar";
import { StarIcon } from '@/icons'
import { useRouter } from "next/navigation";

import useDeleteDeck from "@/hooks/use-delete-deck";
import CreateNew from "./create-new";
import Link from "next/link";

export const AppSidebar = () => {
  const { isLoading, state } = useDecks();
  const { handleDelete } = useDeleteDeck();
  const router = useRouter()

  const { decks } = state;

  return (
    <Sidebar>
      <SidebarContent className="gap-0">
        <SidebarHeader className="text-xl font-extrabold flex p-4 border-b">
          <Link href="/">DECK</Link>
        </SidebarHeader>

        <SidebarMenu>
          <SidebarMenuItem className="border-b w-full list-none p-4">
            <CreateNew />
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild onClick={() => router.push('/chat')}>
                <div className="cursor-pointer h-full flex items-center gap-2">
                  <StarIcon size={18} className="text-primary bg-primary/10 p-2 rounded-sm box-content" />
                  <div className="flex flex-col">
                    <span>Ask Ace</span>
                    <span className="text-[12px] antialiased text-muted">
                      Your language learning companion
                    </span>
                  </div>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Your Decks</SidebarGroupLabel>
          <SidebarGroupContent>
            {!isLoading ? (
              <SidebarMenu>
                {decks?.map(({ id, title, description }) => (
                  <SidebarMenuItem key={id}>
                    <SidebarItem
                      id={id!}
                      title={title!}
                      description={description}
                      onEvent={() => handleDelete(id!)}
                    />
                  </SidebarMenuItem>
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
