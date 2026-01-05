# MyTodo

Desktop todo application built with Tauri 2, React 18, and TypeScript. SQLite database with Rust backend for local-first task management.

## Features

**Recurring Tasks** - Template-based recurrence system for life tasks. Uses JSON-serialized recurrence rules (RRULE-like) with support for daily, weekly, and monthly frequencies. Instances are generated on-demand with a 90-day horizon. Supports editing individual occurrences (creates overrides) or entire series.

**Weather Integration** - Open-Meteo API integration with client-side geolocation fallback. Weather widget renders dynamic CSS animations based on WMO weather codes and time of day. Effects include particle systems for rain/snow, gradient overlays, and conditional starfield rendering.

**Dual Workspace Architecture** - Separate `school` and `life` workspaces with different data models. School tasks link to courses with grade tracking and weighted calculations. Life tasks support custom categories and auto-cleanup of completed items after 7 days.

**Task Management** - Status workflow (todo/doing/done), subtasks, due dates, priorities. Recurring instances appear at 12 AM on their occurrence date, not at the scheduled time.

**Views** - Home dashboard aggregates recurring templates and weather. Today/Upcoming views filter by date ranges. School/Life pages provide workspace-specific filtering.

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Tauri 2 (Rust)
- **Database**: SQLite via `@tauri-apps/plugin-sql`
- **State**: TanStack Query for server state, React Hook Form + Zod for forms
- **Routing**: React Router v6

## Development

Requires Node.js 18+ and Rust toolchain.

### Setup
```bash
npm install && npm run tauri:dev
```

### Run Development Server
```bash
npm run tauri:dev
```

### Build
```bash
npm run tauri:build
```

## Future Plans

I'm actively working on expanding this project with exciting new features:

- **🖥️ Desktop Widgets**: Quick-access widgets for viewing and completing tasks without opening the full app
- **🤖 AI-Powered Features**: 
  - Smart task prioritization based on deadlines and workload
  - Auto-scheduling suggestions
  - Intelligent task categorization
  - AI-generated task recommendations
- **📱 Mobile App** (possibly): If I decide to expand to mobile, I'll add a phone app with widgets showing today's tasks and upcoming deadlines

The AI features are a major focus for future phases, aiming to make task management smarter and more intuitive.

## Credits

Used [rapidtables](https://www.rapidtables.com) as a reference for some parts of the implementation.
