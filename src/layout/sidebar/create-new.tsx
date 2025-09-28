import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import useCreateDeck from "@/hooks/use-create-deck";
import React, { useState } from "react";

const CreateNew = () => {
  const { handleCreate, isLoading } = useCreateDeck();

  const [values, setValues] = useState<{ title: string; description: string }>({
    title: "",
    description: "",
  });

  const [open, setOpen] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleCreate(values);
    setOpen(false);
    setValues({ title: "", description: "" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">CREATE NEW</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new deck</DialogTitle>
        </DialogHeader>

        <DialogDescription>
          Enter a name for your new flashcard deck. This will help you identify
          and organize your decks later.
        </DialogDescription>

        <Separator />

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Deck title</Label>
            <Input
              required
              className="w-full"
              onChange={(e) =>
                setValues((prev) => ({ ...prev, title: e.target.value }))
              }
              value={values.title}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Deck description</Label>
            <Input
              className="w-full"
              onChange={(e) =>
                setValues((prev) => ({ ...prev, description: e.target.value }))
              }
              value={values.description}
            />
          </div>

          <Separator />

          <DialogFooter className="w-full">
            <Button
              onClick={() => setOpen(false)}
              className="flex-1"
              variant="outline"
              disabled={isLoading}
            >
              CANCEL
            </Button>

            <Button disabled={isLoading} type="submit" className="flex-1">
              CONFIRM
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateNew;
