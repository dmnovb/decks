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
import { useFolders } from "@/providers/folders-provider";
import { SidebarFooter, SidebarItem } from "@/components/Sidebar";
import { SidebarFolderItem } from "@/components/Sidebar/sidebar-folder-item";
import { DragOverlayItem } from "@/components/Sidebar/drag-overlay-item";
import { StarIcon } from "@/icons";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import useDeleteDeck from "@/hooks/use-delete-deck";
import useDeleteFolder from "@/hooks/use-delete-folder";
import useMoveDeck from "@/hooks/use-move-deck";
import CreateNew from "./create-new";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Folder } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";

function RootDropZone({
  children,
  hasItems,
}: {
  children: React.ReactNode;
  hasItems: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: "root",
    data: { type: "root", folderId: null },
  });

  return (
    <div
      ref={setNodeRef}
      className={
        isOver && hasItems
          ? "rounded-sm ring-1 ring-inset ring-primary/25 bg-primary/5 transition-colors"
          : "transition-colors"
      }
    >
      {children}
    </div>
  );
}

export const AppSidebar = () => {
  const { isLoading: isDecksLoading, state: decksState } = useDecks();
  const { isLoading: isFoldersLoading, state: foldersState } = useFolders();
  const { handleDelete: handleDeleteDeck } = useDeleteDeck();
  const { handleDelete: handleDeleteFolder } = useDeleteFolder();
  const { handleMove } = useMoveDeck();
  const router = useRouter();

  const { decks } = decksState;
  const { folders } = foldersState;

  const isLoading = isDecksLoading || isFoldersLoading;

  const rootFolders = folders.filter((f) => !f.parentId);
  const rootDecks = decks.filter((d) => !d.folderId);
  const isEmpty = rootFolders.length === 0 && rootDecks.length === 0;

  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const activeDeck = activeDeckId ? decks.find((d) => d.id === activeDeckId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDeckId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeckId(null);

    if (!over) return;

    const deckId = active.id as string;
    const targetFolderId = (over.data.current?.folderId as string | null) ?? null;
    const currentDeck = decks.find((d) => d.id === deckId);

    // No-op if dropped in the same location
    if (currentDeck?.folderId === targetFolderId) return;

    handleMove(deckId, targetFolderId, currentDeck?.folderId);
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
                <SidebarMenuButton asChild onClick={() => router.push("/chat")}>
                  <div className="cursor-pointer h-full flex items-center gap-2">
                    <StarIcon
                      size={18}
                      className="text-primary bg-primary/10 p-2 rounded-sm box-content"
                    />
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
              {isEmpty && !isLoading && (
                <Empty className="p-0">
                  <EmptyHeader>
                    <EmptyMedia>
                      <Folder className="text-primary bg-primary/10 p-2 rounded-sm box-content" />
                    </EmptyMedia>
                    <EmptyTitle>No Decks Yet</EmptyTitle>
                    <EmptyDescription>
                      You haven&apos;t created any decks yet. Get started by creating your first
                      deck.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <div className="flex flex-col gap-2">
                      <CreateNew />
                      <Button variant="outline">Import Deck</Button>
                    </div>
                  </EmptyContent>
                </Empty>
              )}

              {!isLoading ? (
                <RootDropZone hasItems={rootDecks.length > 0 || rootFolders.length > 0}>
                  <SidebarMenu className="gap-0">
                    {rootFolders.map((folder) => (
                      <SidebarFolderItem
                        key={folder.id}
                        folder={folder}
                        allFolders={folders}
                        allDecks={decks}
                        onDeleteFolder={handleDeleteFolder}
                        onDeleteDeck={(id) => handleDeleteDeck(id)}
                      />
                    ))}
                    {rootDecks.map(({ id, title, description, tags }) => (
                      <SidebarItem
                        key={id}
                        id={id!}
                        title={title!}
                        description={description}
                        tags={tags}
                        onEvent={() => handleDeleteDeck(id!)}
                      />
                    ))}
                  </SidebarMenu>
                </RootDropZone>
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

      <DragOverlay dropAnimation={null}>
        {activeDeck ? <DragOverlayItem deck={activeDeck} /> : null}
      </DragOverlay>
    </DndContext>
  );
};

const SkeletonLoader = () => (
  <div className="flex items-center gap-2 px-2">
    <Skeleton className="h-[16px] w-[16px]" />
    <div className="flex flex-col flex-1 gap-2">
      <Skeleton className="h-[14px] w-1/2" />
      <Skeleton className="h-[12px] w-full" />
    </div>
  </div>
);
