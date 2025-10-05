'use client'
import { Badge } from "../ui/badge";
import { Flashcard, Flashcard as FlashCardType } from "@/generated/prisma";
import { Separator } from "../ui/separator";
import useDeleteCard from "@/hooks/use-delete-flashcard";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { useState } from "react";
import { Button } from "../ui/button";
import { BarChart3, Calendar, Pause, Play, Save, Target, TrendingUp, X, Zap } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import DifficultyBadge from "../difficulty-badge";


export function FlashCard({ card }: { card: FlashCardType }) {
    const { handleDelete } = useDeleteCard()

    return (
        <FlashCardSheet card={card}>
            <div className="hover:cursor-pointer hover:border-divider-2 transition-all w-full max-w-sm p-4 flex flex-col gap-4 bg-background-1 border border-divider-1 rounded-sm">
                <div className="flex items-center gap-2">
                    <DifficultyBadge difficulty={card.difficulty} />
                </div>

                <Separator />

                <div className="p-16 text-center flex flex-col gap-4">
                    <span className="text-sm text-muted">
                        Front
                    </span>

                    <span>
                        {card.front}
                    </span>
                </div>

                <Separator />

                <div className="text-xs text-muted flex justify-between">
                    <div>
                        due {new Date(card.nextReview!).toDateString()}
                    </div>
                </div>
            </div>
        </FlashCardSheet>
    )
}

