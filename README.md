# mytodo

A personal todo and task management application built with Tauri, React, and TypeScript. This desktop app helps me organize both school work and life tasks, with grade tracking for academic assignments.

This is my first time using Tauri and Rust, so I'm learning as I build!

## Features

### Current Features
- **Task Management**: Create, organize, and track tasks with due dates, priorities, and status (todo/doing/done)
- **School Workspace**: Manage academic tasks with course integration
- **Life Workspace**: Organize personal tasks with custom categories
- **Grade Tracking**: Track grades and calculate course averages with weight-based calculations
- **Course Management**: Organize tasks by courses with custom colors and target grades
- **Task Types**: Categorize school tasks (Assignments, Exams, Labs, Projects, etc.)
- **Subtasks**: Break down tasks into smaller, manageable subtasks
- **Views**: Home dashboard, Today view, Upcoming tasks, and dedicated School/Life pages
- **Weather Integration**: Beautiful weather display on the home page

### Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Tauri 2 (Rust)
- **Database**: SQLite with Tauri SQL plugin
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router v6
- **Date Handling**: date-fns

## Development

### Prerequisites
- Node.js (v18+)
- Rust (latest stable)
- Tauri CLI

### Setup
```bash
npm install
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

## License

Personal project - built for my own use and learning purposes.
