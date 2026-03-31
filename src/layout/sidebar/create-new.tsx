"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import useCreateDeck from "@/hooks/use-create-deck";
import useCreateFolder from "@/hooks/use-create-folder";
import { ChevronDown, FolderPlus, BookText } from "lucide-react";
import React, { useState } from "react";

type DialogType = "deck" | "folder" | null;

const CreateNew = () => {
  const { handleCreate: handleCreateDeck, isLoading: isDeckLoading } = useCreateDeck();
  const { handleCreate: handleCreateFolder, isLoading: isFolderLoading } = useCreateFolder();

  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [deckValues, setDeckValues] = useState({ title: "", description: "" });
  const [folderValues, setFolderValues] = useState({ title: "", description: "" });

  const onSubmitDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleCreateDeck(deckValues);
    setActiveDialog(null);
    setDeckValues({ title: "", description: "" });
  };

  const onSubmitFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleCreateFolder(folderValues);
    setActiveDialog(null);
    setFolderValues({ title: "", description: "" });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="w-full justify-between gap-2 font-medium tracking-wide">
            <span>CREATE NEW</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={6}
          className="w-[--radix-dropdown-menu-trigger-width]"
        >
          <DropdownMenuItem
            onSelect={() => setActiveDialog("deck")}
            className="gap-2.5 cursor-pointer"
          >
            <BookText className="h-3.5 w-3.5 text-muted-foreground" />
            <div>
              <div className="text-[13px] font-medium">Deck</div>
              <div className="text-[11px] text-muted-foreground">Flashcard set</div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setActiveDialog("folder")}
            className="gap-2.5 cursor-pointer"
          >
            <FolderPlus className="h-3.5 w-3.5 text-muted-foreground" />
            <div>
              <div className="text-[13px] font-medium">Folder</div>
              <div className="text-[11px] text-muted-foreground">Group your decks</div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── Create Deck ─────────────────────────────── */}
      <Dialog
        open={activeDialog === "deck"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New deck</DialogTitle>
            <DialogDescription>
              A deck is a set of flashcards on a single topic.
            </DialogDescription>
          </DialogHeader>

          <Separator />

          <form onSubmit={onSubmitDeck} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Title</Label>
              <Input
                required
                autoFocus
                placeholder="e.g. Hiragana — vowel row"
                onChange={(e) => setDeckValues((prev) => ({ ...prev, title: e.target.value }))}
                value={deckValues.title}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>
                Description{" "}
                <span className="text-muted-foreground font-normal text-[12px]">optional</span>
              </Label>
              <Input
                placeholder="What will you study?"
                onChange={(e) =>
                  setDeckValues((prev) => ({ ...prev, description: e.target.value }))
                }
                value={deckValues.description}
              />
            </div>

            <Separator />

            <DialogFooter>
              <Button
                type="button"
                onClick={() => setActiveDialog(null)}
                variant="outline"
                disabled={isDeckLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button disabled={isDeckLoading} type="submit" className="flex-1">
                Create deck
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Create Folder ───────────────────────────── */}
      <Dialog
        open={activeDialog === "folder"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
            <DialogDescription>
              Folders group related decks together. You can nest folders inside folders.
            </DialogDescription>
          </DialogHeader>

          <Separator />

          <form onSubmit={onSubmitFolder} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Name</Label>
              <Input
                required
                autoFocus
                placeholder="e.g. Japanese"
                onChange={(e) =>
                  setFolderValues((prev) => ({ ...prev, title: e.target.value }))
                }
                value={folderValues.title}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>
                Description{" "}
                <span className="text-muted-foreground font-normal text-[12px]">optional</span>
              </Label>
              <Input
                placeholder="What's in this folder?"
                onChange={(e) =>
                  setFolderValues((prev) => ({ ...prev, description: e.target.value }))
                }
                value={folderValues.description}
              />
            </div>

            <Separator />

            <DialogFooter>
              <Button
                type="button"
                onClick={() => setActiveDialog(null)}
                variant="outline"
                disabled={isFolderLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button disabled={isFolderLoading} type="submit" className="flex-1">
                Create folder
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateNew;
