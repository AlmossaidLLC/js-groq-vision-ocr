# OCR API - Groq Vision

A simple OCR (Optical Character Recognition) API built with Express.js and Groq's Vision model.

> 🎯 This project was created using **vibecoding** - building software through natural conversation with AI.

## Features

- Extract text and structured data from images
- Supports JPEG, PNG, GIF, and WebP formats
- Returns structured JSON output with document metadata, text blocks, and tables
- Uses Groq's `llama-3.2-90b-vision-preview` model

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file with:

```env
GROQ_API_KEY=your_groq_api_key
PORT=3000
GROQ_MODEL=llama-3.2-90b-vision-preview
```

## Usage

Start the server:

```bash
npm start
# or for development
npm run dev
```

### Endpoints

**Health Check**
```
GET /health
```

**OCR Extraction**
```
POST /prompt
Content-Type: multipart/form-data

- image: Image file (required)
- text: Additional instructions (optional)
```

## Author

Abdelilah Ezzouini
