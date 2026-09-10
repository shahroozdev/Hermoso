import { forwardRef, type InputHTMLAttributes } from 'react';

// Native time pickers follow the OS locale. Keep HH:mm explicit on every device.
const Time24Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>((props, ref) => (
  <input {...props} ref={ref} type="text" inputMode="numeric" placeholder="HH:mm (00:00–23:59)" maxLength={5} pattern="([01][0-9]|2[0-3]):[0-5][0-9]" title="24-hour time, 00:00 to 23:59" />
));
Time24Input.displayName = 'Time24Input';
export default Time24Input;
