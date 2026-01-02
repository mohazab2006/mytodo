interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const COLORS = [
  { name: 'Gray', value: '#6B7280' },
  { name: 'Brown', value: '#92400E' },
  { name: 'Orange', value: '#EA580C' },
  { name: 'Yellow', value: '#CA8A04' },
  { name: 'Green', value: '#16A34A' },
  { name: 'Blue', value: '#2563EB' },
  { name: 'Purple', value: '#9333EA' },
  { name: 'Pink', value: '#DB2777' },
  { name: 'Red', value: '#DC2626' },
];

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {COLORS.map((color) => (
        <button
          key={color.value}
          type="button"
          onClick={() => onChange(color.value)}
          className={`w-5 h-5 rounded-sm border transition-all ${
            value === color.value ? 'ring-2 ring-foreground/40 border-border' : 'border-border hover:border-foreground/30'
          }`}
          style={{ backgroundColor: color.value }}
          title={color.name}
        />
      ))}
    </div>
  );
}

