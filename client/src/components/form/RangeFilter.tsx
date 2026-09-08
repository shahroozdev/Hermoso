interface RangeFilterProps {
  label: string;
  min: string;
  max: string;
  onMin: (v: string) => void;
  onMax: (v: string) => void;
}

const RangeFilter = ({ label, min, max, onMin, onMax }: RangeFilterProps) => (
  <div>
    <label className="mb-1 block text-xs font-semibold uppercase text-muted">{label}</label>
    <div style={{ display: "flex", gap: 6 }}>
      <input type="number" className="ha-input" placeholder="Min" value={min} onChange={(e) => onMin(e.target.value)} />
      <input type="number" className="ha-input" placeholder="Max" value={max} onChange={(e) => onMax(e.target.value)} />
    </div>
  </div>
);

export default RangeFilter;
