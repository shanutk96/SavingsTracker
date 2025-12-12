import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

const SavingsTable = ({ entries, onEdit, onDelete }) => {
    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-IN').format(val); // Using en-IN as the image implies Lakhs potentially, or just Generic
    };

    const getStyleForValue = (val, type) => {
        if (type === 'expense' || type === 'extra') return { color: 'var(--color-danger)' };
        if (type === 'savings') return { color: 'var(--color-success)', fontWeight: 600 };
        return {};
    };

    return (
        <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
            <table style={{ background: 'var(--color-bg-surface)', whiteSpace: 'nowrap' }}>
                <thead>
                    <tr style={{ background: 'var(--color-bg-subtle)' }}>
                        <th style={{ minWidth: '120px' }}>Month</th>
                        <th style={{ color: 'var(--color-text-main)' }}>Salary</th>
                        <th style={{ color: 'var(--color-danger)' }}>Expense</th>
                        <th style={{ color: 'var(--color-success)' }}>Savings</th>
                        <th style={{ color: 'var(--color-primary)' }}>Savings %</th>
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
                                <tr key={entry.id}>
                                    <td style={{ fontWeight: 500 }}>{entry.month}</td>
                                    <td>
                                        {formatCurrency(entry.salary || 0)}
                                    </td>
                                    <td style={getStyleForValue(entry.expense, 'expense')}>
                                        {formatCurrency(entry.expense)}
                                    </td>
                                    <td style={getStyleForValue(entry.savings, 'savings')}>
                                        {formatCurrency(entry.savings)}
                                    </td>
                                    <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                                        {percentage.toFixed(1)}%
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => onEdit(entry)}
                                                className="btn btn-ghost"
                                                style={{ padding: '0.25rem 0.5rem' }}
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(entry.id)}
                                                title="Delete"
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'var(--color-text-muted)',
                                                    padding: '0.25rem 0.5rem',
                                                    cursor: 'pointer',
                                                    borderRadius: 'var(--radius-md)',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
                                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                                            >
                                                <Trash2 size={16} />
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
    );
};

export default SavingsTable;
