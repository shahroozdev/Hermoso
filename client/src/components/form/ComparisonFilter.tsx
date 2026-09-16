interface ComparisonFilterProps {
  label?: string;
  operator: string;
  value: string;
  onOperatorChange: (v: string) => void;
  onValueChange: (v: string) => void;
  height?: number;
  placeholder?: string;
}

const OPERATORS = [">", "<", ">=", "<=", "="];

const nonNegative = (v: string) => v.replace(/-/g, "");

const ComparisonFilter = ({ label, operator, value, onOperatorChange, onValueChange, height, placeholder }: ComparisonFilterProps) => (
  <div style={{maxHeight:height }}>
    {label && (
      <label className="mb-1 block text-xs font-semibold uppercase text-muted">{label}</label>
    )}
    <div className="ha-combo-field">
      <select
        className="ha-input"
        style={height ? { maxHeight: height, padding: 5 } : undefined}
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
        min="0"
        className="ha-input"
        style={height ? { maxHeight: height, padding: 5 } : undefined}
        placeholder={placeholder || "Value"}
        value={value}
        onChange={(e) => onValueChange(nonNegative(e.target.value))}
      />
    </div>
  </div>
);

export default ComparisonFilter;
