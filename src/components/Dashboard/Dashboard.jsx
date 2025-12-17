import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import StatCard from './StatCard';
import SavingsTable from './SavingsTable';
import AddEntryModal from './AddEntryModal';
import EditBalanceModal from './EditBalanceModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import Button from '../UI/Button';
import { Plus, Wallet, PiggyBank, Receipt, TrendingUp } from 'lucide-react';

const Dashboard = () => {
    const { entries, addEntry, updateEntry, deleteEntry, initialBalance, updateInitialBalance } = useData();
    const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
    const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState(null);
    const [editingEntry, setEditingEntry] = useState(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [salaryFilter, setSalaryFilter] = useState('Overall');

    // Extract unique years from entries
    const availableYears = [...new Set(entries.map(e => e.month.split(' ')[1]))].sort((a, b) => b - a);

    // Filter Entries
    const filteredEntries = selectedYear === 'All'
        ? entries
        : entries.filter(e => e.month.includes(selectedYear));

    // Calculate Yearly Total Savings (Sum of savings for that year mostly)
    // Note: The "Total Savings (EoM)" column in the table is a running total.
    // The user likely wants to know how much they saved *in that specific year*, i.e., sum of monthly savings.
    const yearlySavings = filteredEntries.reduce((acc, curr) => acc + (Number(curr.savings) || 0), 0);


    // Calculate Stats
    const totalEntries = entries.length;
    // Total Savings is the final running total (Initial + All Monthly Savings)
    // Since entries are sorted descending (newest first), the first entry has the latest cumulative total.
    // However, if we filter/sort differently in table, we should rely on the calculation. 
    // DataContext returns entries sorted Descending (newest first).
    // So entries[0].totalSavings is the current Total Balance.
    const currentTotalSavings = entries.length > 0 ? entries[0].totalSavings : initialBalance;

    // Average Calculations
    // Average Calculations logic considering Salary Filter
    // 1. Get Unique Salaries
    const uniqueSalaries = [...new Set(entries.map(e => Number(e.salary)))].sort((a, b) => b - a);

    // 2. Filter for Avg Savings Calculation
    const entriesForAvg = salaryFilter === 'Overall'
        ? entries
        : entries.filter(e => Number(e.salary) === Number(salaryFilter));

    const totalSavingsForAvg = entriesForAvg.reduce((acc, curr) => acc + (Number(curr.savings) || 0), 0);
    const totalSalaryForAvg = entriesForAvg.reduce((acc, curr) => acc + (Number(curr.salary) || 0), 0);
    const countForAvg = entriesForAvg.length;

    const avgSavings = countForAvg > 0 ? totalSavingsForAvg / countForAvg : 0;
    const avgSalary = countForAvg > 0 ? totalSalaryForAvg / countForAvg : 0;
    const avgSavingsPercent = avgSalary > 0 ? Math.round((avgSavings / avgSalary) * 100) : 0;

    const totalExpensesSinceStart = entries.reduce((acc, curr) => acc + (Number(curr.expense) || 0), 0);
    const avgExpense = totalEntries > 0 ? totalExpensesSinceStart / totalEntries : 0;

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(val);

    const handleSaveEntry = (entryData) => {
        if (editingEntry) {
            updateEntry(editingEntry.id, entryData);
        } else {
            addEntry(entryData);
        }
        setIsEntryModalOpen(false);
    };

    const handleEdit = (entry) => {
        setEditingEntry(entry);
        setIsEntryModalOpen(true);
    };

    const handleDelete = (id) => {
        const entryObj = entries.find(e => e.id === id);
        if (entryObj) {
            setEntryToDelete(entryObj);
            setIsDeleteModalOpen(true);
        }
    };

    const confirmDelete = () => {
        if (entryToDelete) {
            deleteEntry(entryToDelete.id);
            setEntryToDelete(null);
            setIsDeleteModalOpen(false);
        }
    };

    const handleOpenAdd = () => {
        setEditingEntry(null);
        setIsEntryModalOpen(true);
    };

    return (
        <div className="container" style={{ paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Overview</h2>
                    <p style={{ color: 'var(--color-text-muted)' }}>Track your financial progress</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="ghost" onClick={() => setIsBalanceModalOpen(true)}>
                        <Wallet size={18} style={{ marginRight: '0.5rem' }} />
                        Set Initial Savings
                    </Button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <StatCard
                    title="Total Savings"
                    value={formatCurrency(currentTotalSavings)}
                    icon={PiggyBank}
                    trend={null}
                />
                <StatCard
                    title="Average Expense"
                    value={formatCurrency(avgExpense)}
                    icon={Receipt}
                    trend={null}
                />
                <StatCard
                    title="Average Savings"
                    value={
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                            {formatCurrency(avgSavings)}
                            <span style={{
                                fontSize: '0.9rem',
                                color: avgSavingsPercent >= 20 ? 'var(--color-success)' : 'var(--color-danger)',
                                background: avgSavingsPercent >= 20 ? 'rgba(var(--color-success-rgb), 0.1)' : 'rgba(var(--color-danger-rgb), 0.1)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 600
                            }}>
                                {avgSavingsPercent}%
                            </span>
                        </div>
                    }
                    icon={TrendingUp}
                    trend={null}
                    action={
                        <select
                            value={salaryFilter}
                            onChange={(e) => setSalaryFilter(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="select-minimal"
                            style={{
                                padding: '0.25rem 1.75rem 0.25rem 0.75rem',
                                appearance: 'none',
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 0.5rem center',
                                backgroundSize: '1em',
                                border: '1px solid var(--color-border)',
                                borderRadius: '6px',
                                background: 'var(--color-bg-card)',
                                color: 'var(--color-text-main)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                            }}
                        >
                            <option value="Overall">Overall</option>
                            {uniqueSalaries.map(sal => (
                                <option key={sal} value={sal}>
                                    For {formatCurrency(sal)}
                                </option>
                            ))}
                        </select>
                    }
                />
            </div>

            <div style={{ background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-main)', margin: 0 }}>Monthly Breakdown</h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Button onClick={handleOpenAdd} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                            <Plus size={16} style={{ marginRight: '0.5rem' }} />
                            Add Entry
                        </Button>
                        {selectedYear !== 'All' && (
                            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-primary)', background: 'var(--color-bg-subtle)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)' }}>
                                Total saved in {selectedYear}: {formatCurrency(yearlySavings)}
                            </span>
                        )}
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
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
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                            }}
                        >
                            <option value="All">All Years</option>
                            {availableYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <SavingsTable
                    entries={filteredEntries}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>

            <AddEntryModal
                isOpen={isEntryModalOpen}
                onClose={() => setIsEntryModalOpen(false)}
                onSave={handleSaveEntry}
                editingEntry={editingEntry}
                existingEntries={entries}
            />

            <EditBalanceModal
                isOpen={isBalanceModalOpen}
                onClose={() => setIsBalanceModalOpen(false)}
                onSave={updateInitialBalance}
                currentBalance={initialBalance}
            />

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                itemName={entryToDelete?.month}
                itemType="savings entry"
            />
        </div>
    );
};

export default Dashboard;
