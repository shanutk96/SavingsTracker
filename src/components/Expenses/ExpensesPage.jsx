import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Plus, ChevronRight, X, Calendar, Tag, FileText, Trash2, ArrowLeft } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import Button from '../UI/Button';
import Modal from '../UI/Modal';
import ConfirmModal from '../UI/ConfirmModal';

const ExpensesPage = () => {
    const { dailyExpenses, addDailyExpense, deleteDailyExpense, evaluateMathExpression } = useData();
    const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED', '#71B37C'];

    // Month Selection
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(`${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`);

    const monthOptions = useMemo(() => {
        const options = [];
        const currentYear = currentDate.getFullYear();
        const currentMonthIndex = currentDate.getMonth();

        // Show current month onwards + next 2 years
        for (let y = currentYear; y <= currentYear + 2; y++) {
            months.forEach((m, index) => {
                if (y === currentYear && index < currentMonthIndex) return;
                options.push(`${m} ${y}`);
            });
        }
        return options;
    }, []);

    // Filter Data
    const monthlyData = useMemo(() => {
        return dailyExpenses.filter(e => e.month === selectedMonth);
    }, [dailyExpenses, selectedMonth]);

    const totalExpense = useMemo(() => {
        return monthlyData.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    }, [monthlyData]);

    // Aggregate by Category
    const categoryStats = useMemo(() => {
        const stats = {};
        monthlyData.forEach(item => {
            if (!stats[item.category]) {
                stats[item.category] = { name: item.category, value: 0, count: 0 };
            }
            stats[item.category].value += (Number(item.amount) || 0);
            stats[item.category].count += 1;
        });
        return Object.values(stats).sort((a, b) => b.value - a.value);
    }, [monthlyData]);


    // Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [viewCategory, setViewCategory] = useState(null); // If set, shows list for that category

    // Add Form State
    const [newExpense, setNewExpense] = useState({
        amount: '',
        description: '',
        category: 'Food + Grocery', // Default
        date: new Date().toISOString().split('T')[0]
    });

    const [customCategory, setCustomCategory] = useState('');
    const [isCustomCategory, setIsCustomCategory] = useState(false);

    // Delete Confirmation State
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, id: null });

    const categories = ['Own expense', 'Food + Grocery', 'Home expenses', 'Room + Other'];

    const handleAddSubmit = (e) => {
        e.preventDefault();
        const finalCategory = isCustomCategory ? customCategory : newExpense.category;
        if (!newExpense.amount || !finalCategory) return;

        // Month logic from date
        const d = new Date(newExpense.date);
        const mStr = `${months[d.getMonth()]} ${d.getFullYear()}`;

        addDailyExpense({
            ...newExpense,
            category: finalCategory,
            amount: evaluateMathExpression(newExpense.amount),
            expression: newExpense.amount,
            month: mStr
        });
        setIsAddModalOpen(false);
        setNewExpense({ ...newExpense, amount: '', description: '' });
    };

    const confirmDelete = () => {
        if (confirmConfig.id) {
            deleteDailyExpense(confirmConfig.id);
        }
        setConfirmConfig({ isOpen: false, id: null });
    };

    return (
        <div className="container" style={{ paddingBottom: '5rem' }}>
            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig({ isOpen: false, id: null })}
                onConfirm={confirmDelete}
                title="Delete Transaction"
                message="Are you sure you want to delete this transaction? This action cannot be undone."
                confirmText="Delete"
                isDanger
            />

            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>Expense</h2>
                        <p style={{ color: 'var(--color-text-muted)' }}>Record daily expenses and get a clear breakdown of your monthly spending.</p>
                    </div>
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="select-minimal"
                        style={{
                            padding: '0.5rem 2rem 0.5rem 1rem',
                            appearance: 'none',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.75rem center',
                            backgroundSize: '1em',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            background: 'var(--color-bg-card)',
                            color: 'var(--color-text-main)',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        {monthOptions.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Default View: Chart + Category List */}
            {!viewCategory && (
                <>
                    {/* Donut Chart */}
                    <div style={{ height: '300px', position: 'relative', marginBottom: '2rem' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {categoryStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)}
                                    contentStyle={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Total</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalExpense)}
                            </div>
                        </div>
                    </div>

                    {/* Category List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {categoryStats.map((cat, index) => (
                            <div
                                key={cat.name}
                                onClick={() => setViewCategory(cat.name)}
                                className="card"
                                style={{
                                    padding: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    transition: 'transform 0.1s'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: COLORS[index % COLORS.length],
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.8rem',
                                        fontWeight: 700
                                    }}>
                                        {Math.round((cat.value / totalExpense) * 100)}%
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{cat.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{cat.count} transactions</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ fontWeight: 700 }}>
                                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(cat.value)}
                                    </div>
                                    <ChevronRight size={16} color="var(--color-text-muted)" />
                                </div>
                            </div>
                        ))}

                        {categoryStats.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                No expenses yet for this month.
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Drill Down View: Transactions */}
            {viewCategory && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <button
                            onClick={() => setViewCategory(null)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'var(--color-bg-surface)',
                                border: '1px solid var(--color-border)',
                                padding: '0.5rem 1rem',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: 'var(--color-text-main)',
                                transition: 'all 0.2s',
                                boxShadow: 'var(--shadow-sm)'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                            }}
                        >
                            <ArrowLeft size={16} /> Back
                        </button>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{viewCategory}</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {monthlyData
                            .filter(item => item.category === viewCategory)
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                            .map(item => (
                                <div key={item.id} className="card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{item.description || item.category}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                            {new Date(item.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--color-danger)' }}>
                                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.amount)}
                                        </div>
                                        <button
                                            onClick={() => setConfirmConfig({ isOpen: true, id: item.id })}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--color-text-muted)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                fontSize: '0.8rem',
                                                padding: '4px',
                                                opacity: 0.7
                                            }}
                                            onMouseEnter={(e) => e.target.style.opacity = 1}
                                            onMouseLeave={(e) => e.target.style.opacity = 0.7}
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Floating Add Button */}
            <button
                onClick={() => setIsAddModalOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    background: 'var(--color-primary)', // Use Primary Color
                    color: 'white',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '1rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)', // Soft shadow
                    cursor: 'pointer',
                    fontWeight: 600,
                    zIndex: 100,
                    transition: 'transform 0.2s',
                    fontSize: '1rem'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
                <Plus size={20} /> Add transaction
            </button>

            {/* Add Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Transaction">
                <form onSubmit={handleAddSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Amount */}
                    <div>
                        <label className="label">Amount</label>
                        <input
                            autoFocus
                            type="text"
                            placeholder="0"
                            className="input-field"
                            value={newExpense.amount}
                            onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                            style={{ fontSize: '1.5rem', fontWeight: 700, padding: '1rem' }}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="label">Description</label>
                        <input
                            type="text"
                            placeholder="What was this for?"
                            className="input-field"
                            value={newExpense.description}
                            onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="label">Category</label>
                        {!isCustomCategory ? (
                            <div style={{ position: 'relative' }}>
                                <select
                                    className="input-field"
                                    value={newExpense.category}
                                    onChange={(e) => {
                                        if (e.target.value === 'custom') {
                                            setIsCustomCategory(true);
                                        } else {
                                            setNewExpense({ ...newExpense, category: e.target.value });
                                        }
                                    }}
                                    style={{
                                        appearance: 'none',
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 0.75rem center',
                                        backgroundSize: '1em',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '8px',
                                        background: 'var(--color-bg-card)',
                                        color: 'var(--color-text-main)', // Ensure text color is correct
                                        fontWeight: 500,
                                        padding: '0.75rem 2rem 0.75rem 1rem', // Slightly larger padding for form input
                                        width: '100%',
                                        cursor: 'pointer',
                                        outline: 'none',
                                        fontSize: '1rem'
                                    }}
                                >
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    <option value="custom">+ Create New Category</option>
                                </select>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    placeholder="Enter category name"
                                    className="input-field"
                                    value={customCategory}
                                    onChange={e => setCustomCategory(e.target.value)}
                                    autoFocus
                                />
                                <Button variant="ghost" onClick={() => setIsCustomCategory(false)}><X size={18} /></Button>
                            </div>
                        )}
                    </div>

                    {/* Date */}
                    <div>
                        <label className="label">Date</label>
                        <input
                            type="date"
                            className="input-field"
                            value={newExpense.date}
                            onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                        />
                    </div>

                    <Button type="submit" variant="primary" style={{ marginTop: '1rem' }}>
                        Save Transaction
                    </Button>
                </form>
            </Modal>
        </div>
    );
};

export default ExpensesPage;
