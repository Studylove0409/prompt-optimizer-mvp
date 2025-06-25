# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a prompt optimization MVP built with FastAPI backend and vanilla JavaScript frontend. It uses DeepSeek and Gemini APIs to optimize AI prompts, with Supabase for user authentication and data storage.

## Development Commands

### Backend Development
```bash
# Install dependencies (from project root)
pip install -r requirements.txt

# Start development server (from project root)
python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000

# Alternative from backend directory  
cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development
```bash
# Install frontend dependencies (if needed)
npm install

# Serve frontend locally (from project root)
cd frontend && python -m http.server 3000

# Access at http://localhost:3000
```

### Testing and Validation
```bash
# Validate environment setup
python -c "from backend.app.config import get_settings; print('Config loaded successfully')"

# Manual API testing
curl -X POST "http://localhost:8000/api/optimize" \
  -H "Content-Type: application/json" \
  -d '{"original_prompt": "测试提示词", "mode": "general"}'
```

## Architecture

### Backend Structure
- **FastAPI App**: Modular router-based architecture with separated concerns
- **Configuration**: Centralized settings in `backend/app/config.py` with environment variable management
- **Authentication**: Supabase Auth with JWT tokens and user profile management
- **Rate Limiting**: SlowAPI middleware for request throttling (configurable via RATE_LIMIT env var)
- **Services Layer**: 
  - `cascading_question_service.py` - Thinking mode intelligent Q&A logic
  - `llm_service.py` - LLM API integration (DeepSeek & Gemini)
  - `prompt_service.py` - Prompt optimization logic
  - `quick_answer_service.py` - Quick answer mode processing
  - `supabase_service.py` - Database operations
- **Routers**: Separated endpoints (health, models, optimize, history, user, debug, quick_answer)
- **Models**: Pydantic models for request/response validation

### Frontend Architecture
- **Modular JS**: Separated concerns across multiple files:
  - `api.js` - API communication layer
  - `auth.js` - Authentication management
  - `ui.js` - UI interaction handlers
  - `modals.js` - Modal dialog management
  - `thinking-cascading.js` - Thinking mode cascade logic
  - `quick-answer.js` - Quick answer mode functionality
  - `particles.js` - Visual effects and animations
  - `utils.js` - Shared utility functions
- **No Framework**: Pure vanilla JavaScript with modern ES6+ features
- **Authentication**: JWT token-based with Supabase integration
- **State Management**: Simple global state objects and localStorage persistence
- **Responsive Design**: CSS Grid/Flexbox with mobile-first approach

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

### Thinking Mode (Cascading Questions)
- Intelligent cascading question system for iterative prompt refinement
- Question bank with categories: target_audience, main_goal, output_format, context_background, etc.
- Question dependencies and priority system
- Step-by-step optimization process with progress tracking
- Backend: `backend/app/services/cascading_question_service.py`
- Frontend: `thinking-cascading.js` with modal interface (`thinking-cascading-modal.css`)

### Quick Answer Mode
- Fast response system for immediate prompt optimization
- Simplified workflow for quick iterations
- Optimized for speed and efficiency
- Backend: `backend/app/services/quick_answer_service.py`
- Frontend: `quick-answer.js` with modal interface (`quick-answer-modal.css`)

### Multi-Model Support
- **DeepSeek Integration**: Chat and Reasoner models via OpenAI-compatible API
- **Gemini Integration**: Google's Gemini models via alternative endpoint
- **Model Selection**: User can choose between fast (Chat) and deep reasoning (Reasoner) models
- **Meta-prompt System**: Configurable optimization templates in `constants.py`

### Authentication & User Management
- Supabase Auth integration with social login support
- JWT token management with refresh token handling
- User profiles with subscription tracking
- Guest session support for anonymous users
- History tracking per user/session

### Performance & Rate Limiting
- SlowAPI middleware for request throttling (default: 5/minute)
- Performance mode toggle for resource optimization
- Configurable rate limits via RATE_LIMIT environment variable
- Lazy loading and caching strategies

## Deployment

### Vercel Configuration
- **Backend**: Deployed as Python serverless functions (@vercel/python)
- **Frontend**: Served as static files (@vercel/static)
- **Routing**: Configured in `vercel.json` with explicit routes for all CSS/JS files
- **API Routing**: All backend routes prefixed with `/api/` and routed to `backend/app/main.py`
- **Static Assets**: Individual routes for each CSS/JS file to ensure proper serving
- **SPA Routing**: Fallback route `"src": "/(.*)", "dest": "frontend/index.html"` for client-side routing

### Environment Variables (Production)
Set these in Vercel dashboard:
- `MY_LLM_API_KEY` - DeepSeek API key
- `GEMINI_API_KEY` - Google Gemini API key  
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_JWT_SECRET` - JWT signing secret
- `RATE_LIMIT` - API rate limiting (optional, defaults to "5/minute")

### Important Notes
- Requirements are in project root `requirements.txt`, not in backend folder
- API endpoints automatically prefixed with `/api/` via routing
- Frontend uses environment detection for API base URL (localhost vs deployed)
- All static assets have explicit routes in `vercel.json` for proper content-type headers

## Code Organization Patterns

### Backend Patterns
- **Router Organization**: Each router handles a specific domain (optimize, history, user, etc.)
- **Service Layer**: Business logic abstracted into services, imported by routers
- **Configuration Management**: Single source of truth in `config.py` with `@lru_cache()` for performance
- **Error Handling**: Consistent HTTP exception handling across all endpoints
- **Pydantic Models**: Request/response validation in `models.py`

### Frontend Patterns  
- **Module Pattern**: Each JS file exports specific functionality (API calls, UI handlers, etc.)
- **Event-Driven**: DOM events and custom events for component communication
- **State Management**: Global objects + localStorage for persistence
- **Environment Detection**: Automatic API URL switching based on context
- **Performance Optimization**: Lazy loading, debouncing, and caching strategies

### File Structure Logic
```
backend/app/
├── main.py          # FastAPI app setup, middleware, router inclusion
├── config.py        # Environment variables and settings
├── models.py        # Pydantic data models
├── constants.py     # Static content (meta-prompts, etc.)
├── routers/         # API endpoint definitions
└── services/        # Business logic implementation

frontend/
├── index.html       # Main application entry point
├── script.js        # Main application logic
├── api.js           # API communication layer
├── auth.js          # Authentication handling
├── ui.js            # UI interaction handlers
├── thinking-*.js    # Thinking mode specific logic
└── *.css           # Modular stylesheets per feature
```