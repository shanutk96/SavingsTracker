import React, { useState, useMemo, useRef } from 'react';
import { useData } from '../../context/DataContext';
import Button from '../UI/Button';
import DeleteConfirmationModal from '../Dashboard/DeleteConfirmationModal';
import { Plus, Minus, Trash2, SquarePen, AlertCircle, CheckCircle, MoreVertical } from 'lucide-react';

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

    const [isFormExpanded, setIsFormExpanded] = useState(false);
    const [toast, setToast] = useState(null);
    const toastTimeoutRef = useRef(null);

    const showToast = (message) => {
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
        }
        setToast(message);
        toastTimeoutRef.current = setTimeout(() => {
            setToast(null);
        }, 3000);
    };

    React.useEffect(() => {
        return () => {
            if (toastTimeoutRef.current) {
                clearTimeout(toastTimeoutRef.current);
            }
        };
    }, []);

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
            const result = new Function('return ' + sanitized)();
            if (isNaN(result) || !isFinite(result)) return 0;
            return result;
        } catch {
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
            showToast('Asset updated successfully.');
        } else {
            await addDistribution(newData);
            showToast('Asset added successfully.');
        }
        setFormData({ name: '', amount: '', isSalaryAccount: false });
        setIsFormExpanded(false);
    };

    const handleEdit = (item) => {
        setFormData({ name: item.name, amount: item.amount, isSalaryAccount: item.isSalaryAccount || false });
        setIsEditing(item.id);
        setIsFormExpanded(true);
        // Scroll to form and focus
        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            nameInputRef.current?.focus();
        }, 100);
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
            showToast('Asset deleted successfully.');
        }
    };

    const handleCancel = () => {
        setIsEditing(null);
        setFormData({ name: '', amount: '', isSalaryAccount: false });
        setIsFormExpanded(false);
    };

    return (
        <div className="container" style={{ paddingBottom: '4rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>Savings Distribution</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Track where your savings are currently located.</p>

            {/* Reconciliation Stats - Compact Row */}
            <div className="card flex-responsive" style={{
                padding: '1rem',
                marginBottom: '1.5rem',
                gap: '1rem',
                alignItems: 'center'
            }}>
                {/* Savings Column */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Savings</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {formatCurrency(totalActualSavings)}
                    </span>
                </div>

                {/* Distributed Column */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Distributed</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                        {formatCurrency(totalDistributed)}
                    </span>
                </div>

                {/* Difference Column */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
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

                {/* Add Asset Action Button */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'flex-end', 
                    minWidth: 'max-content',
                    marginLeft: 'auto',
                    width: '100%',
                    maxWidth: 'max-content'
                }}>
                    <button
                        onClick={() => {
                            if (isFormExpanded && isEditing) {
                                handleCancel();
                            } else {
                                setIsFormExpanded(!isFormExpanded);
                            }
                        }}
                        className={`btn ${isFormExpanded ? 'btn-ghost' : ''}`}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            minHeight: '30px',
                            padding: '0.3rem 0.6rem',
                            background: isFormExpanded ? 'transparent' : 'var(--gradient-primary)',
                            color: isFormExpanded ? 'var(--color-text-muted)' : 'white',
                            border: isFormExpanded ? '1px dashed var(--color-border)' : 'none',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '0.78rem'
                        }}
                    >
                        {isFormExpanded ? (
                            <>
                                <Minus size={13} /> {isEditing ? 'Cancel' : 'Close'}
                            </>
                        ) : (
                            <>
                                <Plus size={13} /> Add Asset
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Collapsible Input Form Card */}
            {isFormExpanded && (
                <div ref={formRef} className="card" style={{ 
                    marginBottom: '1.5rem', 
                    padding: '1rem', 
                    transition: 'box-shadow 0.3s', 
                    boxShadow: isEditing ? '0 0 0 2px var(--color-primary)' : 'var(--shadow-sm)' 
                }}>
                    <form onSubmit={handleSubmit} className="flex-responsive" style={{ 
                        gap: '0.85rem', 
                        alignItems: 'center',
                        width: '100%'
                    }}>
                        <div style={{ flex: 2, width: '100%' }}>
                            <input
                                type="text"
                                ref={nameInputRef}
                                placeholder="Asset Name (e.g. HDFC Bank)"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="input-field"
                                required
                            />
                        </div>
                        <div style={{ flex: 1.2, width: '100%' }}>
                            <input
                                type="text"
                                placeholder="Amount (e.g. 50000)"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="input-field"
                                required
                            />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap', userSelect: 'none', minHeight: '44px' }}>
                            <input
                                type="checkbox"
                                id="salaryAccount"
                                checked={formData.isSalaryAccount}
                                onChange={(e) => setFormData({ ...formData, isSalaryAccount: e.target.checked })}
                                style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                            />
                            <label htmlFor="salaryAccount" style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>
                                Primary Account
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginLeft: 'auto', width: '100%', maxWidth: 'max-content' }}>
                            {isEditing && (
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    onClick={handleCancel}
                                >
                                    Cancel
                                </Button>
                            )}
                            <Button 
                                type="submit"
                            >
                                {isEditing ? 'Update' : 'Add'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Distribution List - Desktop */}
            <div className="card desktop-only" style={{ padding: '1rem' }}>
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

            {/* Distribution List - Mobile */}
            <div className="mobile-only">
                {sortedDistributions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-muted)', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                        No distributions added yet.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {sortedDistributions.map(item => {
                            const percentage = totalDistributed > 0 ? (item.amount / totalDistributed) * 100 : 0;
                            return (
                                <div key={item.id} style={{
                                    padding: '1rem',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-lg)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.75rem',
                                    background: 'var(--color-bg-surface)',
                                    boxShadow: 'var(--shadow-sm)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                                        <div>
                                            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text-main)' }}>{item.name}</span>
                                            {item.isSalaryAccount && (
                                                <span style={{
                                                    color: 'var(--color-text-muted)',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 500,
                                                    marginLeft: '0.4rem',
                                                    background: 'var(--color-bg-subtle)',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px'
                                                }}>
                                                    Salary
                                                </span>
                                            )}
                                        </div>
                                        <div>
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
                                                    borderRadius: '4px',
                                                    width: '44px',
                                                    height: '44px'
                                                }}
                                                className="btn-ghost"
                                                title="Actions"
                                            >
                                                <MoreVertical size={18} />
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
                                                        right: '0px',
                                                        top: '100%',
                                                        background: 'var(--color-bg-surface)',
                                                        border: '1px solid var(--color-border)',
                                                        borderRadius: '6px',
                                                        boxShadow: 'var(--shadow-md)',
                                                        zIndex: 1000,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        minWidth: '120px',
                                                        padding: '4px 0',
                                                        marginTop: '4px'
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
                                                                padding: '10px 12px',
                                                                cursor: 'pointer',
                                                                color: 'var(--color-text-main)',
                                                                fontSize: '0.9rem',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                width: '100%',
                                                                minHeight: '44px'
                                                            }}
                                                        >
                                                            <SquarePen size={14} /> Edit
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
                                                                padding: '10px 12px',
                                                                cursor: 'pointer',
                                                                color: 'var(--color-danger)',
                                                                fontSize: '0.9rem',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                width: '100%',
                                                                minHeight: '44px'
                                                            }}
                                                        >
                                                            <Trash2 size={14} /> Delete
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        background: 'var(--color-bg-subtle)',
                                        padding: '0.75rem',
                                        borderRadius: 'var(--radius-md)'
                                    }}>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 500, marginBottom: '4px' }}>ALLOCATION</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                                                <span style={{ fontWeight: 600, color: 'var(--color-primary)', fontSize: '0.85rem' }}>
                                                    {percentage.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 500, marginBottom: '4px' }}>AMOUNT</span>
                                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-main)' }}>
                                                {formatCurrency(item.amount)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        
                        {/* Total Card */}
                        {distributions.length > 0 && (
                            <div style={{
                                background: 'var(--color-bg-subtle)',
                                padding: '1rem',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--color-border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontWeight: 700
                            }}>
                                <span>Total Distributed</span>
                                <span style={{ color: 'var(--color-primary)' }}>{formatCurrency(totalDistributed)}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {toast && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 10000
                }}>
                    <div style={{
                        background: 'var(--color-bg-surface)',
                        color: 'var(--color-text-main)',
                        border: '1px solid var(--color-success)',
                        boxShadow: 'var(--shadow-lg)',
                        borderRadius: '50px',
                        padding: '0.75rem 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        animation: 'slideUp 0.3s ease-out',
                        fontSize: '0.9rem',
                        fontWeight: 600
                    }}>
                        <CheckCircle size={18} color="var(--color-success)" />
                        {toast}
                    </div>
                </div>
            )}

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
