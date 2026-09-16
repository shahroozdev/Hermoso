import { useState } from 'react';

interface RangeFilterProps {
  label: string;
  min: string;
  max: string;
  onMin: (v: string) => void;
  onMax: (v: string) => void;
  operator?: string;
  onOperator?: (v: string) => void;
}

const nonNegative = (v: string) => v.replace(/-/g, '');

const RangeFilter = ({ label, min, max, onMin, onMax, operator: selectedOperator, onOperator }: RangeFilterProps) => {
  const [localOperator, setOperator] = useState('gte');
  const operator = onOperator ? selectedOperator || 'gte' : localOperator;
  const changeOperator = (next: string) => {
    setOperator(next);
    onOperator?.(next);
    const value = min || max;
    onMin(next === 'lte' || next === 'lt' ? '' : value);
    onMax(next === 'gte' || next === 'gt' ? '' : next === 'eq' || next === 'lte' || next === 'lt' ? value : max);
  };
  return (
    <div className="ha-range-filter">
      <label className="mb-1 block text-xs font-semibold uppercase text-muted">{label}</label>
      <div className="ha-range-controls ha-combo-field">
      <select className="ha-input" aria-label={`${label} comparison`} value={operator} onChange={(e) => changeOperator(e.target.value)}>
        <option value="between">↔</option>
        <option value="eq">=</option>
        {onOperator && <option value="gt">&gt;</option>}
        {onOperator && <option value="lt">&lt;</option>}
        <option value="gte">≥</option>
        <option value="lte">≤</option>
      </select>
      <input type="number" step="any" min="0" className="ha-input" aria-label={`${label} ${operator === 'between' ? 'minimum' : 'value'}`} placeholder={operator === 'between' ? 'Min' : 'Value'} value={operator === 'lte' || operator === 'lt' ? max : min} onChange={(e) => {
        const value = nonNegative(e.target.value);
        if (operator !== 'lte' && operator !== 'lt') onMin(value);
        if (operator === 'lte' || operator === 'lt' || operator === 'eq') onMax(value);
      }} />
      {operator === 'between' && <input type="number" step="any" min="0" className="ha-input" aria-label={`${label} maximum`} placeholder="Max" value={max} onChange={(e) => onMax(nonNegative(e.target.value))} />}
      </div>
    </div>
  );
};

export default RangeFilter;
