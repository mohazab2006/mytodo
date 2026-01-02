import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/home', label: 'Home' },
  { path: '/today', label: 'Today' },
  { path: '/upcoming', label: 'Upcoming' },
  { path: '/school', label: 'School' },
  { path: '/life', label: 'Life' },
];

export default function Sidebar() {
  return (
    <aside className="w-60 bg-background border-r border-border flex flex-col">
      <div className="p-4 pt-6">
        <h1 className="text-xl font-semibold px-3">MyTodo</h1>
      </div>

      <nav className="flex-1 px-2 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `block px-3 py-1.5 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-muted text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground px-3">
          v0.1.0
        </div>
      </div>
    </aside>
  );
}

