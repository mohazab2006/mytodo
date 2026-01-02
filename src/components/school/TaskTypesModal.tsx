import { useMemo, useState } from 'react';
import ColorPicker from '../ui/ColorPicker';
import { useCreateTaskType, useDeleteTaskType, useTaskTypes, useUpdateTaskType } from '../../hooks/useTaskTypes';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskTypesModal({ isOpen, onClose }: Props) {
  const { data: taskTypes = [] } = useTaskTypes();
  const createType = useCreateTaskType();
  const updateType = useUpdateTaskType();
  const deleteType = useDeleteTaskType();

  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6B7280');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return taskTypes;
    return taskTypes.filter((t) => t.name.toLowerCase().includes(q));
  }, [taskTypes, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-xl w-full max-w-xl max-h-[85vh] overflow-hidden shadow-xl flex flex-col">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Task Types</div>
            <div className="text-xs text-muted-foreground">Used for color-coded tags like Exam / Assignment.</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="flex items-center gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search types…"
              className="flex-1 px-3 py-2 bg-muted/40 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <div className="grid grid-cols-[44px_1fr_44px] bg-muted/40 text-xs text-muted-foreground">
              <div className="px-3 py-2">Color</div>
              <div className="px-3 py-2">Name</div>
              <div className="px-3 py-2 text-right"> </div>
            </div>

            <div className="divide-y divide-border">
              {filtered.map((t) => (
                <div key={t.id} className="grid grid-cols-[44px_1fr_44px] items-center">
                  <div className="px-3 py-2">
                    <button
                      type="button"
                      className="w-5 h-5 rounded-sm border border-border"
                      style={{ backgroundColor: t.color }}
                      title="Change color"
                      onClick={() => {
                        // Quick cycle: open small inline palette by using prompt-like UX (simple + clean)
                        // We keep the full picker below for adding; here we just set to current so user can edit via picker row.
                        setNewColor(t.color);
                        setNewName(t.name);
                      }}
                    />
                  </div>
                  <div className="px-3 py-2">
                    <input
                      defaultValue={t.name}
                      onBlur={(e) => {
                        const name = e.target.value.trim();
                        if (!name || name === t.name) return;
                        updateType.mutate({ id: t.id, name });
                      }}
                      className="w-full bg-transparent text-sm px-2 py-1 rounded-md hover:bg-muted/40 focus:bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    />
                  </div>
                  <div className="px-3 py-2 flex justify-end">
                    <button
                      type="button"
                      className="w-8 h-8 rounded-md hover:bg-muted text-muted-foreground hover:text-red-500"
                      title="Delete type"
                      onClick={() => {
                        if (
                          confirm(
                            `Delete "${t.name}"? Tasks using it will be moved to "Other".`
                          )
                        ) {
                          deleteType.mutate(t.id);
                        }
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}

              {filtered.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No matching types.</div>
              ) : null}
            </div>
          </div>

          <div className="border border-border rounded-lg p-4 bg-muted/30">
            <div className="text-sm font-medium mb-3">Add a type</div>
            <div className="flex items-center gap-3 flex-wrap">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Discussion Post"
                className="flex-1 min-w-[220px] px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
              <ColorPicker value={newColor} onChange={setNewColor} />
              <button
                type="button"
                onClick={() => {
                  const name = newName.trim();
                  if (!name) return;
                  createType.mutate({ name, color: newColor });
                  setNewName('');
                }}
                className="px-3 py-2 rounded-md bg-foreground text-background text-sm hover:opacity-90"
              >
                Add
              </button>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Tip: rename types inline in the list above.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


