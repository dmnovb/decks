import View from "@/components/view";

export default function Home() {
  return (
    <View
      title=" Study Dashboard"
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
  Zap,
  Eye,
} from "lucide-react";

export function Dashboard() {
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
                <div className="text-4xl font-bold text-primary ">47</div>
                <div className="text-sm text-muted-foreground">Due Reviews</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold  ">12</div>
                <div className="text-sm text-muted">New Cards</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground ">23m</div>
                <div className="text-sm text-muted-foreground">Est. Time</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-success flex items-center justify-center gap-1 ">
                  <Flame className="w-5 h-5" />
                  14
                </div>
                <div className="text-sm text-muted-foreground">Day Streak</div>
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
                <span className="text-foreground font-medium">87%</span>
              </div>
              <Progress value={87} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-2 bg-background-2 rounded border border-divider-2">
                <div className="text-success font-medium">92%</div>
                <div className="text-muted-foreground">Mature</div>
              </div>
              <div className="text-center p-2 bg-background-2 rounded border border-divider-2">
                <div className="text-warning font-medium">78%</div>
                <div className="text-muted-foreground">Young</div>
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
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  name: "Japanese Vocabulary",
                  due: 23,
                  new: 5,
                  urgency: "high",
                  completion: 78,
                  leeches: 3,
                },
                {
                  name: "Spanish Grammar",
                  due: 15,
                  new: 4,
                  urgency: "medium",
                  completion: 92,
                  leeches: 1,
                },
                {
                  name: "Medical Terms",
                  due: 9,
                  new: 3,
                  urgency: "low",
                  completion: 65,
                  leeches: 5,
                },
              ].map((deck, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-background-2 border border-divider-1 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">
                        {deck.name}
                      </span>
                      <Badge
                        variant={
                          deck.urgency === "high"
                            ? "destructive"
                            : deck.urgency === "medium"
                              ? "default"
                              : "secondary"
                        }
                        className="text-xs"
                      >
                        {deck.urgency.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{deck.due} due</span>
                      <span>{deck.new} new</span>
                      <span>{deck.leeches} leeches</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
                      {deck.completion}%
                    </div>
                    <Progress
                      value={deck.completion}
                      className="w-16 h-1 mt-1"
                    />
                  </div>
                </div>
              ))}
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
            <div className="p-2 bg-destructive/10 rounded border border-destructive/20">
              <div className="text-sm font-medium text-destructive">
                8 Leeches
              </div>
              <div className="text-xs text-muted-foreground">
                Cards failing repeatedly
              </div>
            </div>
            <div className="p-2 bg-warning/10 rounded border border-warning/20">
              <div className="text-sm font-medium text-warning">
                Verb Conjugations
              </div>
              <div className="text-xs text-muted-foreground">
                Weak tag (62% accuracy)
              </div>
            </div>
            <div className="p-2 bg-accent/10 rounded border border-accent/20">
              <div className="text-sm font-medium text-accent">
                12 Confusable Pairs
              </div>
              <div className="text-xs text-muted-foreground">
                Similar cards detected
              </div>
            </div>
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
                New:Review Ratio
              </span>
              <Badge variant="secondary">1:4</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Duplicates</span>
              <Badge variant="destructive">3 found</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Media Issues
              </span>
              <Badge variant="secondary">None</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sync Status</span>
              <Badge variant="default">Synced</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
