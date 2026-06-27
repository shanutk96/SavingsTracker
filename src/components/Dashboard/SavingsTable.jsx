import React from 'react';
import { SquarePen, Trash2 } from 'lucide-react';

const SavingsTable = ({ entries, onEdit, onDelete }) => {
    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-IN').format(val);
    };

    const getSalaryColor = (salary) => {
        const s = Number(salary);
        const hues = [
            210, // Blue
            280, // Purple
            150, // Green
            35,  // Orange
            340, // Pink
            180, // Teal
            50,  // Gold
            240  // Indigo
        ];
        const index = Math.abs(Math.floor(s * 137)) % hues.length;
        return `hsl(${hues[index]}, 70%, 96%)`;
    };

    return (
        <>
            {/* Desktop Table View */}
            <div className="desktop-only" style={{ overflowX: 'auto', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <table style={{ background: 'var(--color-bg-surface)', whiteSpace: 'nowrap' }}>
                    <thead>
                        <tr style={{ background: 'var(--color-bg-subtle)' }}>
                            <th style={{ minWidth: '120px' }}>Month</th>
                            <th style={{ color: '#2563EB' }}>Salary</th>
                            <th style={{ color: '#DC2626' }}>Expense</th>
                            <th style={{ color: '#16A34A' }}>Savings</th>
                            <th style={{ color: '#16A34A' }}>Savings %</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                                    No entries found. Add your first savings record!
                                </td>
                            </tr>
                        ) : (
                            entries.map((entry) => {
                                const percentage = entry.salary > 0 ? (entry.savings / entry.salary) * 100 : 0;

                                return (
                                    <tr key={entry.id} className="savings-row" style={{ background: getSalaryColor(entry.salary), transition: 'background-color 0.2s' }}>
                                        <td style={{ fontWeight: 500 }}>{entry.month}</td>
                                        <td>
                                            <span style={{
                                                fontWeight: 600,
                                                color: '#2563EB',
                                                background: '#EFF6FF',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                display: 'inline-block'
                                            }}>
                                                {formatCurrency(entry.salary || 0)}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{
                                                fontWeight: 600,
                                                color: '#DC2626',
                                                background: '#FEF2F2',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                display: 'inline-block'
                                            }}>
                                                {formatCurrency(entry.expense || 0)}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{
                                                fontWeight: 600,
                                                color: '#16A34A',
                                                background: '#ECFDF5',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                display: 'inline-block'
                                            }}>
                                                {formatCurrency(entry.savings || 0)}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{
                                                fontWeight: 700,
                                                color: '#16A34A',
                                                background: '#ECFDF5',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                display: 'inline-block'
                                            }}>
                                                {percentage.toFixed(1)}%
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className="action-buttons" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => onEdit(entry)}
                                                    title="Edit"
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: 'var(--color-text-muted)',
                                                        padding: '0.35rem',
                                                        cursor: 'pointer',
                                                        borderRadius: 'var(--radius-sm)',
                                                        transition: 'all 0.2s ease',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.color = 'var(--color-primary)';
                                                        e.currentTarget.style.background = 'var(--color-primary-light)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.color = 'var(--color-text-muted)';
                                                        e.currentTarget.style.background = 'transparent';
                                                    }}
                                                >
                                                    <SquarePen size={15} />
                                                </button>
                                                <button
                                                    onClick={() => onDelete(entry.id)}
                                                    title="Delete"
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: 'var(--color-text-muted)',
                                                        padding: '0.35rem',
                                                        cursor: 'pointer',
                                                        borderRadius: 'var(--radius-sm)',
                                                        transition: 'all 0.2s ease',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.color = 'var(--color-danger)';
                                                        e.currentTarget.style.background = 'var(--color-danger-bg)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.color = 'var(--color-text-muted)';
                                                        e.currentTarget.style.background = 'transparent';
                                                    }}
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card List View */}
            <div className="mobile-only">
                {entries.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-muted)', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                        No entries found. Add your first savings record!
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {entries.map((entry) => {
                            const percentage = entry.salary > 0 ? (entry.savings / entry.salary) * 100 : 0;
                            return (
                                <div 
                                    key={entry.id} 
                                    style={{
                                        background: getSalaryColor(entry.salary),
                                        padding: '1rem',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-lg)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.75rem',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text-main)' }}>{entry.month}</span>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => onEdit(entry)}
                                                style={{
                                                    background: 'var(--color-primary-light)',
                                                    border: 'none',
                                                    color: 'var(--color-primary)',
                                                    width: '44px',
                                                    height: '44px',
                                                    borderRadius: 'var(--radius-sm)',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer'
                                                }}
                                                title="Edit"
                                            >
                                                <SquarePen size={18} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(entry.id)}
                                                style={{
                                                    background: 'var(--color-danger-bg)',
                                                    border: 'none',
                                                    color: 'var(--color-danger)',
                                                    width: '44px',
                                                    height: '44px',
                                                    borderRadius: 'var(--radius-sm)',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer'
                                                }}
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '0.75rem',
                                        background: 'var(--color-bg-surface)',
                                        padding: '0.75rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--color-border)'
                                    }}>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 500, marginBottom: '2px', textTransform: 'uppercase' }}>Salary</span>
                                            <span style={{ fontWeight: 600, color: '#2563EB', fontSize: '0.9rem' }}>
                                                {formatCurrency(entry.salary || 0)}
                                            </span>
                                        </div>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 500, marginBottom: '2px', textTransform: 'uppercase' }}>Expense</span>
                                            <span style={{ fontWeight: 600, color: '#DC2626', fontSize: '0.9rem' }}>
                                                {formatCurrency(entry.expense || 0)}
                                            </span>
                                        </div>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 500, marginBottom: '2px', textTransform: 'uppercase' }}>Savings</span>
                                            <span style={{ fontWeight: 600, color: '#16A34A', fontSize: '0.9rem' }}>
                                                {formatCurrency(entry.savings || 0)}
                                            </span>
                                        </div>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 500, marginBottom: '2px', textTransform: 'uppercase' }}>Savings %</span>
                                            <span style={{ fontWeight: 700, color: '#16A34A', fontSize: '0.9rem' }}>
                                                {percentage.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
};

export default SavingsTable;
