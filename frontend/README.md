# Frontend - Hackathon Todo App

Next.js 16+ App Router frontend for multi-user todo management with responsive design.

## Tech Stack

- **Framework**: Next.js 16+
- **React**: 19+
- **Styling**: Tailwind CSS 4.x
- **Language**: TypeScript 5.x

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
AUTH_SECRET=your-secret-key
AUTH_URL=http://localhost:3000
```

### 3. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm run dev` - Development server with hot reload
- `npm run build` - Production build
- `npm start` - Production server
- `npm run lint` - ESLint

## Project Structure

```
frontend/
├── app/                      # Next.js App Router pages
│   ├── (dashboard)/tasks/    # Task management pages
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/tasks/         # Task components
├── lib/                      # Utilities and types
│   ├── api/                  # API client
│   ├── auth/                 # Auth context
│   └── types.ts              # TypeScript types
└── public/                   # Static assets
```

## Features

### MVP (User Story 1)
- View task list
- Create new tasks
- Task count display
- Empty state handling

### Additional Features
- Mark tasks complete (User Story 2)
- Edit task details (User Story 3)
- Delete tasks (User Story 4)

## API Integration

All API calls go through `/lib/api/tasks.ts`:

```typescript
import { fetchTasks, createTask } from '@/lib/api/tasks';

// Get tasks
const tasks = await fetchTasks();

// Create task
await createTask({ title: 'My task', description: null });
```

## Authentication

**Note**: Uses placeholder auth context. Integrate with Better Auth for production.

## Styling

Uses Tailwind CSS for all styling. Mobile-first responsive design.

## TypeScript

All types defined in `lib/types.ts`. Strict mode enabled.

## Development Tips

- Server Components by default (pages)
- Use `'use client'` for interactivity
- API functions in `lib/api/`
- Reusable components in `components/`

## Deployment

```bash
npm run build
npm start
```

Deploy to Vercel, Netlify, or other Next.js-compatible platforms.

See full documentation for detailed setup, architecture, and troubleshooting.
