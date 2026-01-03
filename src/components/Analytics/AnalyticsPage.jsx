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
import { ChevronRight, ChevronLeft } from 'lucide-react';
import Button from '../UI/Button';

const AnalyticsPage = () => {
    const { entries } = useData();

    const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear().toString());
    const [isYearDropdownOpen, setIsYearDropdownOpen] = React.useState(false);

    // Graph visibility state
    const [visibleLines, setVisibleLines] = React.useState({
        salary: true,
        expense: true,
        savings: true
    });

    const toggleLine = (key) => {
        setVisibleLines(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handlePrevYear = () => {
        if (availableYears.length === 0) return;
        if (selectedYear === 'All') {
            setSelectedYear(availableYears[0]); // Default to newest
            return;
        }
        const currentIndex = availableYears.indexOf(selectedYear);
        if (currentIndex < availableYears.length - 1) {
            setSelectedYear(availableYears[currentIndex + 1]); // Go to older year (next index in desc sorted list)
        } else {
            // Optional: Wrap around or stop? Let's stop. 
            // Or maybe go to 'All' after oldest? Let's keep it simple.
        }
    };

    const handleNextYear = () => {
        if (availableYears.length === 0) return;
        if (selectedYear === 'All') {
            setSelectedYear(availableYears[0]);
            return;
        }
        const currentIndex = availableYears.indexOf(selectedYear);
        if (currentIndex > 0) {
            setSelectedYear(availableYears[currentIndex - 1]); // Go to newer year (prev index)
        } else if (currentIndex === 0) {
            // Already at newest
            // Maybe switch to 'All'? 
            setSelectedYear('All');
        }
    };

    // Extract unique years from entries
    const availableYears = useMemo(() => {
        const years = new Set(entries.map(e => e.month.split(' ')[1]));
        const currentYear = new Date().getFullYear().toString();
        years.add(currentYear);
        return Array.from(years).sort((a, b) => b - a); // Newest first
    }, [entries]);

    // Ensure selectedYear is valid (if not in list, default to newest)
    React.useEffect(() => {
        if (selectedYear !== 'All' && availableYears.length > 0 && !availableYears.includes(selectedYear)) {
            setSelectedYear(availableYears[0]);
        }
    }, [availableYears, selectedYear]);

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


        // Filter by selected year
        const filtered = selectedYear === 'All'
            ? entries
            : entries.filter(entry => entry.month.endsWith(selectedYear));

        // Clone and sort chronologically (Oldest -> Newest)
        const sorted = [...filtered].sort((a, b) => getMonthValue(a.month) - getMonthValue(b.month));

        return sorted.map(entry => ({
            name: entry.month,
            salary: Number(entry.salary) || 0,
            expense: Number(entry.expense) || 0,
            savings: Number(entry.savings) || 0
        }));
    }, [entries, selectedYear]);

    const formatCurrency = (value) => new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(value);

    return (
        <div className="container" style={{ paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>Financial Trends</h2>
                    <p style={{ color: 'var(--color-text-muted)' }}>Visualize your income, expenses, and savings over time.</p>
                </div>

                {/* Year Filter Dropdown with Arrows */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Button variant="ghost" onClick={handlePrevYear} disabled={selectedYear !== 'All' && selectedYear === availableYears[availableYears.length - 1]} style={{ padding: '0.5rem' }}>
                        <ChevronLeft size={20} />
                    </Button>
                    <div style={{ position: 'relative', minWidth: '120px' }}>
                        <div
                            onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                            className="input-field"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                background: 'var(--color-bg-card)',
                                color: 'var(--color-text-main)',
                                fontWeight: 500,
                                padding: '0.5rem 1rem',
                                border: '1px solid var(--color-border)',
                                borderRadius: '8px'
                            }}
                        >
                            <span>{selectedYear === 'All' ? 'All Years' : selectedYear}</span>
                            <ChevronRight size={16} style={{ transform: isYearDropdownOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                        </div>
                        {isYearDropdownOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                left: 0,
                                background: 'var(--color-bg-surface)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '8px',
                                marginTop: '4px',
                                zIndex: 1000,
                                boxShadow: 'var(--shadow-md)',
                                maxHeight: '200px',
                                overflowY: 'auto'
                            }}>
                                <div
                                    onClick={() => {
                                        setSelectedYear('All');
                                        setIsYearDropdownOpen(false);
                                    }}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                        background: selectedYear === 'All' ? 'var(--color-bg-subtle)' : 'transparent',
                                        color: selectedYear === 'All' ? 'var(--color-primary)' : 'var(--color-text-main)',
                                        fontWeight: selectedYear === 'All' ? 600 : 400
                                    }}
                                    onMouseEnter={(e) => {
                                        if (selectedYear !== 'All') e.currentTarget.style.background = 'var(--color-bg-subtle)';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (selectedYear !== 'All') e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    All Years
                                </div>
                                {availableYears.map(year => (
                                    <div
                                        key={year}
                                        onClick={() => {
                                            setSelectedYear(year);
                                            setIsYearDropdownOpen(false);
                                        }}
                                        style={{
                                            padding: '0.75rem 1rem',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s',
                                            background: selectedYear === year ? 'var(--color-bg-subtle)' : 'transparent',
                                            color: selectedYear === year ? 'var(--color-primary)' : 'var(--color-text-main)',
                                            fontWeight: selectedYear === year ? 600 : 400
                                        }}
                                        onMouseEnter={(e) => {
                                            if (selectedYear !== year) e.currentTarget.style.background = 'var(--color-bg-subtle)';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (selectedYear !== year) e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        {year}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <Button variant="ghost" onClick={handleNextYear} disabled={selectedYear === 'All'} style={{ padding: '0.5rem' }}>
                        <ChevronRight size={20} />
                    </Button>
                </div>
            </div>

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
                            <Legend
                                content={() => (
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', paddingTop: '20px', userSelect: 'none' }}>
                                        {[
                                            { key: 'expense', label: 'Expense', color: '#ef4444' },
                                            { key: 'salary', label: 'Salary', color: '#10b981' },
                                            { key: 'savings', label: 'Savings', color: '#8b5cf6' }
                                        ].map(({ key, label, color }) => {
                                            const isActive = visibleLines[key];
                                            return (
                                                <div
                                                    key={key}
                                                    onClick={() => toggleLine(key)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.75rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {/* Toggle Switch */}
                                                    <div style={{
                                                        width: '36px',
                                                        height: '20px',
                                                        backgroundColor: isActive ? color : 'var(--color-border)',
                                                        borderRadius: '999px',
                                                        position: 'relative',
                                                        transition: 'background-color 0.2s ease'
                                                    }}>
                                                        <div style={{
                                                            width: '16px',
                                                            height: '16px',
                                                            backgroundColor: '#fff',
                                                            borderRadius: '50%',
                                                            position: 'absolute',
                                                            top: '2px',
                                                            left: isActive ? '18px' : '2px',
                                                            transition: 'left 0.2s ease',
                                                            boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                                                        }} />
                                                    </div>

                                                    {/* Label */}
                                                    <span style={{
                                                        fontSize: '0.875rem',
                                                        fontWeight: 500,
                                                        color: isActive ? 'var(--color-text-main)' : 'var(--color-text-muted)',
                                                        transition: 'color 0.2s'
                                                    }}>{label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            />
                            <Line
                                type="monotone"
                                dataKey="salary"
                                stroke="#10b981" // emerald-500
                                strokeWidth={2}
                                name="Salary"
                                dot={{ r: 4, strokeWidth: 2 }}
                                activeDot={{ r: 6 }}
                                hide={!visibleLines.salary}
                            />
                            <Line
                                type="monotone"
                                dataKey="expense"
                                stroke="#ef4444" // red-500
                                strokeWidth={2}
                                name="Expense"
                                dot={{ r: 4, strokeWidth: 2 }}
                                activeDot={{ r: 6 }}
                                hide={!visibleLines.expense}
                            />
                            <Line
                                type="monotone"
                                dataKey="savings"
                                stroke="#8b5cf6" // violet-500 (Primary)
                                strokeWidth={3}
                                name="Savings"
                                dot={{ r: 4, strokeWidth: 2 }}
                                activeDot={{ r: 6 }}
                                hide={!visibleLines.savings}
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
