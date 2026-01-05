import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
  { 
    path: '/home', 
    label: 'Home',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  { 
    path: '/today', 
    label: 'Today',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  },
  { 
    path: '/upcoming', 
    label: 'Upcoming',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4 4 4m0 6l-4 4-4-4" />
      </svg>
    )
  },
  { 
    path: '/school', 
    label: 'School',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  },
  { 
    path: '/life', 
    label: 'Life',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    )
  },
];

function MyTodoLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        {/* Custom logo design - checkmark in a circle with modern styling */}
        <svg 
          className="w-8 h-8" 
          viewBox="0 0 32 32" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer circle with gradient effect */}
          <circle 
            cx="16" 
            cy="16" 
            r="15" 
            stroke="url(#logoGradient)" 
            strokeWidth="2" 
            fill="none"
            className="opacity-80"
          />
          {/* Inner checkmark */}
          <path 
            d="M10 16 L14 20 L22 12" 
            stroke="url(#logoGradient)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="none"
          />
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(210, 100%, 60%)" />
              <stop offset="50%" stopColor="hsl(270, 80%, 70%)" />
              <stop offset="100%" stopColor="hsl(330, 70%, 65%)" />
            </linearGradient>
          </defs>
        </svg>
        {/* Glow effect */}
        <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-full -z-10" />
      </div>
      <div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          MyTodo
        </h1>
        <p className="text-xs text-muted-foreground/70 -mt-0.5">Stay organized</p>
      </div>
    </div>
  );
}

function NavItem({ item }: { item: typeof navItems[0] }) {
  const location = useLocation();
  const isActive = location.pathname === item.path;
  
  return (
    <NavLink
      to={item.path}
      className={`group flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 border-2 border-blue-500/40 text-foreground shadow-lg shadow-blue-500/10 scale-[1.02]'
          : 'border-2 border-transparent text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground hover:scale-[1.01]'
      }`}
    >
      <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
        {item.icon}
      </span>
      <span>{item.label}</span>
      {isActive && (
        <div className="ml-auto w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gradient-to-b from-background via-background to-muted/20 border-r border-border/50 flex flex-col shadow-lg">
      {/* Logo Section */}
      <div className="p-6 pt-8 pb-6 border-b border-border/50">
        <MyTodoLogo />
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 px-3 py-4 space-y-2">
        {navItems.map((item) => (
          <NavItem key={item.path} item={item} />
        ))}
      </nav>

      {/* Footer Section */}
      <div className="p-4 border-t border-border/50">
        <div className="flex items-center justify-between px-2">
          <div className="text-xs text-muted-foreground/70 font-medium">
            v0.1.0
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-green-400/60 animate-pulse" title="Online" />
        </div>
      </div>
    </aside>
  );
}

