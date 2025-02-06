import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Subreddits</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/dashboard/subreddit/bangladesh" className="block transition-transform hover:scale-105">
          <Card className="hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">r/Bangladesh</span>
              </CardTitle>
              <CardDescription>
                The subreddit for Bangladesh
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Click to view today's posts
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
} 