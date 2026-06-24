import React, { useState, useMemo, useRef } from 'react';
import { useData } from '../../context/DataContext';
import Button from '../UI/Button';
import DeleteConfirmationModal from '../Dashboard/DeleteConfirmationModal';
import { Plus, Trash2, SquarePen, AlertCircle, CheckCircle, MoreVertical } from 'lucide-react';

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
    const [formData, setFormData] = useState({ name: '', amount: '', isSalaryAccount: false });
    const [sortConfig, setSortConfig] = useState({ key: 'amount', direction: 'desc' });
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [activeDropdownId, setActiveDropdownId] = useState(null);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || formData.amount === '') return;

        const calculatedAmount = evaluateExpression(formData.amount);
        const newData = {
            name: formData.name,
            amount: calculatedAmount,
            isSalaryAccount: formData.isSalaryAccount
        };

        // If setting this as salary account, unset others
        if (formData.isSalaryAccount) {
            const promises = distributions
                .filter(d => d.isSalaryAccount && d.id !== isEditing)
                .map(d => updateDistribution(d.id, { ...d, isSalaryAccount: false }));
            await Promise.all(promises);
        }

        if (isEditing) {
            await updateDistribution(isEditing, newData);
            setIsEditing(null);
        } else {
            await addDistribution(newData);
        }
        setFormData({ name: '', amount: '', isSalaryAccount: false });
    };

    const handleEdit = (item) => {
        setFormData({ name: item.name, amount: item.amount, isSalaryAccount: item.isSalaryAccount || false });
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
        setFormData({ name: '', amount: '', isSalaryAccount: false });
    };

    return (
        <div className="container" style={{ paddingBottom: '4rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>Savings Distribution</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Track where your savings are currently located.</p>

            {/* Reconciliation Stats - Compact Row */}
            <div className="card" style={{
                padding: '0.75rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem',
                gap: '1rem',
                flexWrap: 'wrap'
            }}>
                {/* Savings Column */}
                <div style={{ flex: 1, minWidth: '100px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Savings</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {formatCurrency(totalActualSavings)}
                    </span>
                </div>

                {/* Vertical Divider 1 */}
                <div style={{ width: '1px', height: '32px', background: 'var(--color-border)', alignSelf: 'center' }} className="stats-divider" />

                {/* Distributed Column */}
                <div style={{ flex: 1, minWidth: '100px', display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '0.75rem' }} className="stats-col-padded">
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Distributed</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                        {formatCurrency(totalDistributed)}
                    </span>
                </div>

                {/* Vertical Divider 2 */}
                <div style={{ width: '1px', height: '32px', background: 'var(--color-border)', alignSelf: 'center' }} className="stats-divider" />

                {/* Difference Column */}
                <div style={{ flex: 1, minWidth: '100px', display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '0.75rem' }} className="stats-col-padded">
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Difference</span>
                    <span style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: isBalanced ? 'var(--color-success)' : 'var(--color-danger)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        {formatCurrency(difference)}
                        {isBalanced ? (
                            <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>✓</span>
                        ) : (
                            <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--color-danger)' }}>
                                ({difference > 0 ? 'Unallocated' : 'Over'})
                            </span>
                        )}
                    </span>
                </div>

                <style>{`
                    @media (max-width: 480px) {
                        .stats-divider {
                            display: none !important;
                        }
                        .stats-col-padded {
                            padding-left: 0 !important;
                        }
                    }
                `}</style>
            </div>

            {/* Input Form - One Row Layout */}
            <div ref={formRef} className="card" style={{ 
                marginBottom: '2rem', 
                padding: '0.85rem 1.25rem', 
                transition: 'box-shadow 0.3s', 
                boxShadow: isEditing ? '0 0 0 2px var(--color-primary)' : 'var(--shadow-sm)' 
            }}>
                <form onSubmit={handleSubmit} style={{ 
                    display: 'flex', 
                    gap: '0.85rem', 
                    alignItems: 'center', 
                    flexWrap: 'wrap',
                    width: '100%'
                }}>
                    <div style={{ flex: 2, minWidth: '180px' }}>
                        <input
                            type="text"
                            ref={nameInputRef}
                            placeholder="Asset Name (e.g. HDFC Bank)"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="input-field"
                            style={{ minHeight: '38px', padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
                            required
                        />
                    </div>
                    <div style={{ flex: 1.2, minWidth: '120px' }}>
                        <input
                            type="text"
                            placeholder="Amount (e.g. 50000)"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            className="input-field"
                            style={{ minHeight: '38px', padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap', userSelect: 'none' }}>
                        <input
                            type="checkbox"
                            id="salaryAccount"
                            checked={formData.isSalaryAccount}
                            onChange={(e) => setFormData({ ...formData, isSalaryAccount: e.target.checked })}
                            style={{ width: '1.05rem', height: '1.05rem', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                        />
                        <label htmlFor="salaryAccount" style={{ cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>
                            Primary Account
                        </label>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto' }}>
                        {isEditing && (
                            <Button 
                                type="button" 
                                variant="ghost" 
                                onClick={handleCancel}
                                style={{ minHeight: '38px', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                            >
                                Cancel
                            </Button>
                        )}
                        <Button 
                            type="submit"
                            style={{ minHeight: '38px', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                            {isEditing ? 'Update' : 'Add'}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Distribution List */}
            <div className="card" style={{ padding: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <th
                                style={{ textAlign: 'left', padding: '0.6rem 0.75rem', color: 'var(--color-text-muted)', cursor: 'pointer', userSelect: 'none' }}
                                onClick={() => requestSort('name')}
                            >
                                Asset {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th
                                style={{ textAlign: 'right', padding: '0.6rem 0.75rem', color: 'var(--color-text-muted)', cursor: 'pointer', userSelect: 'none' }}
                                onClick={() => requestSort('amount')}
                            >
                                Amount {sortConfig.key === 'amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th style={{ textAlign: 'right', padding: '0.6rem 0.75rem', color: 'var(--color-text-muted)' }}>Allocation</th>
                            <th style={{ textAlign: 'right', padding: '0.6rem 0.75rem', width: '60px', color: 'var(--color-text-muted)' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedDistributions.length === 0 ? (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-muted)' }}>
                                    No distributions added yet.
                                </td>
                            </tr>
                        ) : (
                            sortedDistributions.map(item => {
                                const percentage = totalDistributed > 0 ? (item.amount / totalDistributed) * 100 : 0;
                                return (
                                    <tr key={item.id} className="distribution-row" style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500 }}>
                                            {item.name}
                                            {item.isSalaryAccount && (
                                                <span style={{
                                                    color: 'var(--color-text-muted)',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 400,
                                                    marginLeft: '0.4rem'
                                                }}>
                                                    (Salary)
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{formatCurrency(item.amount)}</td>
                                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                                                {/* Visual Allocation Bar */}
                                                <div style={{
                                                    width: '60px',
                                                    height: '6px',
                                                    background: 'var(--color-border)',
                                                    borderRadius: '3px',
                                                    overflow: 'hidden',
                                                    display: 'inline-block'
                                                }}>
                                                    <div style={{
                                                        width: `${percentage}%`,
                                                        height: '100%',
                                                        background: 'var(--gradient-primary)'
                                                    }} />
                                                </div>
                                                <span style={{ fontWeight: 600, color: 'var(--color-primary)', minWidth: '42px', textAlign: 'right' }}>
                                                    {percentage.toFixed(1)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', position: 'relative' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveDropdownId(activeDropdownId === item.id ? null : item.id);
                                                    }}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        color: 'var(--color-text-muted)',
                                                        padding: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        borderRadius: '4px'
                                                    }}
                                                    className="btn-ghost"
                                                    title="Actions"
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
 
                                                {activeDropdownId === item.id && (
                                                    <>
                                                        <div
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveDropdownId(null);
                                                            }}
                                                            style={{
                                                                position: 'fixed',
                                                                top: 0,
                                                                left: 0,
                                                                right: 0,
                                                                bottom: 0,
                                                                zIndex: 999,
                                                                background: 'transparent'
                                                            }}
                                                        />
                                                        <div style={{
                                                            position: 'absolute',
                                                            right: '12px',
                                                            top: '80%',
                                                            background: 'var(--color-bg-surface)',
                                                            border: '1px solid var(--color-border)',
                                                            borderRadius: '6px',
                                                            boxShadow: 'var(--shadow-md)',
                                                            zIndex: 1000,
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            minWidth: '100px',
                                                            padding: '4px 0',
                                                            marginTop: '4px',
                                                            animation: 'fadeIn 0.15s ease-out'
                                                        }} onClick={e => e.stopPropagation()}>
                                                            <button
                                                                 onClick={() => {
                                                                     setActiveDropdownId(null);
                                                                     handleEdit(item);
                                                                 }}
                                                                 style={{
                                                                     background: 'transparent',
                                                                     border: 'none',
                                                                     textAlign: 'left',
                                                                     padding: '8px 12px',
                                                                     cursor: 'pointer',
                                                                     color: 'var(--color-text-main)',
                                                                     fontSize: '0.85rem',
                                                                     display: 'flex',
                                                                     alignItems: 'center',
                                                                     gap: '8px',
                                                                     width: '100%',
                                                                     borderRadius: '4px',
                                                                     transition: 'all 0.15s ease'
                                                                 }}
                                                                 onMouseEnter={e => {
                                                                     e.currentTarget.style.background = 'var(--color-primary-light)';
                                                                     e.currentTarget.style.color = 'var(--color-primary)';
                                                                 }}
                                                                 onMouseLeave={e => {
                                                                     e.currentTarget.style.background = 'transparent';
                                                                     e.currentTarget.style.color = 'var(--color-text-main)';
                                                                 }}
                                                             >
                                                                 <SquarePen size={13} /> Edit
                                                             </button>
                                                             <button
                                                                 onClick={() => {
                                                                     setActiveDropdownId(null);
                                                                     handleDelete(item.id);
                                                                 }}
                                                                 style={{
                                                                     background: 'transparent',
                                                                     border: 'none',
                                                                     textAlign: 'left',
                                                                     padding: '8px 12px',
                                                                     cursor: 'pointer',
                                                                     color: 'var(--color-danger)',
                                                                     fontSize: '0.85rem',
                                                                     display: 'flex',
                                                                     alignItems: 'center',
                                                                     gap: '8px',
                                                                     width: '100%',
                                                                     borderRadius: '4px',
                                                                     transition: 'all 0.15s ease'
                                                                 }}
                                                                 onMouseEnter={e => {
                                                                     e.currentTarget.style.background = 'var(--color-danger-bg)';
                                                                     e.currentTarget.style.color = 'var(--color-danger)';
                                                                 }}
                                                                 onMouseLeave={e => {
                                                                     e.currentTarget.style.background = 'transparent';
                                                                     e.currentTarget.style.color = 'var(--color-danger)';
                                                                 }}
                                                             >
                                                                 <Trash2 size={13} /> Delete
                                                             </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        {/* Total Row */}
                        {distributions.length > 0 && (
                            <tr style={{ background: 'var(--color-bg-subtle)', fontWeight: 700 }}>
                                <td style={{ padding: '0.6rem 0.75rem' }}>Total</td>
                                <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>{formatCurrency(totalDistributed)}</td>
                                <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                                        <div style={{ width: '60px', height: '6px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden', display: 'inline-block' }}>
                                            <div style={{ width: '100%', height: '100%', background: 'var(--gradient-primary)' }} />
                                        </div>
                                        <span style={{ minWidth: '42px', textAlign: 'right' }}>100.0%</span>
                                    </div>
                                </td>
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
