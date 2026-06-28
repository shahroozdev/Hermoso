interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
}

const StatCard = ({ title, value, trend }: StatCardProps) => (
  <div className="shell-card rounded-2xl p-5">
    <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{title}</p>
    <p className="mt-2 text-3xl font-bold text-[var(--accent-2)]">{value}</p>
    {trend ? <p className="mt-2 text-xs font-medium text-emerald-400">{trend}</p> : null}
  </div>
);

export default StatCard;