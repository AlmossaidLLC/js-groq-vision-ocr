const express = require('express');
const multer = require('multer');
const { Groq } = require('groq-sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  },
});

// Initialize Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Load system prompt from file
const loadSystemPrompt = () => {
  const systemPromptPath = path.join(__dirname, 'system.md');
  try {
    return fs.readFileSync(systemPromptPath, 'utf-8');
  } catch (error) {
    console.error('Error loading system prompt:', error.message);
    throw new Error('Failed to load system prompt');
  }
};

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// POST /prompt - OCR endpoint
app.post('/prompt', upload.single('image'), async (req, res) => {
  try {
    // Validate that an image was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Get optional user text from request body
    const userText = req.body.text || '';

    // Convert image buffer to base64 data URL
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    const imageDataUrl = `data:${mimeType};base64,${base64Image}`;

    // Load system prompt from file
    const systemPrompt = loadSystemPrompt();

    // Build messages array
    const messages = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: imageDataUrl,
            },
          },
        ],
      },
    ];

    // Add user text message if provided
    if (userText) {
      messages.push({
        role: 'user',
        content: userText,
      });
    }

    // Call Groq API
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: process.env.GROQ_MODEL || 'llama-3.2-90b-vision-preview',
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: false,
      response_format: {
        type: 'json_object',
      },
    });

    // Parse and return the response
    const content = chatCompletion.choices[0].message.content;
    
    try {
      const parsedContent = JSON.parse(content);
      res.json(parsedContent);
    } catch {
      // If response is not valid JSON, return as raw text
      res.json({ raw_response: content });
    }
  } catch (error) {
    console.error('Error processing OCR request:', error);
    res.status(500).json({
      error: 'Failed to process image',
      message: error.message,
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ error: error.message });
  }
  
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  
  next();
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 OCR Server running on http://localhost:${PORT}`);
  console.log(`📍 POST /prompt - Upload an image for OCR processing`);
  console.log(`📍 GET /health - Health check endpoint`);
});

