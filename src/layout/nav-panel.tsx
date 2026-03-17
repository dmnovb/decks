"use client";

import { useDecks } from "@/providers/decks-provider";
import { useAuth } from "@/providers/auth-provider";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Plus, LogOut, ChevronRight, Trash } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState, FormEvent } from "react";
import useDeleteDeck from "@/hooks/use-delete-deck";

export function NavPanel() {
  const { state, isLoading, createDeck } = useDecks();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { decks } = state;
  const { handleDelete } = useDeleteDeck();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const openDialog = () => {
    setTitle("");
    setDescription("");
    setDialogOpen(true);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    const deck = await createDeck(title.trim(), description.trim() || undefined);
    setCreating(false);
    setDialogOpen(false);
    if (deck?.id) router.push(`/decks/${deck.id}`);
  };

  return (
    <div className="flex flex-col w-60 shrink-0 h-full bg-background-1 border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
          ALCOVE
        </span>
        <button
          onClick={openDialog}
          className="flex items-center justify-center w-6 h-6 rounded-sm text-muted-foreground hover:text-foreground hover:bg-background-2 transition-colors"
          title="New deck"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Deck list */}
      <div className="flex-1 overflow-y-auto py-2">
        {isLoading && (
          <div className="px-3 space-y-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 rounded-md bg-background-2 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && decks.length === 0 && (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-muted-foreground">No decks yet.</p>
            <button
              onClick={openDialog}
              className="text-xs text-foreground hover:underline mt-1 inline-block"
            >
              Create one
            </button>
          </div>
        )}

        {!isLoading &&
          decks.map((deck) => {
            const isActive = pathname === `/decks/${deck.id}`;
            return (
              <ContextMenu key={deck.id}>
                <ContextMenuTrigger asChild>
                  <Link
                    href={`/decks/${deck.id}`}
                    className={cn(
                      "flex items-center justify-between mx-2 px-2 py-1.5 rounded-md text-sm transition-colors duration-150 group",
                      isActive
                        ? "bg-background-2 text-foreground"
                        : "text-muted-foreground hover:bg-background-2/60 hover:text-foreground",
                    )}
                  >
                    <span className="truncate">{deck.title}</span>
                    <ChevronRight
                      size={12}
                      className={cn(
                        "shrink-0 transition-opacity",
                        isActive ? "opacity-60" : "opacity-0 group-hover:opacity-40",
                      )}
                    />
                  </Link>
                </ContextMenuTrigger>
                <ContextMenuContent className="bg-background-2 border-border">
                  <ContextMenuItem
                    onSelect={() => handleDelete(deck.id!)}
                    className="text-red-400 focus:text-red-400 cursor-pointer"
                  >
                    <Trash size={12} className="mr-2" />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
      </div>

      {/* Footer — user */}
      {user && (
        <div className="border-t border-border p-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full focus:outline-none">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-background-2 transition-colors cursor-pointer">
                <Avatar className="w-6 h-6 shrink-0">
                  <AvatarFallback className="text-[11px] font-semibold bg-background-3 text-foreground">
                    {user.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate flex-1 text-left">
                  {user.name}
                </span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" className="w-48 bg-background-2 border-border">
              <DropdownMenuItem
                onClick={logout}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <LogOut size={12} className="mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New deck</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4 pt-1">
            <div className="flex flex-col gap-2">
              <Label>Title</Label>
              <Input
                autoFocus
                placeholder="e.g. Spanish Basics"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>
                Description <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                placeholder="What's this deck for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={!title.trim() || creating}>
              {creating ? "Creating…" : "Create deck"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
