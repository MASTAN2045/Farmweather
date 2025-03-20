require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const WeatherSearch = require('./models/WeatherSearch');
const { OpenAI } = require('openai');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI with error handling
let openai;
try {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key is not configured in .env file');
    }
    
    // Validate API key format
    if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
        throw new Error('Invalid OpenAI API key format. Key should start with "sk-". Get a valid key from https://platform.openai.com/api-keys');
    }

    // Check if the key is just the prefix
    if (process.env.OPENAI_API_KEY === 'sk-') {
        throw new Error('Incomplete API key. Please add your full API key to the .env file');
    }
    
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
    
    // Test the OpenAI connection
    console.log('Testing OpenAI connection...');
    (async () => {
        try {
            const testResponse = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "system", content: "Test message" }],
                max_tokens: 5
            });
            
            if (testResponse.choices && testResponse.choices[0]) {
                console.log('✓ OpenAI connection successful');
                console.log('✓ Model responded correctly');
                console.log('✓ API key is valid and working');
            } else {
                console.error('✗ OpenAI response format was unexpected');
            }
        } catch (error) {
            console.error('✗ OpenAI connection test failed');
            console.error('Error details:', error.message);
            
            if (error.message.includes('quota')) {
                console.error('✗ API key quota exceeded - Please check your billing settings at https://platform.openai.com/account/billing');
            } else if (error.message.includes('invalid')) {
                console.error('✗ Invalid API key - Please check your API key at https://platform.openai.com/api-keys');
            } else if (error.message.includes('rate limit')) {
                console.error('✗ Rate limit exceeded - Please try again in a few minutes');
            }
        }
    })();
} catch (error) {
    console.error('Error initializing OpenAI:', error.message);
}

// MongoDB Connection
const mongoOptions = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
};

mongoose.connect(process.env.MONGODB_URI, mongoOptions)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        // Attempt reconnection
        setTimeout(() => {
            console.log('Attempting to reconnect to MongoDB...');
            mongoose.connect(process.env.MONGODB_URI, mongoOptions);
        }, 5000);
    });

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected. Attempting to reconnect...');
    setTimeout(() => {
        mongoose.connect(process.env.MONGODB_URI, mongoOptions);
    }, 5000);
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB error:', err);
});

// Routes
app.post('/api/weather-history', async (req, res) => {
    try {
        const weatherSearch = new WeatherSearch(req.body);
        await weatherSearch.save();
        res.status(201).json(weatherSearch);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.get('/api/weather-history', async (req, res) => {
    try {
        const history = await WeatherSearch.find()
            .sort({ searchDate: -1 })
            .limit(5);
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/weather-history', async (req, res) => {
    try {
        await WeatherSearch.deleteMany({});
        res.status(200).json({ message: 'Search history cleared successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Enhanced AI Assistant endpoint with better error handling
app.post('/api/chat', async (req, res) => {
    try {
        // Check if OpenAI is properly initialized
        if (!openai) {
            throw new Error('OpenAI client not initialized. Please check your API key configuration in .env file');
        }

        const { message, userContext } = req.body;

        if (!message) {
            return res.status(400).json({ 
                error: 'Message is required',
                status: 'error' 
            });
        }

        console.log('Processing chat request:', { message, hasContext: !!userContext });

        // Create a comprehensive farming-focused prompt
        const systemPrompt = `You are an expert AI farming assistant with deep knowledge in agriculture, weather patterns, crop management, and sustainable farming practices.

Context about the user's farm:
${userContext || 'No specific context provided'}

Your role is to:
1. Provide practical, actionable farming advice
2. Consider the user's specific farm context (location, soil type, farm size, experience)
3. Include relevant weather considerations in your responses
4. Suggest sustainable farming practices
5. Explain technical concepts in an easy-to-understand way
6. Provide specific examples and step-by-step guidance when needed

Please analyze the user's query and provide detailed, contextual advice.`;

        console.log('Sending request to OpenAI...');
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            temperature: 0.7,
            max_tokens: 800,
            presence_penalty: 0.3,
            frequency_penalty: 0.3
        });

        console.log('Received response from OpenAI');

        if (!completion.choices || !completion.choices[0]) {
            throw new Error('Invalid response from OpenAI');
        }

        // Store chat in MongoDB for history
        try {
            const chatHistory = new WeatherSearch({
                query: message,
                response: completion.choices[0].message.content,
                userContext: userContext,
                timestamp: new Date()
            });
            await chatHistory.save();
            console.log('Chat history saved to database');
        } catch (dbError) {
            console.error('Error saving to database:', dbError);
            // Continue even if database save fails
        }

        res.json({ 
            response: completion.choices[0].message.content,
            status: 'success' 
        });

    } catch (error) {
        console.error('Error in AI chat:', error);
        
        // Send appropriate error message based on error type
        let errorMessage = 'Failed to get AI response';
        let statusCode = 500;

        if (error.message.includes('API key')) {
            errorMessage = 'API configuration error - Please check your OpenAI API key';
            statusCode = 503;
        } else if (error.code === 'invalid_api_key') {
            errorMessage = 'Invalid API key - Please check your OpenAI API key';
            statusCode = 503;
        } else if (error.code === 'insufficient_quota') {
            errorMessage = 'API key quota exceeded - Please check your OpenAI billing settings';
            statusCode = 402;
        } else if (error.code === 'context_length_exceeded') {
            errorMessage = 'Message too long';
            statusCode = 400;
        } else if (error.code === 'rate_limit_exceeded') {
            errorMessage = 'Too many requests, please try again later';
            statusCode = 429;
        }

        res.status(statusCode).json({ 
            error: errorMessage,
            details: error.message,
            status: 'error'
        });
    }
});

// Get chat history for a user
app.get('/api/chat/history', async (req, res) => {
    try {
        const history = await WeatherSearch.find()
            .sort({ timestamp: -1 })
            .limit(10);
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Clear chat history
app.delete('/api/chat/history', async (req, res) => {
    try {
        await WeatherSearch.deleteMany({});
        res.json({ message: 'Chat history cleared successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Port configuration
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 