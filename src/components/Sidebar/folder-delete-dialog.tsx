import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderTitle: string;
  onDelete: (mode: "cascade" | "orphan") => void;
  isLoading?: boolean;
}

export function FolderDeleteDialog({
  open,
  onOpenChange,
  folderTitle,
  onDelete,
  isLoading,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete &ldquo;{folderTitle}&rdquo;</DialogTitle>
        </DialogHeader>

        <DialogDescription>
          This folder contains decks or sub-folders. How would you like to handle its contents?
        </DialogDescription>

        <Separator />

        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            disabled={isLoading}
            onClick={() => onDelete("orphan")}
            className="justify-start"
          >
            Delete folder only — move contents to top level
          </Button>

          <Button
            variant="destructive"
            disabled={isLoading}
            onClick={() => onDelete("cascade")}
            className="justify-start"
          >
            Delete folder and all its contents
          </Button>
        </div>

        <Separator />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            CANCEL
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
