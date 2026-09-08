interface ComparisonFilterProps {
  label: string;
  operator: string;
  value: string;
  onOperatorChange: (v: string) => void;
  onValueChange: (v: string) => void;
}

const OPERATORS = [">", "<", ">=", "<=", "="];

const ComparisonFilter = ({ label, operator, value, onOperatorChange, onValueChange }: ComparisonFilterProps) => (
  <div>
    <label className="mb-1 block text-xs font-semibold uppercase text-muted">{label}</label>
    <div style={{ display: "flex", gap: 6 }}>
      <select
        className="ha-select"
        style={{ maxWidth: 70 }}
        value={operator}
        onChange={(e) => onOperatorChange(e.target.value)}
      >
        {OPERATORS.map((op) => (
          <option key={op} value={op}>
            {op}
          </option>
        ))}
      </select>
      <input
        type="number"
        className="ha-input"
        placeholder="Value"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
      />
    </div>
  </div>
);

export default ComparisonFilter;
