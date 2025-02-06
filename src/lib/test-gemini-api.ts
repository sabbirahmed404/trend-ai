import dotenv from 'dotenv';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import fetch from 'node-fetch';

dotenv.config();

interface GeminiModel {
    name: string;
    displayName: string;
    description: string;
    inputTokenLimit: number;
    outputTokenLimit: number;
    temperature?: {
        min: number;
        max: number;
    };
    supportedGenerationMethods?: string[];
}

interface ModelsResponse {
    models: GeminiModel[];
}

async function listModels(): Promise<void> {
    console.log('\nListing available Gemini models...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    
    try {
        // Make a REST call to list models since SDK doesn't provide this directly
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: ModelsResponse = await response.json();
        console.log('\nAvailable Models:');
        data.models.forEach(model => {
            console.log(`\nModel: ${model.name}`);
            console.log(`Display Name: ${model.displayName}`);
            console.log(`Description: ${model.description}`);
            console.log(`Input Token Limit: ${model.inputTokenLimit}`);
            console.log(`Output Token Limit: ${model.outputTokenLimit}`);
            console.log(`Temperature Range: ${model.temperature?.min || 0} to ${model.temperature?.max || 1}`);
            console.log('Supported Generation Methods:', model.supportedGenerationMethods?.join(', '));
        });
    } catch (error) {
        console.error('Error listing models:', error instanceof Error ? error.message : 'Unknown error');
    }
}

async function testGeminiSDK(): Promise<void> {
    console.log('\nTesting Gemini API using SDK...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model: GenerativeModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    try {
        const prompt = "Explain how AI works in one sentence";
        console.log('Using model: gemini-1.5-flash');
        console.log('Sending prompt:', prompt);
        const result = await model.generateContent(prompt);
        console.log('Response:', result.response.text());
    } catch (error) {
        console.error('SDK Error:', error instanceof Error ? error.message : 'Unknown error');
    }
}

interface GeminiResponse {
    candidates?: Array<{
        content: {
            parts: Array<{
                text: string;
            }>;
        };
    }>;
}

async function testGeminiREST(): Promise<void> {
    console.log('\nTesting Gemini API using REST...');
    
    const modelName = "gemini-1.5-flash";
    console.log('Using model:', modelName);
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const data = {
        contents: [{
            parts: [{ text: "Explain how AI works in one sentence" }]
        }]
    };
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${JSON.stringify(errorData, null, 2)}`);
        }
        
        const result: GeminiResponse = await response.json();
        if (result.candidates && result.candidates[0]) {
            console.log('Response:', result.candidates[0].content.parts[0].text);
        } else {
            console.log('Unexpected response format:', JSON.stringify(result, null, 2));
        }
    } catch (error) {
        console.error('REST Error:', error instanceof Error ? error.message : 'Unknown error');
    }
}

async function runTests(): Promise<void> {
    console.log('Starting Gemini API tests...');
    console.log('API Key:', process.env.GEMINI_API_KEY ? '✓ Found' : '✗ Missing');
    
    await listModels();
    await testGeminiSDK();
    await testGeminiREST();
}

runTests().catch(error => {
    console.error('Test suite error:', error instanceof Error ? error.message : 'Unknown error');
}); 