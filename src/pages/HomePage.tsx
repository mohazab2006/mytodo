import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useTasks } from '../hooks/useTasks';
import TaskList from '../components/tasks/TaskList';

type WeatherInfo = {
  locationLabel: string;
  temperatureC: number;
  windKmh: number;
  weatherCode: number;
  fetchedAtIso: string;
};

function weatherTheme(code: number): {
  label: string;
  icon: 'sun' | 'cloud' | 'rain' | 'snow' | 'storm' | 'fog';
  accentClass: string;
  bgClass: string;
  effect: 'rain' | 'snow' | 'sun' | 'cloud' | 'none';
} {
  // Open-Meteo weather codes: https://open-meteo.com/en/docs
  if (code === 0) {
    return { label: 'Sunny', icon: 'sun', accentClass: 'text-amber-500', bgClass: 'bg-amber-500/10', effect: 'sun' };
  }
  if (code === 1 || code === 2) {
    return {
      label: 'Mostly Sunny',
      icon: 'sun',
      accentClass: 'text-amber-500',
      bgClass: 'bg-amber-500/10',
      effect: 'sun',
    };
  }
  if (code === 3) {
    return { label: 'Cloudy', icon: 'cloud', accentClass: 'text-slate-500', bgClass: 'bg-slate-500/10', effect: 'cloud' };
  }
  if (code === 45 || code === 48) {
    return { label: 'Foggy', icon: 'fog', accentClass: 'text-slate-500', bgClass: 'bg-slate-500/10', effect: 'cloud' };
  }
  if (code >= 51 && code <= 57) {
    return { label: 'Drizzle', icon: 'rain', accentClass: 'text-sky-500', bgClass: 'bg-sky-500/10', effect: 'rain' };
  }
  if (code >= 61 && code <= 67) {
    return { label: 'Rainy', icon: 'rain', accentClass: 'text-sky-500', bgClass: 'bg-sky-500/10', effect: 'rain' };
  }
  if (code >= 71 && code <= 77) {
    return { label: 'Snowy', icon: 'snow', accentClass: 'text-cyan-500', bgClass: 'bg-cyan-500/10', effect: 'snow' };
  }
  if (code >= 80 && code <= 82) {
    return { label: 'Rainy', icon: 'rain', accentClass: 'text-sky-500', bgClass: 'bg-sky-500/10', effect: 'rain' };
  }
  if (code >= 95) {
    return { label: 'Stormy', icon: 'storm', accentClass: 'text-violet-500', bgClass: 'bg-violet-500/10', effect: 'rain' };
  }
  return { label: 'Cloudy', icon: 'cloud', accentClass: 'text-slate-500', bgClass: 'bg-slate-500/10', effect: 'cloud' };
}

