const Bar = ({ className = '' }: { className?: string }) => <div className={`ha-skeleton ${className}`.trim()} />;

const KpiRow = () => (
  <div className="ha-kpi-row">
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="ha-kpi-card">
        <Bar className="h-3 w-28" />
        <Bar className="mt-4 h-8 w-24" />
        <Bar className="mt-3 h-3 w-20" />
      </div>
    ))}
  </div>
);

const TableCard = ({ rows = 5 }: { rows?: number }) => (
  <div className="ha-card">
    <Bar className="h-5 w-48" />
    <div className="mt-4 space-y-3">
      <Bar className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Bar key={i} className="h-12 w-full" />
      ))}
    </div>
  </div>
);

const SplitCards = () => (
  <div className="ha-row-2">
    <TableCard rows={4} />
    <TableCard rows={4} />
  </div>
);

const NotificationsSkeleton = () => (
  <div className="ha-notif-grid" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 20 }}>
    <div className="ha-card">
      <Bar className="h-5 w-56" />
      <div className="mt-4 space-y-3">
        <Bar className="h-16 w-full" />
        <Bar className="h-28 w-full" />
        <Bar className="h-24 w-full" />
      </div>
    </div>
    <TableCard rows={5} />
  </div>
);

interface AdminPageSkeletonProps {
  variant?: 'table' | 'split' | 'notifications';
}

const AdminPageSkeleton = ({ variant = 'table' }: AdminPageSkeletonProps) => {
  if (variant === 'notifications') return <NotificationsSkeleton />;
  if (variant === 'split') {
    return (
      <>
        <KpiRow />
        <SplitCards />
      </>
    );
  }

  return (
    <>
      <KpiRow />
      <TableCard rows={6} />
    </>
  );
};

export default AdminPageSkeleton;