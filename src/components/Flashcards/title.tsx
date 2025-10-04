import { ChangeEvent, FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Separator } from "@radix-ui/react-separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Flashcard } from "@/generated/prisma";
import useCreateFlashcard from "@/hooks/use-create-flashcard";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Mode } from "@/app/decks/[id]/page";
import { Badge } from "../ui/badge";


type FlashcardForm = Omit<Flashcard, 'id' | 'audioUrl' | 'deckId' | 'nextReview' | 'lastReviewed' | 'streak' | 'totalReviews' | 'correctReviews'>

interface TitleProps {
    title: string;
    deckId: string;
    onModeChange: (mode: Mode) => void;
    mode: Mode
    amount: number;
}

export function Title({ amount, title, deckId, onModeChange, mode }: TitleProps) {
    const { handleCreate, isLoading } = useCreateFlashcard()

    const [open, setOpen] = useState(false)
    const [values, setValues] = useState<Record<keyof FlashcardForm, string | null>>({
        back: '',
        front: '',
        notes: null,
        difficulty: null,
        interval: null,
        repetitions: null,
        easeFactor: null
    })

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setValues({ ...values, [e.target.name]: e.target.value })
    }

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        await handleCreate({ ...values, deckId } as unknown as Flashcard);
        setOpen(false);
        setValues({
            back: '',
            front: '',
            notes: null,
            difficulty: null,
            interval: null,
            repetitions: null,
            easeFactor: null
        });
    }

    return (
        <div className="flex justify-between">
            <div className="flex items-center gap-2">
                <span>{title}</span>
                <Badge variant="outline" className="m-0">
                    {amount || 0} Card{amount === 1 ? '' : 's'}
                </Badge>
            </div>

            <div className="flex flex-row gap-2">
                <Tabs value={mode} onValueChange={(value) => onModeChange(value as Mode)}>
                    <TabsList className="bg-background-2 border border-primary/20 p-1 h-9">
                        <TabsTrigger
                            value="normal"
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-semibold hover:bg-background-3 transition-all duration-200 px-3 py-1.5 text-sm font-medium rounded-md"
                        >
                            Normal Mode
                        </TabsTrigger>
                        <TabsTrigger
                            value="study"
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-semibold hover:bg-background-3 transition-all duration-200 px-3 py-1.5 text-sm font-medium rounded-md"
                        >
                            Study Mode
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>Create flashcard</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create new flashcard</DialogTitle>
                        </DialogHeader>

                        <DialogDescription>
                            Add a new flashcard to this deck. Enter the front and back content, plus any additional notes.
                        </DialogDescription>

                        <Separator />

                        <form
                            onSubmit={onSubmit}
                            className="flex flex-col gap-4"
                        >
                            <div className="flex flex-col gap-2">
                                <Label>Front</Label>
                                <Input
                                    name="front"
                                    onChange={(e) => handleChange(e)}
                                    className="w-full"
                                    placeholder="What's on the front of the card?"
                                    value={values.front!}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label>Back</Label>
                                <Input
                                    name="back"
                                    className="w-full"
                                    placeholder="What's on the back of the card?"
                                    onChange={(e) => handleChange(e)}
                                    value={values.back!}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label>Notes (optional)</Label>
                                <Input
                                    name="notes"
                                    className="w-full"
                                    placeholder="Any additional notes or context..."
                                    onChange={(e) => handleChange(e)}
                                    {...(values.notes && { notes: values.notes })}
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

            </div>
        </div>
    )
};
