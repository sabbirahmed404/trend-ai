# Product Requirements Document (PRD) - Segment 3 
## Topic Analysis & Gemini-Powered Sentiment Processing

### 1. Overview
This segment implements topic categorization and sentiment analysis using Google's Gemini Pro API, integrating with the Reddit data collection (Segment 1) and AI chat system (Segment 2).

### 2. Core Features

#### 2.1 Sentiment Analysis with Gemini
````typescript
interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  keywords: string[];
  explanation: string;
}

interface BatchSentimentResult {
  postId: string;
  analysis: SentimentResult;
  timestamp: Date;
}
````

#### 2.2 Batch Processing Configuration
````typescript
interface BatchConfig {
  batchSize: number;        // Default: 10 posts per batch
  delayBetweenBatches: number; // Default: 1000ms
  maxRetries: number;       // Default: 3
  cacheExpiry: number;      // Default: 24 hours
}

interface ProcessingQueue {
  pending: RedditPost[];
  processed: BatchSentimentResult[];
  failed: {
    post: RedditPost;
    error: string;
    retryCount: number;
  }[];
}
````

### 3. Technical Implementation

#### 3.1 Gemini Sentiment Analyzer
````typescript
// src/lib/sentiment/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiSentimentAnalyzer {
  private model: any;
  private cache: NodeCache;

  constructor() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
    this.model = genAI.getGenerativeModel({ model: "gemini-pro" });
    this.cache = new NodeCache({ stdTTL: 86400 }); // 24 hours
  }

  async analyzeSingle(text: string): Promise<SentimentResult> {
    const cacheKey = `sentiment:${Buffer.from(text).toString('base64')}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const prompt = `
      Analyze the sentiment of this text. Return JSON format:
      {
        "sentiment": "positive/negative/neutral",
        "confidence": 0-1,
        "keywords": ["emotional", "words", "found"],
        "explanation": "Brief explanation"
      }

      Text: "${text}"
    `;

    const result = await this.model.generateContent(prompt);
    const analysis = JSON.parse(result.response.text());
    
    // Cache result
    this.cache.set(cacheKey, analysis);
    
    return analysis;
  }

  async analyzeBatch(posts: RedditPost[]): Promise<BatchSentimentResult[]> {
    const results: BatchSentimentResult[] = [];
    
    for (let i = 0; i < posts.length; i += 10) {
      const batch = posts.slice(i, i + 10);
      const batchResults = await Promise.all(
        batch.map(async post => ({
          postId: post.id,
          analysis: await this.analyzeSingle(post.title + " " + post.content),
          timestamp: new Date()
        }))
      );
      
      results.push(...batchResults);
      
      // Rate limiting
      if (i + 10 < posts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }
}
````

#### 3.2 MongoDB Schema Updates
````typescript
// src/lib/models/Sentiment.ts
import mongoose from 'mongoose';

const SentimentSchema = new mongoose.Schema({
  postId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  sentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    required: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  keywords: [String],
  explanation: String,
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

export const Sentiment = mongoose.models.Sentiment || 
  mongoose.model('Sentiment', SentimentSchema);
````

### 4. Processing Pipeline

#### 4.1 Batch Processing Implementation
````typescript
// src/lib/processing/batchProcessor.ts
export class SentimentBatchProcessor {
  private analyzer: GeminiSentimentAnalyzer;
  private queue: ProcessingQueue;

  constructor() {
    this.analyzer = new GeminiSentimentAnalyzer();
    this.queue = {
      pending: [],
      processed: [],
      failed: []
    };
  }

  async processBatch(posts: RedditPost[]) {
    try {
      // Add to queue
      this.queue.pending.push(...posts);

      // Process in batches
      while (this.queue.pending.length > 0) {
        const batch = this.queue.pending.splice(0, 10);
        const results = await this.analyzer.analyzeBatch(batch);
        
        // Store results
        await Promise.all(results.map(result => 
          Sentiment.findOneAndUpdate(
            { postId: result.postId },
            result,
            { upsert: true }
          )
        ));

        this.queue.processed.push(...results);
      }
    } catch (error) {
      console.error('Batch processing error:', error);
      throw error;
    }
  }
}
````

### 5. API Routes

#### 5.1 Sentiment Analysis Endpoints
````typescript
// src/app/api/sentiment/route.ts
export async function POST(req: Request) {
  try {
    const { posts } = await req.json();
    const processor = new SentimentBatchProcessor();
    const results = await processor.processBatch(posts);
    
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      { error: 'Sentiment analysis failed' },
      { status: 500 }
    );
  }
}
````

### 6. Integration with Other Segments

#### 6.1 With Segment 1 (Reddit Data)
- Subscribe to new post notifications
- Process sentiment in batches
- Update sentiment data when posts are updated

#### 6.2 With Segment 2 (AI Chat)
- Provide sentiment context for chat responses
- Include sentiment trends in analysis
- Use sentiment data to enhance response accuracy

### 7. Monitoring and Metrics

#### 7.1 Performance Metrics
````typescript
interface SentimentMetrics {
  totalProcessed: number;
  averageConfidence: number;
  processingTime: number;
  errorRate: number;
  cacheHitRate: number;
}
````

### 8. Success Metrics
- Sentiment analysis accuracy > 85%
- Average processing time < 100ms per post
- Cache hit rate > 60%
- Error rate < 5%
- API response time < 2s

### 9. Limitations and Considerations
1. Gemini API rate limits
2. Token usage monitoring
3. Cost optimization through caching
4. Fallback mechanisms for API failures
5. Data consistency during batch processing

### 10. Future Improvements
1. Implement sentiment trend analysis
2. Add custom sentiment dictionaries
3. Enhance batch processing efficiency
4. Improve error recovery mechanisms
5. Add sentiment visualization components
