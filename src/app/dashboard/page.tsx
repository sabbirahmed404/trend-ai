import { Card } from "@/components/ui/card";
import { MessageSquare, TrendingUp, Users } from "lucide-react";

const stats = [
  {
    title: "Active Communities",
    value: "12",
    icon: Users,
    description: "Monitored subreddits",
  },
  {
    title: "Total Posts",
    value: "2.4k",
    icon: MessageSquare,
    description: "Across all communities",
  },
  {
    title: "Trending Topics",
    value: "8",
    icon: TrendingUp,
    description: "Hot discussions today",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your Reddit community analytics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title} className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 p-6">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-8">
            <div className="flex items-center">
              <div className="space-y-1">
                <p className="text-sm font-medium">New trending post in r/technology</p>
                <p className="text-sm text-muted-foreground">
                  "AI breakthrough in quantum computing" is gaining traction
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="space-y-1">
                <p className="text-sm font-medium">Sentiment shift in r/programming</p>
                <p className="text-sm text-muted-foreground">
                  Positive sentiment increasing around "TypeScript adoption"
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="col-span-3 p-6">
          <h3 className="font-semibold mb-4">Top Communities</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm font-medium">r/technology</span>
              </div>
              <span className="text-sm text-muted-foreground">2.1k posts</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-sm font-medium">r/programming</span>
              </div>
              <span className="text-sm text-muted-foreground">1.8k posts</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span className="text-sm font-medium">r/artificial</span>
              </div>
              <span className="text-sm text-muted-foreground">956 posts</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 