# Product Requirements Document (PRD) - Segment 2
## AI Chat Integration with Reddit Data

### 1. Overview
This segment implements an AI chatbot using Google's Gemini API, building upon the Reddit data collection system from Segment 1 and preparing for sentiment analysis integration from Segment 3.

### 2. Core Features

#### 2.1 Gemini AI Integration
- **Service**: Google Gemini Pro API (free tier)
- **Context Window**: Up to 30k tokens
- **Response Type**: Streaming enabled
- **Model**: gemini-pro

#### 2.2 Chat System Schema
````typescript
interface ChatMessage {
  id: string;
  userId: string;
  question: string;
  answer: string;
  context: {
    subreddit: string;
    timeRange: string;
    postsUsed: string[];  // Reference to Reddit posts
  };
  timestamp: Date;
  // New fields for sentiment integration
  relatedSentiments?: {
    postId: string;
    sentiment: string;
    confidence: number;
    keywords: string[];
  }[];
  topicContext?: {
    relevantTopics: string[];
    topicSentiments: Record<string, SentimentScore>;
  };
}

interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  created: Date;
  lastActive: Date;
  contextHistory: AIContext[];
}
````

#### 2.3 AI Context Management
- **Data Selection**: Last 48 hours of Reddit data
- **Context Building**: Relevant posts + comments selection
- **Memory Management**: Session-based context retention
- **Context Schema**:
````typescript
interface AIContext {
  posts: {
    title: string;
    content: string;
    upvotes: number;
    commentCount: number;
    timestamp: string;
    sentiment?: {
      score: SentimentScore;
      keywords: string[];
    };
  }[];
  timeRange: string;
  subreddit: string;
  sentimentContext: {
    overallSentiment: string;
    confidenceScore: number;
    relevantKeywords: string[];
    trendDirection: 'improving' | 'declining' | 'stable';
  };
  topicInsights: {
    dominantTopics: string[];
    topicSentiments: Record<string, SentimentScore>;
    trendingTopics: string[];
  };
}
````

### 3. Technical Implementation

#### 3.1 Required Packages
````bash
# AI and Processing
npm install @google/generative-ai
npm install gpt-tokenizer  # For token counting
npm install date-fns      # For date handling
npm install string-similarity # For context matching

# UI Components
npm install @headlessui/react
npm install react-markdown
npm install react-syntax-highlighter
npm install @tremor/react  # For data visualization
````

#### 3.2 API Routes Structure
````typescript
/api/
  /chat/
    /send.ts       # Send message to AI
    /context.ts    # Get/update context
    /history.ts    # Get chat history
    /sentiment/    # New sentiment-aware endpoints
      /context.ts  # Get sentiment context
      /update.ts   # Update sentiment data
  /analysis/
    /topics.ts     # Get topic analysis
    /trends.ts     # Get trend analysis
````

#### 3.3 Enhanced Prompt System
````typescript
interface PromptTemplate {
  basePrompt: string;
  contextPrompt: string;
  sentimentPrompt: string;
  topicPrompt: string;
}

const enhancedPromptSystem: PromptTemplate = {
  basePrompt: `You are a Reddit community analyst. 
    Your task is to analyze and provide insights about the {subreddit} community.
    Use only the provided context for your answers.
    If you're unsure, admit it rather than making assumptions.
    Format your responses in clear, concise markdown.`,
    
  contextPrompt: `
    Community Context:
    - Timeframe: {timeRange}
    - Total Posts Analyzed: {postCount}
    - Active Users: {activeUsers}
  `,
  
  sentimentPrompt: `
    Sentiment Context:
    - Overall community sentiment: {overallSentiment}
    - Key emotional indicators: {keywords}
    - Confidence level: {confidence}
    - Trend direction: {trendDirection}
  `,
  
  topicPrompt: `
    Topic Context:
    - Dominant topics: {dominantTopics}
    - Trending topics: {trendingTopics}
    - Topic sentiments: {topicSentiments}
  `
};
````

#### 3.4 Context Builder
````typescript
class ContextBuilder {
  async buildFullContext(
    subreddit: string,
    timeRange: DateRange,
    options: ContextOptions
  ): Promise<AIContext> {
    const posts = await DataExport.getPosts(timeRange);
    const sentiments = await this.getSentimentContext(posts);
    const topics = await this.getTopicContext(posts);
    
    return {
      posts: this.formatPosts(posts),
      timeRange,
      subreddit,
      sentimentContext: sentiments,
      topicInsights: topics
    };
  }
  
  private async getSentimentContext(posts: RedditPost[]): Promise<SentimentContext> {
    // Implementation
  }
  
  private async getTopicContext(posts: RedditPost[]): Promise<TopicInsights> {
    // Implementation
  }
}
````

### 4. Integration Points

#### 4.1 With Segment 1
````typescript
interface RedditDataConsumer {
  getProcessedPosts(timeRange: DateRange): Promise<ProcessedPost[]>;
  getPostsWithSentiment(): Promise<PostWithSentiment[]>;
  updateProcessingStatus(postId: string, status: ProcessingStatus): Promise<void>;
}
````

#### 4.2 With Segment 3
````typescript
interface SentimentAwareChat {
  updateSentimentContext(context: SentimentContext): Promise<void>;
  getSentimentInsights(timeRange: DateRange): Promise<SentimentInsights>;
  getTopicAnalysis(topic: string): Promise<TopicAnalysis>;
}
````

### 5. Error Handling
````typescript
interface AIError {
  type: 'TOKEN_LIMIT' | 'API_ERROR' | 'CONTEXT_ERROR' | 'SENTIMENT_ERROR';
  message: string;
  retry?: boolean;
  fallback?: string;
  context?: any;
}

const errorHandler = {
  handleAIError: async (error: AIError) => {
    if (error.type === 'TOKEN_LIMIT') {
      return await reduceContextAndRetry();
    }
    if (error.type === 'SENTIMENT_ERROR') {
      return await fallbackToBasicSentiment();
    }
    // Other error handling logic
  }
};
````

### 6. Monitoring & Analytics
````typescript
interface ChatMetrics {
  responseTime: number;
  contextSize: number;
  tokenUsage: number;
  sentimentAccuracy: number;
  userSatisfaction: number;
}

class MetricsCollector {
  async trackMetrics(chatId: string, metrics: ChatMetrics): Promise<void>;
  async generateReport(timeRange: DateRange): Promise<MetricsReport>;
}
````

### 7. Success Metrics
- Response time < 3 seconds
- Context relevance > 80%
- User satisfaction > 4/5
- Error rate < 5%
- Sentiment integration accuracy > 85%
- Topic relevance score > 80%

### 8. Deployment Considerations
- Monitor Gemini API usage
- Implement rate limiting
- Cache frequent queries
- Optimize context building
- Handle sentiment analysis failures gracefully

### 9. Future Improvements
1. Implement streaming responses
2. Add multi-subreddit analysis
3. Enhance sentiment context utilization
4. Improve topic clustering
5. Add visualization capabilities
