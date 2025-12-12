import React, { useState, useMemo, useRef } from 'react';
import { useData } from '../../context/DataContext';
import Button from '../UI/Button';
import DeleteConfirmationModal from '../Dashboard/DeleteConfirmationModal';
import { Plus, Trash2, Edit2, AlertCircle, CheckCircle } from 'lucide-react';

const DistributionPage = () => {
    const {
        entries,
        initialBalance,
        distributions,
        addDistribution,
        updateDistribution,
        deleteDistribution
    } = useData();

    const [isEditing, setIsEditing] = useState(null);
    const formRef = useRef(null);
    const nameInputRef = useRef(null);
    const [formData, setFormData] = useState({ name: '', amount: '' });
    const [sortConfig, setSortConfig] = useState({ key: 'amount', direction: 'desc' });
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Calculate Total Actual Savings
    const totalActualSavings = entries.length > 0 ? entries[0].totalSavings : initialBalance;

    // Calculate Total Distributed
    const totalDistributed = useMemo(() => {
        return distributions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    }, [distributions]);

    // Sorted Distributions
    const sortedDistributions = useMemo(() => {
        let sortableItems = [...distributions];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aKey = a[sortConfig.key];
                let bKey = b[sortConfig.key];

                if (sortConfig.key === 'amount') {
                    aKey = Number(aKey);
                    bKey = Number(bKey);
                } else {
                    aKey = aKey.toLowerCase();
                    bKey = bKey.toLowerCase();
                }

                if (aKey < bKey) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aKey > bKey) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [distributions, sortConfig]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const difference = totalActualSavings - totalDistributed;
    const isBalanced = difference === 0;

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(val);

    const evaluateExpression = (expression) => {
        try {
            const sanitized = String(expression).replace(/[^0-9+\-*/. ]/g, '');
            if (!sanitized) return 0;
            // eslint-disable-next-line no-new-func
            const result = new Function('return ' + sanitized)();
            if (isNaN(result) || !isFinite(result)) return 0;
            return result;
        } catch (err) {
            return 0;
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || formData.amount === '') return;

        const calculatedAmount = evaluateExpression(formData.amount);

        if (isEditing) {
            updateDistribution(isEditing, {
                name: formData.name,
                amount: calculatedAmount
            });
            setIsEditing(null);
        } else {
            addDistribution({
                name: formData.name,
                amount: calculatedAmount
            });
        }
        setFormData({ name: '', amount: '' });
    };

    const handleEdit = (item) => {
        setFormData({ name: item.name, amount: item.amount });
        setIsEditing(item.id);
        // Scroll to form and focus
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => nameInputRef.current?.focus(), 500);
    };

    const handleDelete = (id) => {
        const item = distributions.find(d => d.id === id);
        if (item) {
            setItemToDelete(item);
            setIsDeleteModalOpen(true);
        }
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            deleteDistribution(itemToDelete.id);
            setItemToDelete(null);
            setIsDeleteModalOpen(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(null);
        setFormData({ name: '', amount: '' });
    };

    return (
        <div className="container" style={{ paddingBottom: '4rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>Savings Distribution</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Track where your savings are currently located.</p>

            {/* Reconciliation Stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Total Savings (Goal)</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>{formatCurrency(totalActualSavings)}</span>
                </div>
                <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Total Distributed</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{formatCurrency(totalDistributed)}</span>
                </div>
                <div className="card" style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    border: isBalanced ? '1px solid var(--color-success)' : '1px solid var(--color-danger)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Difference</span>
                        {isBalanced ? <CheckCircle size={16} color="var(--color-success)" /> : <AlertCircle size={16} color="var(--color-danger)" />}
                    </div>
                    <span style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: isBalanced ? 'var(--color-success)' : 'var(--color-danger)'
                    }}>
                        {formatCurrency(difference)}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {difference > 0 ? 'Unallocated' : difference < 0 ? 'Over-allocated' : 'Balanced'}
                    </span>
                </div>
            </div>

            {/* Input Form */}
            <div ref={formRef} className="card" style={{ marginBottom: '2rem', padding: '1.5rem', transition: 'box-shadow 0.3s', boxShadow: isEditing ? '0 0 0 2px var(--color-primary)' : 'var(--shadow-sm)' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                            Asset / Account Name
                        </label>
                        <input
                            type="text"
                            ref={nameInputRef}
                            placeholder="e.g. HDFC Bank, Stocks"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="input-field"
                            required
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>
                            Amount
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. 50000 + 1000"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            className="input-field"
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {isEditing && (
                            <Button type="button" variant="ghost" onClick={handleCancel}>
                                Cancel
                            </Button>
                        )}
                        <Button type="submit">
                            {isEditing ? 'Update' : 'Add Item'}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Distribution List */}
            <div className="card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <th
                                style={{ textAlign: 'left', padding: '1rem', color: 'var(--color-text-muted)', cursor: 'pointer', userSelect: 'none' }}
                                onClick={() => requestSort('name')}
                            >
                                Asset {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th
                                style={{ textAlign: 'right', padding: '1rem', color: 'var(--color-text-muted)', cursor: 'pointer', userSelect: 'none' }}
                                onClick={() => requestSort('amount')}
                            >
                                Amount {sortConfig.key === 'amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th style={{ textAlign: 'right', padding: '1rem', width: '100px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedDistributions.length === 0 ? (
                            <tr>
                                <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                    No distributions added yet.
                                </td>
                            </tr>
                        ) : (
                            sortedDistributions.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 500 }}>{item.name}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>{formatCurrency(item.amount)}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="btn btn-ghost"
                                                style={{ padding: '0.25rem' }}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'var(--color-text-muted)',
                                                    cursor: 'pointer',
                                                    padding: '0.25rem'
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        {/* Total Row */}
                        {distributions.length > 0 && (
                            <tr style={{ background: 'var(--color-bg-subtle)', fontWeight: 700 }}>
                                <td style={{ padding: '1rem' }}>Total</td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>{formatCurrency(totalDistributed)}</td>
                                <td></td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                itemName={itemToDelete?.name}
                itemType="investment item"
            />
        </div>
    );
};

export default DistributionPage;
