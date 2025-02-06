import { RedditAPI } from '@/lib/reddit-api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from 'date-fns';

async function getRedditPosts() {
  const api = new RedditAPI({
    clientId: process.env.REDDIT_CLIENT_ID!,
    clientSecret: process.env.REDDIT_SECRET!,
    username: process.env.REDDIT_USERNAME!,
    password: process.env.REDDIT_PASSWORD!
  });

  try {
    const posts = await api.getRecentPosts('Bangladesh', {
      limit: 25,
      sort: 'hot',
      time: 'day'
    });
    await api.cleanup();
    return posts.data.children;
  } catch (error) {
    console.error('Error fetching posts:', error);
    await api.cleanup();
    return [];
  }
}

export default async function BangladeshSubredditPage() {
  const posts = await getRedditPosts();

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">r/Bangladesh</h1>
        <p className="text-muted-foreground">Today's Hot Posts</p>
      </div>

      <div className="space-y-6">
        {posts.map((post: any) => (
          <Card key={post.data.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl">
                <a 
                  href={`https://reddit.com${post.data.permalink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  {post.data.title}
                </a>
              </CardTitle>
              <CardDescription>
                Posted by u/{post.data.author} • {formatDistanceToNow(post.data.created_utc * 1000)} ago
              </CardDescription>
            </CardHeader>
            <CardContent>
              {post.data.selftext && (
                <p className="text-sm text-muted-foreground mb-4">
                  {post.data.selftext.length > 300 
                    ? `${post.data.selftext.substring(0, 300)}...` 
                    : post.data.selftext}
                </p>
              )}
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span>↑ {post.data.score} points</span>
                <span>💬 {post.data.num_comments} comments</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 