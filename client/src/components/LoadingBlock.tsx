interface LoadingBlockProps {
  text?: string;
}

const LoadingBlock = ({ text = 'Loading...' }: LoadingBlockProps) => (
  <div className="shell-panel rounded-2xl p-6 text-sm text-muted">{text}</div>
);

export default LoadingBlock;