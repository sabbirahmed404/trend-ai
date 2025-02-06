import puppeteer, { Browser, Page } from 'puppeteer';

interface TokenInfo {
    accessToken: string;
    expiresAt: number; // Unix timestamp in milliseconds
}

interface RedditAPIConfig {
    clientId: string;
    clientSecret: string;
    username: string;
    password: string;
}

interface RedditTokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
}

export class RedditAPI {
    private browser: Browser | null = null;
    private page: Page | null = null;
    private tokenInfo: TokenInfo | null = null;
    private readonly config: RedditAPIConfig;
    
    // Time buffer before token expiry (1 hour) to refresh the token
    private static readonly TOKEN_REFRESH_BUFFER = 60 * 60 * 1000; // 1 hour in milliseconds
    
    constructor(config: RedditAPIConfig) {
        this.config = config;
    }
    
    private async initBrowser() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process',
                    '--ignore-certificate-errors',
                    '--ignore-certificate-errors-spki-list',
                    '--allow-insecure-localhost'
                ]
            });
        }
        
        if (!this.page) {
            this.page = await this.browser.newPage();
            await this.setupPage(this.page);
        }
        
        return { browser: this.browser, page: this.page };
    }
    
    private async setupPage(page: Page) {
        await page.setViewport({ width: 1280, height: 800 });
        await page.setUserAgent('PostmanRuntime/7.32.3');
        await page.setRequestInterception(true);
        
        page.on('request', request => {
            console.debug('Making request:', request.url());
            request.continue();
        });
        
        page.on('response', async response => {
            const status = response.status();
            if (status !== 200) {
                try {
                    const text = await response.text();
                    console.warn('Non-200 response:', response.url(), status, text);
                } catch (e) {
                    console.warn('Could not read error response body');
                }
            }
        });
    }
    
    private async getNewAccessToken(): Promise<TokenInfo> {
        const { page } = await this.initBrowser();
        
        await page.goto('about:blank');
        
        const response = await page.evaluate(async (config) => {
            return new Promise<RedditTokenResponse>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', 'https://ssl.reddit.com/api/v1/access_token', true);
                
                xhr.setRequestHeader('Authorization', `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`);
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                xhr.setRequestHeader('User-Agent', 'PostmanRuntime/7.32.3');
                xhr.setRequestHeader('Accept', '*/*');
                xhr.setRequestHeader('Accept-Encoding', 'gzip, deflate, br');
                xhr.setRequestHeader('Connection', 'keep-alive');
                xhr.setRequestHeader('Cache-Control', 'no-cache');
                
                xhr.onload = function() {
                    if (this.status >= 200 && this.status < 300) {
                        resolve(JSON.parse(this.responseText));
                    } else {
                        reject(new Error(`HTTP ${this.status}: ${this.responseText}`));
                    }
                };
                
                xhr.onerror = () => reject(new Error('Network request failed'));
                
                const formData = new URLSearchParams();
                formData.append('grant_type', 'password');
                formData.append('username', config.username);
                formData.append('password', config.password);
                
                xhr.send(formData.toString());
            });
        }, this.config);
        
        const expiresAt = Date.now() + (response.expires_in * 1000);
        return {
            accessToken: response.access_token,
            expiresAt
        };
    }
    
    private async ensureValidToken(): Promise<string> {
        const now = Date.now();
        
        // If we have no token or the token is expired/about to expire, get a new one
        if (!this.tokenInfo || now + RedditAPI.TOKEN_REFRESH_BUFFER >= this.tokenInfo.expiresAt) {
            console.debug('Getting new access token...');
            this.tokenInfo = await this.getNewAccessToken();
        }
        
        return this.tokenInfo.accessToken;
    }
    
    public async makeRequest<T>(endpoint: string, options: {
        method?: string;
        body?: any;
        headers?: Record<string, string>;
    } = {}): Promise<T> {
        const accessToken = await this.ensureValidToken();
        const { page } = await this.initBrowser();
        
        await page.goto('about:blank');
        
        const response = await page.evaluate(async ({ endpoint, accessToken, options }) => {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open(options.method || 'GET', `https://oauth.reddit.com${endpoint}`, true);
                
                // Set default headers
                xhr.setRequestHeader('Authorization', `bearer ${accessToken}`);
                xhr.setRequestHeader('User-Agent', 'PostmanRuntime/7.32.3');
                xhr.setRequestHeader('Accept', '*/*');
                xhr.setRequestHeader('Accept-Encoding', 'gzip, deflate, br');
                xhr.setRequestHeader('Connection', 'keep-alive');
                xhr.setRequestHeader('Cache-Control', 'no-cache');
                
                // Add custom headers
                if (options.headers) {
                    Object.entries(options.headers).forEach(([key, value]) => {
                        xhr.setRequestHeader(key, value);
                    });
                }
                
                xhr.onload = function() {
                    if (this.status >= 200 && this.status < 300) {
                        resolve(JSON.parse(this.responseText));
                    } else {
                        reject(new Error(`HTTP ${this.status}: ${this.responseText}`));
                    }
                };
                
                xhr.onerror = () => reject(new Error('Network request failed'));
                
                xhr.send(options.body ? JSON.stringify(options.body) : null);
            });
        }, { endpoint, accessToken, options });
        
        return response as T;
    }
    
    public async getUserInfo() {
        return this.makeRequest<any>('/api/v1/me');
    }

    public async getRecentPosts(subreddit: string = '', options: {
        limit?: number;
        after?: string;
        sort?: 'hot' | 'new' | 'top' | 'rising';
        time?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
    } = {}) {
        const {
            limit = 25,
            sort = 'hot',
            time = 'day',
            after
        } = options;

        const endpoint = subreddit
            ? `/r/${subreddit}/${sort}.json`
            : `/${sort}.json`;

        const queryParams = new URLSearchParams({
            limit: limit.toString(),
            t: time
        });

        if (after) {
            queryParams.append('after', after);
        }

        return this.makeRequest<{
            data: {
                children: Array<{
                    data: {
                        title: string;
                        selftext: string;
                        author: string;
                        score: number;
                        created_utc: number;
                        url: string;
                        permalink: string;
                        num_comments: number;
                        subreddit: string;
                        subreddit_name_prefixed: string;
                    }
                }>;
                after: string | null;
                before: string | null;
            }
        }>(`${endpoint}?${queryParams.toString()}`);
    }
    
    public async cleanup() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
        }
    }
}

// Example usage:
// const api = new RedditAPI({
//     clientId: process.env.REDDIT_CLIENT_ID!,
//     clientSecret: process.env.REDDIT_SECRET!,
//     username: process.env.REDDIT_USERNAME!,
//     password: process.env.REDDIT_PASSWORD!
// });
// 
// try {
//     const userInfo = await api.getUserInfo();
//     console.log('User info:', userInfo);
// } finally {
//     await api.cleanup();
// } 