import { Flashcard } from "@/generated/prisma"
import { Badge, badgeVariants } from "./ui/badge"
import { VariantProps } from "class-variance-authority"

const difficultyLabels: Record<Flashcard['difficulty'], string> = {
    0: "Blackout",
    1: "Incorrect",
    2: "Hard Recall",
    3: "Correct",
    4: "Easy",
    5: "Perfect",
}

const difficultyVariants: Record<Flashcard['difficulty'], string> = {
    0: "blackout",
    1: "danger",
    2: "warning",
    3: "success",
    4: "success",
    5: "success",
}

const DifficultyBadge = ({ difficulty }: { difficulty: Flashcard['difficulty'] }) => (
    <Badge variant={difficultyVariants[difficulty] as VariantProps<typeof badgeVariants>['variant']}>
        {difficultyLabels[difficulty]}
    </Badge>
)

export default DifficultyBadge