// Weather effect components
function RainEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-6 bg-sky-500/70 rounded-full"
          style={{
            left: `${(i * 3.5) % 100}%`,
            top: `${-15 + (i * 2.5) % 25}%`,
            animation: `rain-fall ${0.8 + (i % 3) * 0.2}s linear infinite`,
            animationDelay: `${(i * 0.08) % 1}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes rain-fall {
          0% { transform: translateY(-120px) translateX(0); opacity: 0.9; }
          100% { transform: translateY(220px) translateX(15px); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

function SnowEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 25 }).map((_, i) => (
        <div
          key={i}
          className="absolute bg-cyan-200/80 rounded-full"
          style={{
            width: `${3 + (i % 3)}px`,
            height: `${3 + (i % 3)}px`,
            left: `${(i * 4) % 100}%`,
            top: `${-15 + (i * 3) % 30}%`,
            animation: `snow-fall ${2.5 + (i % 4) * 0.4}s linear infinite`,
            animationDelay: `${(i * 0.12) % 1.8}s`,
            boxShadow: '0 0 2px rgba(207, 250, 254, 0.8)',
          }}
        />
      ))}
      <style>{`
        @keyframes snow-fall {
          0% { transform: translateY(-120px) translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(220px) translateX(40px) rotate(360deg); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

function SunEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-amber-400/50 blur-2xl"
        style={{
          animation: 'sun-pulse 3s ease-in-out infinite',
        }}
      />
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute top-1/2 left-1/2 w-1 h-12 bg-amber-400/60 origin-top rounded-full"
          style={{
            transform: `translate(-50%, -50%) rotate(${i * 30}deg)`,
            animation: `sun-rotate 25s linear infinite`,
            boxShadow: '0 0 4px rgba(251, 191, 36, 0.6)',
          }}
        />
      ))}
      <style>{`
        @keyframes sun-pulse {
          0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.15); }
        }
        @keyframes sun-rotate {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function CloudEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-slate-500/60"
          style={{
            width: `${50 + i * 20}px`,
            height: `${35 + i * 15}px`,
            left: `${15 + i * 25}%`,
            top: `${5 + i * 20}%`,
            animation: `cloud-drift ${7 + i * 1.5}s ease-in-out infinite`,
            animationDelay: `${i * 1.2}s`,
            filter: 'blur(8px)',
            boxShadow: `0 0 ${20 + i * 5}px rgba(100, 116, 139, 0.4)`,
          }}
        />
      ))}
      {/* Additional smaller clouds for depth */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={`small-${i}`}
          className="absolute rounded-full bg-slate-400/50"
          style={{
            width: `${35 + i * 10}px`,
            height: `${25 + i * 8}px`,
            left: `${25 + i * 30}%`,
            top: `${20 + i * 25}%`,
            animation: `cloud-drift ${9 + i * 2}s ease-in-out infinite`,
            animationDelay: `${i * 1.8}s`,
            filter: 'blur(6px)',
          }}
        />
      ))}
      <style>{`
        @keyframes cloud-drift {
          0%, 100% { transform: translateX(0) translateY(0); opacity: 0.7; }
          50% { transform: translateX(15px) translateY(-8px); opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}

function WeatherGlyph({ kind, className }: { kind: ReturnType<typeof weatherTheme>['icon']; className?: string }) {
  // Tiny inline SVGs (no deps), tuned to feel modern + not “generic emoji”.
  switch (kind) {
    case 'sun':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3v2.2M12 18.8V21M4.2 12H3M21 12h-1.2M6.1 6.1 4.6 4.6M19.4 19.4l-1.5-1.5M17.9 6.1l1.5-1.5M4.6 19.4l1.5-1.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M12 16.2a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4Z"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      );
    case 'cloud':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M8.8 18h8.1a3.6 3.6 0 0 0 .5-7.2A5.6 5.6 0 0 0 6.9 9.6 3.5 3.5 0 0 0 8.8 18Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'rain':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M8.8 14.5h8.1a3.6 3.6 0 0 0 .5-7.2A5.6 5.6 0 0 0 6.9 6.1 3.5 3.5 0 0 0 8.8 14.5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M9 18.2l-.9 1.6M13 18.2l-.9 1.6M17 18.2l-.9 1.6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'snow':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M8.8 14.5h8.1a3.6 3.6 0 0 0 .5-7.2A5.6 5.6 0 0 0 6.9 6.1 3.5 3.5 0 0 0 8.8 14.5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M9.2 18.2h0M12 19.2h0M14.8 18.2h0"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'storm':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M8.8 14.2h8.1a3.6 3.6 0 0 0 .5-7.2A5.6 5.6 0 0 0 6.9 5.8 3.5 3.5 0 0 0 8.8 14.2Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M12.6 14.4 10 18.6h2.2l-1 3.2 3.8-5.4h-2.2l.8-2Z"
            fill="currentColor"
            opacity="0.9"
          />
        </svg>
      );
    case 'fog':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7.7 13.2h9.2a3.6 3.6 0 0 0 .5-7.2A5.6 5.6 0 0 0 6.9 4.8 3.5 3.5 0 0 0 7.7 13.2Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M5.5 16h13M6.5 18.5h11M7.5 21h9"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.8"
          />
        </svg>
      );
    default:
      return null;
  }
}

async function getLocation(): Promise<{ latitude: number; longitude: number; label?: string }> {
  // 1) Try browser geolocation (best accuracy)
  const geo = await new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
    if (!('geolocation' in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 3500, maximumAge: 10 * 60 * 1000 }
    );
  });

  if (geo) return geo;

  // 2) Fallback: IP-based approximate location (no permissions prompt)
  const ipRes = await fetch('https://ipapi.co/json/');
  if (!ipRes.ok) throw new Error('Failed to determine location');
  const ipJson = await ipRes.json();
  const latitude = Number(ipJson.latitude);
  const longitude = Number(ipJson.longitude);
  const labelParts = [ipJson.city, ipJson.region, ipJson.country_name].filter(Boolean);
  return { latitude, longitude, label: labelParts.join(', ') || 'Your area' };
}

