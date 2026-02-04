'use client'

import View from "@/components/view";

export default function Home() {
  return (
    <View
      title="Study Dashboard"
      subTitle="Track your spaced repetition progress"
    >
      <Dashboard />
    </View>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  Target,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Flame,
  BookOpen,
} from "lucide-react";
import { useDecks } from "@/providers/decks-provider";
import { Flashcard } from "@/generated/prisma";
import { useMemo } from "react";
import { useRouter } from "next/navigation";

function Dashboard() {
  const { state } = useDecks();
  const router = useRouter();

  // Calculate statistics from all flashcards
  const stats = useMemo(() => {
    const allFlashcards = state.decks.flatMap(deck => deck.flashcards || []);
    const now = new Date();

    // Due reviews: cards where nextReview is today or past
    const dueCards = allFlashcards.filter(card =>
      card.nextReview && new Date(card.nextReview) <= now
    );

    // New cards: never reviewed
    const newCards = allFlashcards.filter(card => card.totalReviews === 0);

    // Calculate accuracy
    const totalReviews = allFlashcards.reduce((sum, card) => sum + card.totalReviews, 0);
    const totalCorrect = allFlashcards.reduce((sum, card) => sum + card.correctReviews, 0);
    const overallAccuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;

    // Mature cards (3+ repetitions) vs Young cards (1-2 repetitions)
    const matureCards = allFlashcards.filter(card => card.repetitions >= 3);
    const youngCards = allFlashcards.filter(card => card.repetitions > 0 && card.repetitions < 3);

    const matureReviews = matureCards.reduce((sum, card) => sum + card.totalReviews, 0);
    const matureCorrect = matureCards.reduce((sum, card) => sum + card.correctReviews, 0);
    const matureAccuracy = matureReviews > 0 ? Math.round((matureCorrect / matureReviews) * 100) : 0;

    const youngReviews = youngCards.reduce((sum, card) => sum + card.totalReviews, 0);
    const youngCorrect = youngCards.reduce((sum, card) => sum + card.correctReviews, 0);
    const youngAccuracy = youngReviews > 0 ? Math.round((youngCorrect / youngReviews) * 100) : 0;

    // Max streak
    const maxStreak = Math.max(0, ...allFlashcards.map(card => card.streak));

    // Estimate time (30 seconds per due card)
    const estimatedMinutes = Math.ceil((dueCards.length * 30) / 60);

    // Leeches: cards with low accuracy (difficulty 0-2 and totalReviews > 3)
    const leeches = allFlashcards.filter(card =>
      card.totalReviews > 3 && card.difficulty <= 2
    );

    return {
      dueCards: dueCards.length,
      newCards: newCards.length,
      estimatedTime: `${estimatedMinutes}m`,
      maxStreak,
      overallAccuracy,
      matureAccuracy,
      youngAccuracy,
      totalCards: allFlashcards.length,
      leeches: leeches.length,
      matureCards: matureCards.length,
      youngCards: youngCards.length,
    };
  }, [state.decks]);

  return (
    <div className="mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Core Stats - Large Cards */}
        <Card className="lg:col-span-2 bg-background-1 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Target className="w-5 h-5 text-primary" />
              Today's Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">{stats.dueCards}</div>
                <div className="text-sm text-muted-foreground">Due Reviews</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground">{stats.newCards}</div>
                <div className="text-sm text-muted-foreground">New Cards</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground">{stats.estimatedTime}</div>
                <div className="text-sm text-muted-foreground">Est. Time</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-success flex items-center justify-center gap-1">
                  <Flame className="w-5 h-5" />
                  {stats.maxStreak}
                </div>
                <div className="text-sm text-muted-foreground">Max Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Card */}
        <Card className="bg-background-1 lg:col-span-2 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <BarChart3 className="w-5 h-5 text-primary" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Overall Accuracy</span>
                <span className="text-foreground font-medium">{stats.overallAccuracy}%</span>
              </div>
              <Progress value={stats.overallAccuracy} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-2 bg-background-2 rounded border border-divider-2">
                <div className="text-success font-medium">{stats.matureAccuracy}%</div>
                <div className="text-muted-foreground">Mature ({stats.matureCards})</div>
              </div>
              <div className="text-center p-2 bg-background-2 rounded border border-divider-2">
                <div className="text-warning font-medium">{stats.youngAccuracy}%</div>
                <div className="text-muted-foreground">Young ({stats.youngCards})</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deck Insights */}
        <Card className="lg:col-span-2 bg-background-1 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <BookOpen className="w-5 h-5 text-primary" />
              Deck Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[340px] overflow-y-auto ">
            <div className="space-y-3">
              {state.decks.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No decks yet. Create your first deck!
                </div>
              ) : (
                state.decks.map((deck) => {
                  const totalCards = deck.flashcards?.length || 0;
                  const newCards = deck.flashcards?.filter((c: Flashcard) => c.totalReviews === 0).length || 0;
                  const dueCards = deck.flashcards?.filter((c: Flashcard) =>
                    c.nextReview && new Date(c.nextReview) <= new Date()
                  ).length || 0;
                  const totalReviews = deck.flashcards?.reduce((sum: number, c: Flashcard) => sum + c.totalReviews, 0) || 0;
                  const correctReviews = deck.flashcards?.reduce((sum: number, c: Flashcard) => sum + c.correctReviews, 0) || 0;
                  const accuracy = totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0;

                  return (
                    <div
                      key={deck.id}
                      className="flex items-center justify-between p-3 bg-background-2 border border-divider-1 rounded-lg cursor-pointer hover:bg-background-3"
                      onClick={() => router.push(`/decks/${deck.id}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">
                            {deck.title}
                          </span>
                          {deck.category && (
                            <Badge variant="secondary" className="text-xs">
                              {deck.category}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{totalCards} total</span>
                          <span>{newCards} new</span>
                          <span>{dueCards} due</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-foreground">
                          {accuracy}%
                        </div>
                        <Progress
                          value={accuracy}
                          className="w-16 h-1 mt-1"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Study Trends */}
        <Card className="lg:col-span-2 bg-background-1 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <TrendingUp className="w-5 h-5 text-primary" />
              Study Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-2">
                  7-Day Average
                </div>
                <div className="text-2xl font-bold text-foreground">156</div>
                <div className="text-xs text-success">+12% from last week</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">
                  30-Day Total
                </div>
                <div className="text-2xl font-bold text-foreground">4,680</div>
                <div className="text-xs text-success">+8% from last month</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-muted-foreground mb-2">
                Study Heatmap (Last 30 Days)
              </div>
              <div className="grid grid-cols-10 gap-1">
                {Array.from({ length: 30 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-sm ${Math.random() > 0.7
                      ? "bg-success"
                      : Math.random() > 0.4
                        ? "bg-primary"
                        : Math.random() > 0.2
                          ? "bg-accent"
                          : "bg-background-2"
                      }`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="bg-background-1 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Award className="w-5 h-5 text-primary" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-warning">
                  14-Day Streak
                </div>
                <div className="text-xs text-muted-foreground">Keep it up!</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Target className="w-4 h-4 text-background-1" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">
                  85% Retention
                </div>
                <div className="text-xs text-muted-foreground">
                  Milestone reached
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-8 h-8 rounded-full flex items-center justify-center">
                <Flame className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  30-Day Streak
                </div>
                <div className="text-xs text-muted-foreground">
                  16 days to go
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weakness Targeting */}
        <Card className="bg-background-1 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.leeches > 0 ? (
              <div className="p-2 bg-destructive/10 rounded border border-destructive/20">
                <div className="text-sm font-medium text-destructive">
                  {stats.leeches} Leeches
                </div>
                <div className="text-xs text-muted-foreground">
                  Cards failing repeatedly
                </div>
              </div>
            ) : null}
            {stats.dueCards > 20 ? (
              <div className="p-2 bg-warning/10 rounded border border-warning/20">
                <div className="text-sm font-medium text-warning">
                  High Review Load
                </div>
                <div className="text-xs text-muted-foreground">
                  {stats.dueCards} cards due today
                </div>
              </div>
            ) : null}
            {stats.overallAccuracy < 70 && stats.totalCards > 10 ? (
              <div className="p-2 bg-accent/10 rounded border border-accent/20">
                <div className="text-sm font-medium text-accent">
                  Low Overall Accuracy
                </div>
                <div className="text-xs text-muted-foreground">
                  {stats.overallAccuracy}% - Consider reviewing fundamentals
                </div>
              </div>
            ) : null}
            {stats.leeches === 0 && stats.dueCards <= 20 && (stats.overallAccuracy >= 70 || stats.totalCards <= 10) ? (
              <div className="p-2 bg-success/10 rounded border border-success/20 text-center">
                <div className="text-sm font-medium text-success">
                  All Good! 🎉
                </div>
                <div className="text-xs text-muted-foreground">
                  No issues detected
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Time & Pacing */}
        <Card className="bg-background-1 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Clock className="w-5 h-5 text-primary" />
              Time & Pacing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Avg per card
              </span>
              <span className="text-sm font-medium text-foreground">8.2s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Sessions today
              </span>
              <span className="text-sm font-medium text-foreground">3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total time</span>
              <span className="text-sm font-medium text-foreground">47m</span>
            </div>
            <div className="pt-2 border-t border-border">
              <div className="text-xs text-muted-foreground mb-1">
                Best study time
              </div>
              <div className="text-sm font-medium text-foreground">
                9:00 AM - 11:00 AM
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deck Health */}
        <Card className="bg-background-1 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <CheckCircle className="w-5 h-5 text-primary" />
              Deck Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                New:Due Ratio
              </span>
              <Badge variant="secondary">
                {stats.dueCards > 0
                  ? `1:${Math.round(stats.dueCards / Math.max(stats.newCards, 1))}`
                  : 'N/A'
                }
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Cards</span>
              <Badge variant="default">{stats.totalCards}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Total Decks
              </span>
              <Badge variant="secondary">{state.decks.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant="default" className="bg-success">
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div >
  );
}
