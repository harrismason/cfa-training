import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart, Line, CartesianGrid,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip,
} from 'recharts';
import { useAppContext } from '../context/AppContext';
import PageContainer from '../components/layout/PageContainer';
import { STATUS } from '../constants/theme';
import styles from './AnalyticsPage.module.css';

// ── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const [val, name] = formatter ? formatter(item.value, item.name, item) : [item.value, item.name];
  return (
    <div className={styles.tooltip}>
      {label && <div className={styles.tooltipLabel}>{label}</div>}
      <div className={styles.tooltipVal}>{name}: <strong>{val}</strong></div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function truncate(str, max = 16) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { trainees, positions, shifts, recordMap, deriveStatus } = useAppContext();

  const isEmpty = trainees.length === 0 || positions.length === 0;
  const hasShifts = shifts.some(s => s.completedDate);

  // 1. Training Velocity — last 8 weeks
  const velocityData = useMemo(() => {
    const total = trainees.length * positions.length;
    if (total === 0) return [];
    const today = new Date();
    return Array.from({ length: 8 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - 7 * (7 - i));
      const weekDate = d.toISOString().split('T')[0];
      let trained = 0;
      trainees.forEach(t => {
        positions.forEach(p => {
          const req = p.requiredShifts ?? 3;
          const count = shifts.filter(
            s => s.traineeId === t.id && s.positionId === p.id && s.completedDate && s.completedDate <= weekDate
          ).length;
          if (count >= req) trained++;
        });
      });
      const label = new Date(weekDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return { week: label, pct: Math.round((trained / total) * 100) };
    });
  }, [trainees, positions, shifts]);

  // 2. Coverage by position — % of trainees trained
  const coverageData = useMemo(() => {
    return positions.map(p => {
      const req = p.requiredShifts ?? 3;
      const trained = trainees.filter(t => {
        const count = shifts.filter(s => s.traineeId === t.id && s.positionId === p.id && s.completedDate).length;
        return count >= req;
      }).length;
      return {
        name: truncate(p.name),
        fullName: p.name,
        pct: trainees.length > 0 ? Math.round((trained / trainees.length) * 100) : 0,
        trained,
        total: trainees.length,
      };
    }).sort((a, b) => b.pct - a.pct);
  }, [positions, trainees, shifts]);

  // 3. Avg days to certify by position
  const certifyData = useMemo(() => {
    return positions.map(p => {
      const req = p.requiredShifts ?? 3;
      const daysList = [];
      trainees.forEach(t => {
        const completed = shifts
          .filter(s => s.traineeId === t.id && s.positionId === p.id && s.completedDate)
          .sort((a, b) => a.completedDate.localeCompare(b.completedDate));
        if (completed.length >= req) {
          const first = new Date(completed[0].completedDate + 'T00:00:00');
          const nth   = new Date(completed[req - 1].completedDate + 'T00:00:00');
          const days  = Math.ceil((nth - first) / 86400000);
          if (days >= 0) daysList.push(days);
        }
      });
      if (daysList.length === 0) return null;
      const avg = Math.round(daysList.reduce((s, d) => s + d, 0) / daysList.length);
      return { name: truncate(p.name), fullName: p.name, avgDays: avg, n: daysList.length };
    }).filter(Boolean).sort((a, b) => b.avgDays - a.avgDays);
  }, [positions, trainees, shifts]);

  // 4. Trainer effectiveness — avg rating per trainer
  const trainerData = useMemo(() => {
    const map = new Map();
    shifts.forEach(s => {
      if (!s.trainerId || !s.completedDate) return;
      if (!map.has(s.trainerId)) map.set(s.trainerId, { ratings: [], count: 0 });
      const e = map.get(s.trainerId);
      e.count++;
      if (s.rating != null) e.ratings.push(s.rating);
    });
    return [...map.entries()].map(([id, { ratings, count }]) => {
      const trainer = trainees.find(t => t.id === id);
      const avg = ratings.length > 0
        ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10
        : null;
      return { name: truncate(trainer?.name ?? 'Unknown', 12), fullName: trainer?.name ?? 'Unknown', avg, count };
    }).filter(d => d.avg != null).sort((a, b) => b.avg - a.avg);
  }, [shifts, trainees]);

  // 5. Status distribution pie
  const statusData = useMemo(() => {
    const counts = { [STATUS.NOT_STARTED]: 0, [STATUS.IN_PROGRESS]: 0, [STATUS.TRAINED]: 0, [STATUS.NEEDS_RECERT]: 0 };
    trainees.forEach(t => {
      positions.forEach(p => {
        const record = recordMap.get(`${t.id}::${p.id}`);
        const req = record?.requiredShifts ?? p.requiredShifts ?? 3;
        const s = deriveStatus(t.id, p.id, req);
        counts[s] = (counts[s] ?? 0) + 1;
      });
    });
    return [
      { name: 'Not Started',  value: counts[STATUS.NOT_STARTED],  color: '#9E9E9E' },
      { name: 'In Progress',  value: counts[STATUS.IN_PROGRESS],  color: '#F57C00' },
      { name: 'Trained',      value: counts[STATUS.TRAINED],      color: '#2E7D32' },
      { name: 'Needs Recert', value: counts[STATUS.NEEDS_RECERT], color: '#7B1FA2' },
    ].filter(d => d.value > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainees, positions, recordMap, deriveStatus]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (isEmpty) {
    return (
      <PageContainer>
        <div className={styles.pageHeader}>
          <h1 className={styles.title}>📊 Analytics</h1>
        </div>
        <div className={styles.emptyWrap}>
          <div className={styles.emptyIcon}>📊</div>
          <p className={styles.emptyMsg}>
            Add some <Link to="/trainees" className={styles.emptyLink}>trainees</Link> and{' '}
            <Link to="/positions" className={styles.emptyLink}>positions</Link>, then log training shifts to see analytics.
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>📊 Analytics</h1>
        <p className={styles.subtitle}>
          {trainees.length} trainee{trainees.length !== 1 ? 's' : ''} · {positions.length} position{positions.length !== 1 ? 's' : ''} · {shifts.filter(s => s.completedDate).length} completed shifts
        </p>
      </div>

      <div className={styles.grid}>

        {/* 1. Training Velocity */}
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Training Velocity — last 8 weeks</h2>
          {!hasShifts ? (
            <p className={styles.noData}>No completed shifts yet — start logging training to see the trend.</p>
          ) : (
            <div className={styles.chartWrap}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={velocityData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#666' }} />
                  <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: '#666' }} width={40} />
                  <Tooltip
                    content={<ChartTooltip formatter={v => [`${v}%`, '% Trained']} />}
                  />
                  <Line
                    type="monotone"
                    dataKey="pct"
                    stroke="#E4002B"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#E4002B', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                    name="% Trained"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Row 2: Coverage + Status */}
        <div className={styles.row}>
          {/* 2. Coverage by Position */}
          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Coverage by Position</h2>
            {coverageData.length === 0 ? (
              <p className={styles.noData}>No positions to display.</p>
            ) : (
              <div className={styles.chartWrapTall}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={coverageData}
                    layout="vertical"
                    margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: '#666' }} />
                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10, fill: '#666' }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className={styles.tooltip}>
                            <div className={styles.tooltipLabel}>{d.fullName}</div>
                            <div className={styles.tooltipVal}>Trained: <strong>{d.trained}/{d.total} ({d.pct}%)</strong></div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="pct" radius={[0, 3, 3, 0]}>
                      {coverageData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.pct === 100 ? '#2E7D32' : entry.pct >= 50 ? '#F57C00' : '#E4002B'}
                          fillOpacity={0.85}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* 3. Status Distribution */}
          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Status Breakdown</h2>
            {statusData.length === 0 ? (
              <p className={styles.noData}>No data.</p>
            ) : (
              <>
                <div className={styles.chartWrap}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius="40%"
                        outerRadius="70%"
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {statusData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          const total = statusData.reduce((s, x) => s + x.value, 0);
                          return (
                            <div className={styles.tooltip}>
                              <div className={styles.tooltipLabel}>{d.name}</div>
                              <div className={styles.tooltipVal}>
                                <strong>{d.value}</strong> ({Math.round(d.value / total * 100)}%)
                              </div>
                            </div>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className={styles.pieLegend}>
                  {statusData.map((d, i) => {
                    const total = statusData.reduce((s, x) => s + x.value, 0);
                    return (
                      <div key={i} className={styles.pieLegendItem}>
                        <div className={styles.pieDot} style={{ background: d.color }} />
                        <span>{d.name}: <strong>{d.value}</strong> ({Math.round(d.value / total * 100)}%)</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Row 3: Certify + Trainer */}
        <div className={styles.row}>
          {/* 4. Avg Days to Certify */}
          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Avg Days to Certify</h2>
            {certifyData.length === 0 ? (
              <p className={styles.noData}>No positions with fully certified trainees yet.</p>
            ) : (
              <div className={styles.chartWrapTall}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={certifyData}
                    layout="vertical"
                    margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#666' }} tickFormatter={v => `${v}d`} />
                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10, fill: '#666' }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className={styles.tooltip}>
                            <div className={styles.tooltipLabel}>{d.fullName}</div>
                            <div className={styles.tooltipVal}>Avg: <strong>{d.avgDays} days</strong> ({d.n} trainee{d.n !== 1 ? 's' : ''})</div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="avgDays" fill="#F57C00" fillOpacity={0.85} radius={[0, 3, 3, 0]} name="Avg days" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* 5. Trainer Effectiveness */}
          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Trainer Effectiveness</h2>
            {trainerData.length === 0 ? (
              <p className={styles.noData}>No rated shifts with trainer assignments yet.</p>
            ) : (
              <div className={styles.chartWrapTall}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={trainerData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#666' }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fill: '#666' }} tickFormatter={v => `${v}★`} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className={styles.tooltip}>
                            <div className={styles.tooltipLabel}>{d.fullName}</div>
                            <div className={styles.tooltipVal}>Avg rating: <strong>{d.avg} ★</strong></div>
                            <div className={styles.tooltipVal}>Shifts: <strong>{d.count}</strong></div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="avg" fill="#2E7D32" fillOpacity={0.85} radius={[3, 3, 0, 0]} name="Avg rating">
                      {trainerData.map((_, i) => (
                        <Cell key={i} fill="#2E7D32" fillOpacity={0.75 + (i === 0 ? 0.25 : 0)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

      </div>
    </PageContainer>
  );
}
