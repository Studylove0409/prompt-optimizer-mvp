# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a prompt optimization MVP built with FastAPI backend and vanilla JavaScript frontend. It uses DeepSeek and Gemini APIs to optimize AI prompts, with Supabase for user authentication and data storage.

## Development Commands

### Backend Development
```bash
# Install dependencies
cd backend
pip install -r requirements.txt

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# From project root
python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development
```bash
# Serve frontend locally
cd frontend
python -m http.server 3000
```

### Testing API Endpoints
```bash
# Test optimization endpoints
python test_api_endpoints.py
python test_cascading_api.py
```

## Architecture

### Backend Structure
- **FastAPI App**: Modular router-based architecture
- **Authentication**: Supabase Auth with JWT tokens
- **Rate Limiting**: SlowAPI middleware for request throttling
- **Services**: Abstracted service layer for business logic
- **Routers**: Separated endpoints (health, models, optimize, history, user, debug)

### Frontend Architecture
- **Modular JS**: Separated concerns (api.js, auth.js, ui.js, modals.js, etc.)
- **No Framework**: Pure vanilla JavaScript with modern ES6+ features
- **Authentication**: JWT token-based with Supabase
- **State Management**: Simple global state objects

### Database Schema (Supabase)
Three main tables:
- `optimization_history`: Stores prompt optimization records with user/session tracking
- `profiles`: User profile information linked to auth.users
- `subscriptions`: Stripe subscription management

Key constraints ensure proper user identification (authenticated vs anonymous users).

## Environment Configuration

Required environment variables in `backend/.env`:
```bash
MY_LLM_API_KEY=your-deepseek-api-key
GEMINI_API_KEY=your-gemini-api-key
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
RATE_LIMIT=5/minute  # Optional, defaults to 5/minute
```

## Key Features

### Thinking Mode
- Cascading question system for prompt refinement
- Step-by-step optimization process
- Implemented in `backend/app/services/cascading_question_service.py`
- Frontend: `thinking-cascading.js` and related CSS

### Authentication System
- Supabase Auth integration
- JWT token management
- User profiles and history tracking
- Guest session support for anonymous users

### API Rate Limiting
- Configured via SlowAPI middleware
- Per-IP request limiting
- Configurable rate limits via environment variables

## Deployment

### Vercel Configuration
- Backend deployed as Python serverless functions
- Frontend served as static files
- Configured routes in `vercel.json` for proper file serving

### Important Notes
- All API routes prefixed with `/api/`
- Static assets properly routed in Vercel config
- Environment variables must be set in Vercel dashboard