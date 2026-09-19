# StanceStream Frontend

**React 19 + Vite frontend for the StanceStream AI Intelligence Platform**

## 🚀 Quick Start

### Development Setup
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open browser to http://localhost:5173
```

### Environment Configuration
```bash
# Create .env.local file with backend URL
echo "VITE_API_URL=http://localhost:3001" > .env.local
```

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── Header.jsx      # Application header
│   ├── DebatePanel.jsx # Live debate display
│   └── ...
├── hooks/              # Custom React hooks
├── services/           # API and WebSocket services
└── App.jsx            # Main application
```

## 🎨 Key Features

### 4-Mode Navigation System
- **Standard**: Single debate with fact-checker
- **Multi-Debate**: Concurrent session management  
- **Analytics**: Performance dashboard
- **Business**: ROI and cost analysis

### Real-Time Updates
- WebSocket integration for live debate messages
- Automatic reconnection with exponential backoff
- Connection status monitoring

### Professional UI Components
- 47+ Lucide React icons
- Tailwind CSS for styling
- Responsive design for all screen sizes
- Loading states and error boundaries

## 🔧 Build Commands

```bash
# Development
pnpm dev

# Production build
pnpm build

# Preview production build
pnpm preview

# Linting
pnpm lint
```

## 🌐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3001` |

### Development
```env
# .env.local
VITE_API_URL=http://localhost:3001
```

### Production
```env
# .env.production
VITE_API_URL=https://your-backend-domain.com
```

## 📊 Dependencies

### Core Framework
- **React 19**: Latest React with concurrent features
- **Vite 7**: Fast build tool and development server

### UI & Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Professional icon library
- **Recharts**: Charts for stance evolution

### Utilities
- **date-fns**: Date formatting and manipulation

## 🔗 API Integration

### WebSocket Connection
```javascript
// Automatic connection to backend WebSocket
const wsUrl = import.meta.env.VITE_API_URL 
  ? `wss://${new URL(import.meta.env.VITE_API_URL).host}`
  : `ws://${window.location.hostname}:3001`;
```

### REST API
```javascript
// Base URL configuration
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : '/api';
```

## 🧪 Development Guidelines

### Component Structure
```jsx
// Example component with proper imports
import { useState, useEffect } from 'react';
import Icon from './Icon';
import { Card, Button } from './ui';

export default function MyComponent() {
  // Component logic
}
```

### State Management
- Local state with `useState` for component-specific data
- Context for shared application state
- WebSocket manager for real-time updates

### Error Handling
- Error boundaries for graceful failure handling
- Loading states for async operations
- Fallback UI for network issues

## 🔧 Customization

### Adding New Components
1. Create component in `src/components/`
2. Export from appropriate index file
3. Import and use in parent components

### Styling Guidelines
- Use Tailwind CSS classes
- Follow existing color scheme
- Maintain responsive design patterns

### Icon Usage
```jsx
// Use centralized Icon component
import Icon from './components/Icon';

<Icon name="play" size={20} className="text-green-500" />
```

---

*StanceStream Frontend - Built with React 19 and Vite for optimal performance*