const FlashCardSheet = ({ card, children }: { card: FlashCardType, children: React.ReactNode }) => {
    const [isEditing, setIsEditing] = useState(false)
    const [isPlayingAudio, setIsPlayingAudio] = useState(false)
    const [editedCard, setEditedCard] = useState<FlashCardType | null>(null)

    if (!card) return null

    const currentCard = editedCard || card
    const accuracyRate = card.totalReviews > 0 ? Math.round((card.correctReviews / card.totalReviews) * 100) : 0

    console.log(card)

    const getDifficultyLabel = (difficulty: number) => {
        if (difficulty === 0) return "Blackout"
        if (difficulty <= 2) return "Hard"
        if (difficulty === 3) return "Good"
        if (difficulty === 4) return "Easy"
        return "Perfect"
    }

    const getDifficultyColor = (difficulty: number) => {
        if (difficulty === 0) return "bg-destructive/20 text-destructive-foreground border-destructive/40"
        if (difficulty <= 2) return "bg-accent/20 text-accent-foreground border-accent/40"
        if (difficulty === 3) return "bg-chart-2/20 text-chart-2 border-chart-2/40"
        return "bg-chart-2/30 text-chart-2 border-chart-2/50"
    }

    const handleSave = () => {
        if (editedCard) {
            // onSave(editedCard)
        }
        setIsEditing(false)
        setEditedCard(null)
    }

    const handleCancel = () => {
        setIsEditing(false)
        setEditedCard(null)
    }

    const startEditing = () => {
        setEditedCard({ ...card })
        setIsEditing(true)
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                {children}
            </SheetTrigger>

            <SheetContent className="w-full flex flex-col sm:max-w-xl overflow-y-auto border-none h-full">
                <SheetHeader>
                    <SheetTitle className="text-xl">Card Details</SheetTitle>
                </SheetHeader>

                <div className="flex-1 space-y-6 p-6 overflow-y-auto">
                    {/* Content Section */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="front" className="text-sm text-muted-foreground">
                                Front
                            </Label>
                            {isEditing ? (
                                <Input
                                    id="front"
                                    // value={currentCard.front}
                                    // onChange={(e) => setEditedCard({ ...currentCard, front: e.target.value })}
                                    className="min-h-[100px] bg-input border-border resize-none"
                                />
                            ) : (
                                <div className="p-4 bg-background-1 border border-divider-1 rounded-lg">
                                    <p className="text-lg text-balance">{currentCard.front}</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="back" className="text-sm text-muted-foreground">
                                Back
                            </Label>
                            {isEditing ? (
                                <Input
                                    id="back"
                                    // value={currentCard.back}
                                    // onChange={(e) => setEditedCard({ ...currentCard, back: e.target.value })}
                                    className="min-h-[100px] bg-input border-border resize-none"
                                />
                            ) : (
                                <div className="p-4 bg-background-1 border border-divider-1 rounded-lg">
                                    <p className="text-lg text-balance">{currentCard.back}</p>
                                </div>
                            )}
                        </div>

                        {(currentCard.notes || isEditing) && (
                            <div className="space-y-2">
                                <Label htmlFor="notes" className="text-sm text-muted-foreground">
                                    Notes
                                </Label>
                                {isEditing ? (
                                    <Input
                                        id="notes"
                                        // value={currentCard.notes || ""}
                                        // onChange={(e) => setEditedCard({ ...currentCard, notes: e.target.value })}
                                        placeholder="Add notes to help you remember..."
                                        className="min-h-[80px] bg-input border-border resize-none"
                                    />
                                ) : (
                                    <div className="p-4 bg-background-1 border border-divider-1 rounded-lg">
                                        <p className="text-sm text-muted-foreground text-pretty">{currentCard.notes}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {currentCard.audioUrl && (
                            <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">Audio</Label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                                    className="w-full"
                                >
                                    {isPlayingAudio ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                                    {isPlayingAudio ? "Pause" : "Play"} Audio
                                </Button>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Statistics Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Learning Statistics</h3>

                        {/* Current Status */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 bg-background-1 border border-divider-1 rounded-lg space-y-2">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Target className="h-4 w-4" />
                                    <span className="text-xs">Difficulty</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={getDifficultyColor(currentCard.difficulty)}>
                                        {getDifficultyLabel(currentCard.difficulty)}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">({currentCard.difficulty}/5)</span>
                                </div>
                            </div>

                            <div className="p-4 bg-background-1 border border-divider-1 rounded-lg space-y-2">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Zap className="h-4 w-4" />
                                    <span className="text-xs">Streak</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-semibold">{currentCard.streak}</span>
                                    <span className="text-xs text-muted-foreground">correct</span>
                                </div>
                            </div>
                        </div>

                        {/* Review Schedule */}
                        <div className="p-4 bg-background-1 border border-divider-1 rounded-lg space-y-3">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span className="text-xs font-medium">Review Schedule</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Interval</p>
                                    <p className="text-sm font-medium">
                                        {currentCard.interval} {currentCard.interval === 1 ? "day" : "days"}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Next Review</p>
                                    <p className="text-sm font-medium">
                                        {currentCard.nextReview ? new Date(currentCard.nextReview).toLocaleDateString() : "Not scheduled"}
                                    </p>
                                </div>
                            </div>
                            {currentCard.lastReviewed && (
                                <div className="pt-2 border-t border-border">
                                    <p className="text-xs text-muted-foreground">
                                        Last reviewed {new Date(currentCard.lastReviewed).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Performance Metrics */}
                        <div className="p-4 bg-background-1 border border-divider-1 rounded-lg space-y-3">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <BarChart3 className="h-4 w-4" />
                                <span className="text-xs font-medium">Performance</span>
                            </div>
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Accuracy</span>
                                        <span className="font-semibold">{accuracyRate}%</span>
                                    </div>
                                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                        <div className="h-full bg-chart-2 transition-all" style={{ width: `${accuracyRate}%` }} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3 pt-2">
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Total</p>
                                        <p className="text-lg font-semibold">{currentCard.totalReviews}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Correct</p>
                                        <p className="text-lg font-semibold text-chart-2">{currentCard.correctReviews}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Repetitions</p>
                                        <p className="text-lg font-semibold">{currentCard.repetitions}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Advanced Metrics */}
                        <div className="p-4 bg-background-1 border border-divider-1 rounded-lg space-y-3">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <TrendingUp className="h-4 w-4" />
                                <span className="text-xs font-medium">SM-2 Algorithm</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Ease Factor</span>
                                    <span className="text-sm font-mono font-medium">{currentCard.easeFactor.toFixed(2)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    The ease factor determines how quickly the interval increases. Higher values mean easier recall.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <SheetFooter className="px-6 py-4 border-t mt-auto">
                    <div className="flex w-full gap-3">
                        {isEditing ? (
                            <Button variant="secondary" className="flex-1 font-bold" onClick={handleCancel}>
                                CANCEL
                            </Button>
                        ) : (
                            <Button variant="secondary" className="flex-1 font-bold" onClick={startEditing}>
                                EDIT
                            </Button>
                        )}

                        <Button variant="destructive" className="flex-1 font-bold">
                            DELETE
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet >
    )
}

export default FlashCardSheet;