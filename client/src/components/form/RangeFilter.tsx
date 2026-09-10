import { useState } from 'react';

interface RangeFilterProps {
  label: string;
  min: string;
  max: string;
  onMin: (v: string) => void;
  onMax: (v: string) => void;
}

const RangeFilter = ({ label, min, max, onMin, onMax }: RangeFilterProps) => {
  const [operator, setOperator] = useState(() => min && max && min === max ? 'eq' : min && !max ? 'gte' : max && !min ? 'lte' : 'between');
  const changeOperator = (next: string) => {
    setOperator(next);
    const value = min || max;
    onMin(next === 'lte' ? '' : value);
    onMax(next === 'gte' ? '' : next === 'eq' || next === 'lte' ? value : max);
  };
  return (
    <div className="min-w-0">
      <label className="mb-1 block text-xs font-semibold uppercase text-muted">{label}</label>
      <select className="ha-input mb-1" aria-label={`${label} comparison`} value={operator} onChange={(e) => changeOperator(e.target.value)}>
        <option value="between">Between (inclusive)</option>
        <option value="eq">Equal to (=)</option>
        <option value="gte">Greater than or equal to (≥)</option>
        <option value="lte">Less than or equal to (≤)</option>
      </select>
      <div className="flex gap-1.5">
        <input type="number" step="any" className="ha-input min-w-0" aria-label={`${label} ${operator === 'between' ? 'minimum' : 'value'}`} placeholder={operator === 'between' ? 'Min' : 'Value'} value={operator === 'lte' ? max : min} onChange={(e) => {
          if (operator !== 'lte') onMin(e.target.value);
          if (operator === 'lte' || operator === 'eq') onMax(e.target.value);
        }} />
        {operator === 'between' && <input type="number" step="any" className="ha-input min-w-0" aria-label={`${label} maximum`} placeholder="Max" value={max} onChange={(e) => onMax(e.target.value)} />}
      </div>
    </div>
  );
};

export default RangeFilter;
