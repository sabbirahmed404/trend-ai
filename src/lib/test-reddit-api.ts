import dotenv from 'dotenv';
import { RedditAPI } from './reddit-api';

dotenv.config();

async function testRedditAPI() {
    console.log('Starting Reddit API test for r/Bangladesh...');
    console.log('Checking environment variables...');
    
    // Check for required environment variables
    const requiredEnvVars = [
        'REDDIT_CLIENT_ID',
        'REDDIT_SECRET',
        'REDDIT_USERNAME',
        'REDDIT_PASSWORD'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        console.error('Missing required environment variables:', missingVars.join(', '));
        process.exit(1);
    }
    
    const api = new RedditAPI({
        clientId: process.env.REDDIT_CLIENT_ID!,
        clientSecret: process.env.REDDIT_SECRET!,
        username: process.env.REDDIT_USERNAME!,
        password: process.env.REDDIT_PASSWORD!
    });
    
    try {
        // Get 25 hot posts from r/Bangladesh
        console.log('\nFetching hot posts from r/Bangladesh...');
        const hotPosts = await api.getRecentPosts('Bangladesh', {
            limit: 25,
            sort: 'hot'
        });
        
        // Display the posts
        console.log('\nRecent posts from r/Bangladesh:');
        hotPosts.data.children.forEach((post, index) => {
            const { data } = post;
            console.log(`\n${index + 1}. ${data.title}`);
            console.log(`   Author: ${data.author}`);
            console.log(`   Score: ${data.score}`);
            console.log(`   Comments: ${data.num_comments}`);
            console.log(`   URL: https://reddit.com${data.permalink}`);
            if (data.selftext) {
                console.log(`   Text: ${data.selftext.substring(0, 150)}${data.selftext.length > 150 ? '...' : ''}`);
            }
        });
        
    } catch (error) {
        console.error('Error fetching posts:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
        await api.cleanup();
    }
}

testRedditAPI().catch(console.error); 