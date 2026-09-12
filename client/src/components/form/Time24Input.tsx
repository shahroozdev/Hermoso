import { forwardRef, useEffect, useRef, useState, type ChangeEvent, type InputHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';

// Keep an explicit 24-hour display and provide every hour/minute in the picker,
// independently of the operating system's AM/PM preference.
const Time24Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>((props, ref) => {
  const input = useRef<HTMLInputElement | null>(null);
  const popup = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{top: number; left: number} | null>(null);
  const [hour, setHour] = useState('00');
  const [minute, setMinute] = useState('00');
  useEffect(() => {
    if (!position) return;
    const close = (event: MouseEvent) => { if (!popup.current?.contains(event.target as Node)) setPosition(null); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') {event.stopPropagation(); setPosition(null);} };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape, true);
    return () => {document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape, true);};
  }, [position]);
  const open = () => {
    const el = input.current;
    if (!el) return;
    const parts = /^([01]\d|2[0-3]):[0-5]\d$/.test(el.value) ? el.value.split(':') : ['00','00'];
    setHour(parts[0]); setMinute(parts[1]);
    const rect = el.getBoundingClientRect();
    setPosition({top: Math.max(8, Math.min(rect.bottom + 4, window.innerHeight - 280)), left: Math.max(8, Math.min(rect.left, window.innerWidth - 240))});
  };
  const apply = () => {
    const el = input.current;
    if (!el) return;
    el.value = `${hour}:${minute}`;
    props.onChange?.({target: el, currentTarget: el, type: 'change'} as ChangeEvent<HTMLInputElement>);
    setPosition(null); el.focus();
  };
  return <span className="ha-time-control">
    <input {...props} ref={el => {input.current = el; if(typeof ref === 'function') ref(el); else if(ref) ref.current = el;}} type="text" inputMode="numeric" placeholder="HH:mm" maxLength={5} pattern="([01][0-9]|2[0-3]):[0-5][0-9]" title="24-hour time, 00:00 to 23:59" />
    <button type="button" className="ha-time-trigger" aria-label={`Choose time for ${props.name || props['aria-label'] || 'field'}`} disabled={props.disabled} onClick={open}>◷</button>
    {position && createPortal(<div ref={popup} className="ha-time-picker" role="dialog" aria-label="24-hour time picker" style={position}>
      <div className="ha-time-columns">
        <label>Hour<select aria-label="Hour" size={6} value={hour} onChange={e=>setHour(e.target.value)}>{Array.from({length:24},(_,i)=>String(i).padStart(2,'0')).map(v=><option key={v} value={v}>{v}</option>)}</select></label>
        <label>Minute<select aria-label="Minute" size={6} value={minute} onChange={e=>setMinute(e.target.value)}>{Array.from({length:60},(_,i)=>String(i).padStart(2,'0')).map(v=><option key={v} value={v}>{v}</option>)}</select></label>
      </div>
      <button type="button" className="ha-btn-primary" onClick={apply}>Set time</button>
    </div>,document.body)}
  </span>;
});
Time24Input.displayName = 'Time24Input';
export default Time24Input;
