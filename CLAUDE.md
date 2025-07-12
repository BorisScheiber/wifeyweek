# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Project Architecture

**WifeyWeek** is a React + TypeScript todo application with advanced recurring todo functionality, built on Vite with real-time synchronization and virtual todo generation.

### Core Technology Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS 4
- **Build Tool**: Vite 6
- **Database**: Supabase (PostgreSQL with real-time subscriptions)
- **State Management**: TanStack Query (React Query) with optimistic updates
- **Date Handling**: Day.js, date-fns
- **UI Components**: Material-UI date/time pickers, Headless UI dropdowns
- **Icons**: Lucide React

### Smart Todo System Architecture

The application implements a sophisticated **Smart Todo System** that merges two types of todos:

1. **Real Todos**: Stored in the database (`todos` table)
2. **Virtual Todos**: Generated client-side from recurring rules (`recurring_todos` table)

Key type definitions in `src/types/virtualTodo.ts`:
```typescript
type SmartTodo = Todo | VirtualTodo;
```

### Hook Architecture Patterns

The application uses custom hooks extensively with these key patterns:

#### Core Data Hooks
- **`useSmartTodos(year, month)`**: Central hook that merges real and virtual todos
- **`useSmartTodosOptimized(year, month)`**: Performance-enhanced version with caching
- **`useVirtualTodos(startDate, endDate)`**: Generates virtual todos from recurring rules

#### Mutation Hooks
- **`useTodoMutations()`**: Centralized CRUD operations with optimistic updates
- **`useSmartToggle()`**: Intelligent toggle with virtual todo materialization
- **`useSmartDelete()`**: Type-aware deletion (virtual vs real todos)

#### Performance & Sync Hooks
- **`useRealtimeSync()`**: Supabase real-time synchronization
- **`usePrefetchTodos()`**: Background prefetching for adjacent months

### Virtual Todo System

**Core Concept**: Recurring todos are stored as rules (`recurring_todos` table) and generated client-side as virtual todos. This eliminates database clones and enables advanced features like "edit all future" workflows.

Key files:
- `src/utils/virtualTodoGenerator.ts`: Core generation logic
- `src/utils/virtualTodoGeneratorOptimized.ts`: Performance-optimized version
- `src/utils/performanceOptimizations.ts`: Caching and performance monitoring

### Query Key Strategy

React Query uses hierarchical keys for efficient cache invalidation:
```typescript
["todos", year, month]           // Real todos by month
["virtual-todos", startDate, endDate]  // Virtual todos by date range
["recurring-rules"]              // Recurring todo rules
```

### Development Phases

The project is developed in phases (see Phase1.md, Phase2.md, Phase3.md):
- **Phase 1**: Basic TanStack Query + Supabase integration ✅
- **Phase 2**: Virtual recurring system implementation ✅  
- **Phase 3**: Todo editing and advanced features (in progress)

### Component Structure

The application follows a clean component architecture:
- **Pages**: `TodoPage.tsx`, `CreateTodoPage.tsx`
- **Field Components**: `TitleField.tsx`, `DateField.tsx`, `TimeField.tsx`, `RepeatField.tsx`
- **Utilities**: Swipeable interactions, performance optimizations

### Performance Optimizations

The codebase includes extensive performance optimizations:
- Multi-level caching (React Query + custom LRU caches)
- Background prefetching for predictive loading
- Optimistic updates for instant UI feedback
- Smart cache invalidation (only affected months)
- Performance monitoring and debugging tools

### Database Schema

Two main tables:
- **`todos`**: Individual todo items with optional `recurring_id` reference
- **`recurring_todos`**: Rules for generating recurring todos

### TypeScript Patterns

- Strong typing throughout with custom type guards
- Union types for Smart Todos (`Todo | VirtualTodo`)
- Comprehensive error handling with typed exceptions

### Common Development Tasks

When implementing new features:
1. Follow the established hook patterns for data fetching
2. Use optimistic updates for mutations
3. Implement proper cache invalidation
4. Consider virtual vs real todo implications
5. Test with both recurring and non-recurring scenarios

### Testing Approach

Test key scenarios:
- Month transitions and year boundaries
- Recurring todo materialization
- Real-time sync across devices  
- Cache invalidation edge cases
- Performance with large todo sets