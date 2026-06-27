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
    const { entries, addEntry, updateEntry, deleteEntry, initialBalance, updateInitialBalance, distributions, updateDistribution } = useData();
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
    const totalExpensesForAvg = entriesForAvg.reduce((acc, curr) => acc + (Number(curr.expense) || 0), 0);
    const avgExpense = countForAvg > 0 ? totalExpensesForAvg / countForAvg : 0;

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(val);



    const formatCompactCurrency = (val) => {
        const num = Number(val) || 0;
        if (num >= 100000) {
            return '₹' + (num / 100000).toFixed(2).replace(/\.00$/, '') + 'L';
        }
        if (num >= 1000) {
            return '₹' + (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        }
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(num);
    };

    const handleSaveEntry = async (entryData) => {
        // Calculate Savings Delta
        let deltaSavings = 0;
        const newSavings = Number(entryData.savings) || 0;

        if (editingEntry) {
            const oldSavings = Number(editingEntry.savings) || 0;
            deltaSavings = newSavings - oldSavings;
            await updateEntry(editingEntry.id, entryData);
        } else {
            deltaSavings = newSavings;
            await addEntry(entryData);
        }

        // Sync with Salary Account
        const salaryAccount = distributions.find(d => d.isSalaryAccount);
        if (salaryAccount && deltaSavings !== 0) {
            const currentAmount = Number(salaryAccount.amount) || 0;
            await updateDistribution(salaryAccount.id, {
                ...salaryAccount,
                amount: currentAmount + deltaSavings
            });
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
            <div className="flex-responsive" style={{ marginBottom: '2rem' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>Overview</h2>
                    <p style={{ color: 'var(--color-text-muted)' }}>Track your financial progress</p>
                </div>
                <div className="header-controls">
                    {/* Salary Filter (Global for Averages) */}
                    <div className="filter-container">
                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>Filter Avg:</span>
                        <select
                            value={salaryFilter}
                            onChange={(e) => setSalaryFilter(e.target.value)}
                            className="select-minimal"
                            style={{
                                cursor: 'pointer',
                                minWidth: '130px'
                            }}
                        >
                            <option value="Overall">Overall</option>
                            {uniqueSalaries.map(sal => (
                                <option key={sal} value={sal}>
                                    For {formatCurrency(sal)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Button variant="ghost" onClick={() => setIsBalanceModalOpen(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Wallet size={16} style={{ marginRight: '0.5rem' }} />
                        Set Initial Savings
                    </Button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <StatCard
                    title="Total Savings"
                    value={formatCompactCurrency(currentTotalSavings)}
                    hoverValue={formatCurrency(currentTotalSavings)}
                />
                <StatCard
                    title="Avg Expense"
                    value={formatCompactCurrency(avgExpense)}
                    hoverValue={formatCurrency(avgExpense)}
                />
                <StatCard
                    title="Avg Savings"
                    value={
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                            {formatCompactCurrency(avgSavings)}
                            <span style={{
                                fontSize: '0.85rem',
                                color: avgSavingsPercent >= 20 ? 'var(--color-success)' : 'var(--color-danger)',
                                fontWeight: 600,
                                whiteSpace: 'nowrap'
                            }}>
                                {avgSavingsPercent >= 20 ? '↗' : '↘'} {avgSavingsPercent}%
                            </span>
                        </div>
                    }
                    hoverValue={
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                            {formatCurrency(avgSavings)}
                            <span style={{
                                fontSize: '0.85rem',
                                color: avgSavingsPercent >= 20 ? 'var(--color-success)' : 'var(--color-danger)',
                                fontWeight: 600,
                                whiteSpace: 'nowrap'
                            }}>
                                {avgSavingsPercent >= 20 ? '↗' : '↘'} {avgSavingsPercent}%
                            </span>
                        </div>
                    }
                />
            </div>

            <div className="card" style={{ marginTop: '2rem' }}>
                <div className="flex-responsive" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-main)', margin: 0 }}>Monthly Breakdown</h3>

                    <div className="header-controls">
                        <Button 
                            onClick={handleOpenAdd} 
                            style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                minHeight: '34px',
                                padding: '0.4rem 1rem',
                                borderRadius: '9999px',
                                fontSize: '0.85rem',
                                gap: '0.35rem',
                                whiteSpace: 'nowrap',
                                height: 'auto',
                                width: 'auto',
                                flexShrink: 0
                            }}
                        >
                            <Plus size={14} />
                            Add Entry
                        </Button>
                        {selectedYear !== 'All' && (
                            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-primary)', background: 'var(--color-bg-subtle)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)', textAlign: 'center', width: '100%' }}>
                                Total saved: {formatCurrency(yearlySavings)}
                            </span>
                        )}
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="select-minimal"
                            style={{
                                cursor: 'pointer'
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
