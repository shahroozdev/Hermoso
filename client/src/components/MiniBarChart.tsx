const MiniBarChart = ({ items = [], valueKey = 'totalBookings', labelKey = 'month' }) => {
  const max = Math.max(...items.map((i) => Number(i[valueKey] || 0)), 1);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
      {items.map((item, index) => {
        const value = Number(item[valueKey] || 0);
        const height = Math.max(12, Math.round((value / max) * 120));
        const accent = index === items.length - 1 ? 'from-violet-500 to-fuchsia-400' : 'from-indigo-700/60 to-violet-700/30';

        return (
          <div key={item[labelKey]} className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-3">
            <p className="text-xs text-muted">{item[labelKey]}</p>
            <div className="mt-2 flex h-32 items-end">
              <div className={`w-full rounded bg-gradient-to-t ${accent}`} style={{ height }} />
            </div>
            <p className="mt-2 text-sm font-semibold text-[var(--text)]">{value}</p>
          </div>
        );
      })}
    </div>
  );
};

export default MiniBarChart;
