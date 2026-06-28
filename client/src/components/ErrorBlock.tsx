interface ErrorBlockProps {
  text?: string;
}

const ErrorBlock = ({ text = 'Something went wrong.' }: ErrorBlockProps) => (
  <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-sm text-rose-300">{text}</div>
);

export default ErrorBlock;