async function fetchWeatherInfo(): Promise<WeatherInfo> {
  const loc = await getLocation();
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(loc.latitude)}` +
    `&longitude=${encodeURIComponent(loc.longitude)}` +
    `&current_weather=true&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch weather');
  const json = await res.json();
  const cw = json?.current_weather;
  if (!cw) throw new Error('Weather unavailable');

  // Note: reverse-geocoding is blocked by CORS in some webviews during dev.
  // We keep this robust by only using the IP label fallback or a generic label.
  const label = loc.label || 'Your location';

  return {
    locationLabel: label,
    temperatureC: Number(cw.temperature),
    windKmh: Number(cw.windspeed),
    weatherCode: Number(cw.weathercode),
    fetchedAtIso: new Date().toISOString(),
  };
}

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
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const refreshWeather = async () => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const info = await fetchWeatherInfo();
      setWeather(info);
    } catch (e) {
      setWeatherError(String((e as any)?.message ?? e ?? 'Failed to load weather'));
      setWeather(null);
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    // Load once and refresh occasionally
    refreshWeather();
    const id = setInterval(() => refreshWeather(), 15 * 60 * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const allRelevantUnique = useMemo(() => {
    const map = new Map<string, (typeof today)[number]>();
    [...overdue, ...today, ...upcoming].forEach((t) => map.set(t.id, t));
    return Array.from(map.values());
  }, [overdue, today, upcoming]);
  const schoolCount = useMemo(
    () => allRelevantUnique.filter((t) => t.workspace === 'school').length,
    [allRelevantUnique]
  );
  const lifeCount = useMemo(
    () => allRelevantUnique.filter((t) => t.workspace === 'life').length,
    [allRelevantUnique]
  );

  const topUpcoming = useMemo(() => upcoming.slice(0, 8), [upcoming]);
  const topToday = useMemo(() => [...overdue, ...today].slice(0, 8), [overdue, today]);

  const focusTask = useMemo(() => {
    const byDue = (a: any, b: any) => {
      const ad = a?.due_at ? new Date(a.due_at).getTime() : Number.POSITIVE_INFINITY;
      const bd = b?.due_at ? new Date(b.due_at).getTime() : Number.POSITIVE_INFINITY;
      if (ad !== bd) return ad - bd;
      return String(a?.title ?? '').localeCompare(String(b?.title ?? ''));
    };

    const upcomingSoon = [...today, ...upcoming].sort(byDue)[0];
    if (upcomingSoon) return { task: upcomingSoon, label: 'Next up' as const };

    const overdueSoon = [...overdue].sort(byDue)[0];
    if (overdueSoon) return { task: overdueSoon, label: 'Overdue' as const };

    return null;
  }, [today, upcoming, overdue]);

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

        <Card title="Weather">
          {weatherLoading ? (
            <div className="text-sm text-muted-foreground">Loading weather…</div>
          ) : weatherError ? (
            <div className="space-y-2">
              <div className="text-sm text-red-500">{weatherError}</div>
              <button
                type="button"
                onClick={refreshWeather}
                className="px-2 py-1 text-xs rounded border border-border hover:bg-muted"
              >
                Retry
              </button>
              <div className="text-xs text-muted-foreground">
                Tip: if you blocked location access, we'll fall back to approximate IP location.
              </div>
            </div>
          ) : weather ? (
            <div className="space-y-2">
              {(() => {
                const theme = weatherTheme(weather.weatherCode);
                return (
                  <div className={`rounded-lg border border-border ${theme.bgClass} p-3 relative overflow-hidden`}>
                    {/* Dynamic weather effects */}
                    {theme.effect === 'rain' && <RainEffect />}
                    {theme.effect === 'snow' && <SnowEffect />}
                    {theme.effect === 'sun' && <SunEffect />}
                    {theme.effect === 'cloud' && <CloudEffect />}

                    <div className="relative z-10">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-muted-foreground mb-1">Current</div>
                          <div className="text-sm font-medium truncate mb-2" title={weather.locationLabel}>
                            {weather.locationLabel}
                          </div>

                          {/* Condition label on top of icon */}
                          <div className="mb-2">
                            <div className={`text-sm font-semibold ${theme.accentClass} inline-flex items-center gap-2`}>
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-background/60 border border-border/50 backdrop-blur-sm">
                                <WeatherGlyph kind={theme.icon} className="w-5 h-5" />
                              </span>
                              <span>{theme.label}</span>
                            </div>
                          </div>

                          <div className="flex items-baseline gap-2">
                            <div className="text-3xl font-semibold tabular-nums leading-none">
                              {Math.round(weather.temperatureC)}°C
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Wind {Math.round(weather.windKmh)} km/h
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={refreshWeather}
                          className="px-2 py-1 text-xs rounded border border-border hover:bg-background/40 backdrop-blur-sm bg-background/60 relative z-20"
                          title="Refresh"
                        >
                          Refresh
                        </button>
                      </div>

                      <div className="mt-2 text-xs text-muted-foreground relative z-10">
                        Updated {format(new Date(weather.fetchedAtIso), 'h:mm a')}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Weather unavailable.</div>
          )}
        </Card>

        <Card title="Focus">
          {focusTask ? (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">{focusTask.label}</div>
              <div className="text-sm font-medium">{focusTask.task.title}</div>
              {focusTask.task.due_at ? (
                <div className="text-xs text-muted-foreground">
                  Due {format(new Date(focusTask.task.due_at), 'EEE, MMM d · h:mm a')}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">No due date</div>
              )}
              <div className="text-xs text-muted-foreground">
                Workspace: {focusTask.task.workspace === 'school' ? 'School' : 'Life'}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              You’re clear — no tasks due today or in the next 7 days.
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg font-semibold">Today + Overdue</div>
            <div className="text-xs text-muted-foreground">
              {today.length + overdue.length} total · {topToday.length} shown
            </div>
          </div>
          {isLoading ? <div className="text-muted-foreground">Loading...</div> : <TaskList tasks={topToday} />}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg font-semibold">Next 7 days</div>
            <div className="text-xs text-muted-foreground">
              {upcoming.length} total · {topUpcoming.length} shown
            </div>
          </div>
          {isLoading ? <div className="text-muted-foreground">Loading...</div> : <TaskList tasks={topUpcoming} />}
        </div>
      </div>
    </div>
  );
}



