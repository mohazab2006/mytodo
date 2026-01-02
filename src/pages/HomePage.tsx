import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useTasks } from '../hooks/useTasks';
import TaskList from '../components/tasks/TaskList';

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <div className="text-sm font-medium text-foreground mb-3">{title}</div>
      {children}
    </div>
  );
}

export default function HomePage() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { data: today = [], isLoading: todayLoading } = useTasks({
    dueRange: 'today',
    includeCompleted: false,
  });
  const { data: overdue = [], isLoading: overdueLoading } = useTasks({
    dueRange: 'overdue',
    includeCompleted: false,
  });
  const { data: upcoming = [], isLoading: upcomingLoading } = useTasks({
    dueRange: '7days',
    includeCompleted: false,
  });

  const isLoading = todayLoading || overdueLoading || upcomingLoading;
  const allRelevant = useMemo(() => [...overdue, ...today, ...upcoming], [overdue, today, upcoming]);
  const schoolCount = useMemo(() => allRelevant.filter((t) => t.workspace === 'school').length, [allRelevant]);
  const lifeCount = useMemo(() => allRelevant.filter((t) => t.workspace === 'life').length, [allRelevant]);

  const topUpcoming = useMemo(() => upcoming.slice(0, 8), [upcoming]);
  const topToday = useMemo(() => [...overdue, ...today].slice(0, 8), [overdue, today]);

  return (
    <div className="max-w-6xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="text-3xl font-semibold">Home</div>
          <div className="text-sm text-muted-foreground mt-1">
            {format(now, 'EEEE, MMM d')}
          </div>
        </div>

        <div className="text-right">
          <div className="text-4xl font-semibold tabular-nums">{format(now, 'h:mm:ss a')}</div>
          <div className="text-sm text-muted-foreground mt-1">Local time</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card title="Snapshot">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-background/40 p-3">
              <div className="text-xs text-muted-foreground">Today</div>
              <div className="text-2xl font-semibold tabular-nums">{today.length + overdue.length}</div>
            </div>
            <div className="rounded-lg border border-border bg-background/40 p-3">
              <div className="text-xs text-muted-foreground">Upcoming (7d)</div>
              <div className="text-2xl font-semibold tabular-nums">{upcoming.length}</div>
            </div>
            <div className="rounded-lg border border-border bg-background/40 p-3">
              <div className="text-xs text-muted-foreground">School</div>
              <div className="text-2xl font-semibold tabular-nums">{schoolCount}</div>
            </div>
            <div className="rounded-lg border border-border bg-background/40 p-3">
              <div className="text-xs text-muted-foreground">Life</div>
              <div className="text-2xl font-semibold tabular-nums">{lifeCount}</div>
            </div>
          </div>
        </Card>

        <Card title="Weather (optional)">
          <div className="text-sm text-muted-foreground">
            Add-on later: we can show weather here if you want (location + a free API).
          </div>
        </Card>

        <Card title="Focus">
          <div className="text-sm text-muted-foreground">
            Tip: keep School tasks course-less if needed — they’ll still stay in School.
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg font-semibold">Today + Overdue</div>
            <div className="text-xs text-muted-foreground">{topToday.length} shown</div>
          </div>
          {isLoading ? <div className="text-muted-foreground">Loading...</div> : <TaskList tasks={topToday} />}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg font-semibold">Next 7 days</div>
            <div className="text-xs text-muted-foreground">{topUpcoming.length} shown</div>
          </div>
          {isLoading ? <div className="text-muted-foreground">Loading...</div> : <TaskList tasks={topUpcoming} />}
        </div>
      </div>
    </div>
  );
}


