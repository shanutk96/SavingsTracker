import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const AnalyticsPage = () => {
    const { entries } = useData();

    const data = useMemo(() => {
        // Helper to parse "Jan 2025" to a comparable value
        const getMonthValue = (monthStr) => {
            const [m, y] = monthStr.split(' ');
            const monthIndex = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ].indexOf(m);

            if (monthIndex === -1) {
                return (Number(y) * 12) + [
                    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                ].indexOf(m);
            }
            return (Number(y) * 12) + monthIndex;
        };

        // Clone and sort chronologically (Oldest -> Newest)
        const sorted = [...entries].sort((a, b) => getMonthValue(a.month) - getMonthValue(b.month));

        return sorted.map(entry => ({
            name: entry.month,
            salary: Number(entry.salary) || 0,
            expense: Number(entry.expense) || 0,
            savings: Number(entry.savings) || 0
        }));
    }, [entries]);

    const formatCurrency = (value) => new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(value);

    return (
        <div className="container" style={{ paddingBottom: '4rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>Financial Trends</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Visualize your income, expenses, and savings over time.</p>

            <div className="card" style={{ height: '400px', width: '100%', padding: '1.5rem' }}>
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="var(--color-text-muted)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="var(--color-text-muted)"
                                fontSize={12}
                                tickFormatter={(val) => `₹${val / 1000}k`}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--color-bg-surface)',
                                    borderColor: 'var(--color-border)',
                                    borderRadius: '8px',
                                    boxShadow: 'var(--shadow-md)'
                                }}
                                formatter={(value) => formatCurrency(value)}
                                labelStyle={{ color: 'var(--color-text-main)', fontWeight: 600 }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Line
                                type="monotone"
                                dataKey="salary"
                                stroke="#10b981" // emerald-500
                                strokeWidth={2}
                                name="Salary"
                                dot={{ r: 4, strokeWidth: 2 }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="expense"
                                stroke="#ef4444" // red-500
                                strokeWidth={2}
                                name="Expense"
                                dot={{ r: 4, strokeWidth: 2 }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="savings"
                                stroke="#8b5cf6" // violet-500 (Primary)
                                strokeWidth={3}
                                name="Savings"
                                dot={{ r: 4, strokeWidth: 2 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div style={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-text-muted)',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        <p>No data available to display.</p>
                        <p style={{ fontSize: '0.875rem' }}>Add monthly entries to see the graph.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalyticsPage;
