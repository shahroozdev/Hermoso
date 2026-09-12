interface MetricChartProps {
  title: string;
  points: { label: string; value: number }[];
  format?: (value: number) => string;
}

// Real values stay visible beside each bar; zero/empty series never invent data.
export default function MetricChart({title, points, format = value => value.toLocaleString()}: MetricChartProps) {
  const max = Math.max(1, ...points.map(point=>point.value));
  return <section className="ha-card ha-metric-chart" aria-label={title}>
    <h3 className="ha-card-title">{title}</h3>
    {!points.length ? <p className="text-muted text-sm">No data for this period.</p> : <ul>
      {points.map(point=><li key={point.label}>
        <div><span>{point.label.replace(/_/g,' ')}</span><strong>{format(point.value)}</strong></div>
        <div className="ha-metric-track"><span style={{width:`${Math.max(0, point.value)/max*100}%`}} /></div>
      </li>)}
    </ul>}
  </section>;
}
