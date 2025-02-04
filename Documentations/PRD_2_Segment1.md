# Product Requirements Document (PRD) - Segment 1
## Reddit Community Dashboard

### 1. Overview
This segment focuses on building a Reddit data collection and display dashboard using free-tier services. This will serve as the foundation for future AI integration segments and sentiment analysis.
npx shadcn@latest add login-05
npx shadcn@latest add login-05
### 2. Core Features

#### 2.1 Authentication & User Management
- **Service**: Google OAuth (free tier)
- **Implementation**: Next-Auth.js
- **Storage**: MongoDB Atlas (free tier)
- **User Data Schema**:
````typescript
interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  preferences: {
    subreddits: string[];
    refreshInterval: number;
    defaultTimeRange: string;
  }
}
````

#### 2.2 Reddit Data Pipeline
- **Service**: Reddit API via Snoowrap
- **Data Collection Frequency**: Every 6 hours
- **Post Schema**:
````typescript
interface RedditPost {
  id: string;
  subreddit: string;
  title: string;
  content: string;
  author: string;
  created: Date;
  upvotes: number;
  mediaUrls: string[];
  comments: {
    id: string;
    content: string;
    author: string;
    created: Date;
  }[];
  // Fields for Segment 3 compatibility
  sentimentId?: string;    // Reference to sentiment analysis
  processingStatus: 'pending' | 'processed' | 'failed';
  lastProcessed?: Date;
  batchId?: string;       // For batch processing tracking
}
````

#### 2.3 Caching Strategy
- **Client-side**: React Query (staleTime: 1 hour)
- **Server-side**: Node-Cache
- **MongoDB Caching**:
  - Store last 48 hours of data
  - Implement cleanup job for older data
- **Cache Schema**:
````typescript
interface CacheConfig {
  key: string;
  value: any;
  expiresAt: Date;
  lastUpdated: Date;
  updateFrequency: number;
}
````

### 3. Technical Implementation

#### 3.1 Required Packages
````bash
# Core
npm create next-app@latest reddit-trends --typescript --tailwind

# Essential dependencies
npm install next-auth @tanstack/react-query axios
npm install snoowrap node-cache
npm install mongoose
npm install react-loading-skeleton
npm install @headlessui/react @heroicons/react
npm install date-fns zod
````

#### 3.2 API Routes Structure
````typescript
/api/
  /auth/
    /[...nextauth].ts
  /reddit/
    /posts.ts      # Get posts
    /comments.ts   # Get comments
    /refresh.ts    # Force refresh
    /batch/
      /status.ts   # Get batch processing status
      /queue.ts    # Manage processing queue
  /user/
    /preferences.ts
````

#### 3.3 Data Flow
````mermaid
graph TD
    A[Reddit API] -->|Fetch| B[Next.js API Routes]
    B -->|Cache| C[Node-Cache]
    B -->|Store| D[MongoDB]
    E[Client] -->|Request| B
    C -->|Serve| E
    B -->|Queue| F[Processing Queue]
    F -->|Status Update| D
````

### 4. Integration Points for Future Segments

#### 4.1 Data Export Interface
````typescript
interface DataExport {
  // Basic data retrieval
  getPosts(timeRange: DateRange): Promise<RedditPost[]>;
  getComments(postIds: string[]): Promise<Comment[]>;
  getStats(subreddit: string): Promise<SubredditStats>;
  
  // Batch processing support
  getUnprocessedPosts(): Promise<RedditPost[]>;
  updatePostProcessingStatus(
    postId: string, 
    status: 'pending' | 'processed' | 'failed'
  ): Promise<void>;
  getBatchForProcessing(batchSize: number): Promise<RedditPost[]>;
  
  // Monitoring
  getProcessingStats(): Promise<ProcessingStats>;
}
````

#### 4.2 Cache Access Interface
````typescript
interface CacheInterface {
  getLatestPosts(): Promise<RedditPost[]>;
  getHistoricalData(days: number): Promise<RedditPost[]>;
  invalidateCache(): Promise<void>;
  getCacheStats(): Promise<CacheStats>;
}

interface CacheStats {
  hitRate: number;
  size: number;
  oldestEntry: Date;
  newestEntry: Date;
}
````

### 5. Deployment

#### 5.1 Environment Variables
````bash
# .env.local
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-id
GOOGLE_CLIENT_SECRET=your-google-secret

# Reddit API
REDDIT_CLIENT_ID=your-reddit-client-id
REDDIT_CLIENT_SECRET=your-reddit-client-secret
REDDIT_USERNAME=your-username
REDDIT_PASSWORD=your-password

# MongoDB
MONGODB_URI=your-mongodb-uri

# Processing Config
BATCH_SIZE=10
PROCESSING_INTERVAL=21600 # 6 hours in seconds
````

#### 5.2 MongoDB Indexes
````javascript
// Create indexes for efficient queries
db.posts.createIndex({ created: -1 });
db.posts.createIndex({ subreddit: 1, created: -1 });
db.posts.createIndex({ processingStatus: 1 });
db.posts.createIndex({ lastProcessed: 1 });
db.posts.createIndex({ batchId: 1 });
````

### 6. Success Metrics
- Load time < 2 seconds for cached data
- 95% uptime for data collection
- < 1% data loss rate
- MongoDB storage within 512MB limit
- Processing queue latency < 5 minutes
- Cache hit rate > 70%

### 7. Error Handling
````typescript
interface ErrorResponse {
  code: string;
  message: string;
  retryable: boolean;
  context?: any;
}

const errorHandler = {
  api: async (promise: Promise<any>) => {
    try {
      const data = await promise;
      return [data, null];
    } catch (error) {
      console.error('API Error:', error);
      return [null, error];
    }
  }
};
````

### 8. Monitoring & Maintenance
- **Daily Tasks**:
  - Monitor Reddit API rate limits
  - Check processing queue health
  - Verify data freshness
  - Review error logs

- **Weekly Tasks**:
  - Clean up old data
  - Optimize indexes
  - Review cache performance
  - Update processing statistics

### 9. Future Integration Notes
- Implement data export endpoints for Segment 2 (AI Training)
- Add processing status tracking for Segment 3 sentiment analysis
- Implement batch retrieval system for efficient processing
- Maintain post relationships for topic clustering
- Add sentiment analysis result storage
- Implement real-time processing status updates

### 10. Documentation Requirements
- API endpoint documentation
- Data schema documentation
- Processing queue documentation
- Integration guide for other segments
- Monitoring and maintenance guide
- Error handling documentation
