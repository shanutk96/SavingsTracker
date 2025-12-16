import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import Button from '../UI/Button';
import ConfirmModal from '../UI/ConfirmModal';
import { Plus, Trash2, CheckSquare, Square, Calculator, Edit2, Check, X, CheckCircle } from 'lucide-react';

const CreditCardPage = () => {
    const {
        ccExpenses,
        addCCExpense,
        updateCCExpense,
        deleteCCExpense,
        evaluateMathExpression,
        renameCardGroup,
        deleteCardGroup,
        markCardGroupPaid
    } = useData();

    // Month Selection
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(`${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`);

    // Helper to generate month options (current month onwards)
    const monthOptions = useMemo(() => {
        const options = [];
        const currentYear = currentDate.getFullYear();
        const currentMonthIndex = currentDate.getMonth();

        // 2 years ahead
        for (let y = currentYear; y <= currentYear + 2; y++) {
            months.forEach((m, index) => {
                // If it's the current year, only show months >= current month
                if (y === currentYear && index < currentMonthIndex) return;
                options.push(`${m} ${y}`);
            });
        }
        return options;
    }, []);

    // Local state for new item inputs - keyed by cardName to allow independent inputs
    // But we need a dynamic way to add cards. For now, let's assume user types card name or we distinct existing ones.
    // Better approach: "Add Card" button or just loose groups.
    // The "Keep Notes" style implies loose free-text grouping or predefined cards.
    // Let's infer cards from data + allow creating new ones by adding an item with a new card name.
    // BUT to start empty, we need at least one card or a "New Card" button.
    // Let's use a "Manage Cards" approach or just a simple "Add Card Section" button.

    // Simplification: Just list distinct card names found in general, OR allow user to "Add Group".
    // Let's go with "Add Group" local state for empty groups, merging with existing data groups.

    // Actually, distinct cards from ALL time might be good to auto-suggest, 
    // but for this view, we only care about Selected Month.
    // However, if I start a new month, I want my usual cards to be there.
    // So let's derive "Active Cards" from:
    // 1. Unique card names in current month data
    // 2. Unique card names from ALL data (as potential "Add" options)

    const [newCardName, setNewCardName] = useState('');
    const [isAddingCard, setIsAddingCard] = useState(false);

    // Filter expenses for current month
    const currentMonthExpenses = useMemo(() => {
        return ccExpenses.filter(e => e.month === selectedMonth);
    }, [ccExpenses, selectedMonth]);

    // Group by Card Name
    const expensesByCard = useMemo(() => {
        const groups = {};
        currentMonthExpenses.forEach(e => {
            if (!groups[e.cardName]) groups[e.cardName] = [];
            groups[e.cardName].push(e);
        });
        return groups;
    }, [currentMonthExpenses]);

    // Get list of cards to display (Data-driven + manual additions could be handled, but let's stick to data first + "Add Card" button that creates a placeholder or just visual group)
    // To allow "Empty" cards, we'd need a separate "Cards" collection or just rely on items.
    // User asked to "Add items like...".
    // Let's allow adding a card group if it doesn't exist for this month?
    // Actually, simple is best: Button "Add Card Group".
    const [visibleCards, setVisibleCards] = useState([]);

    // Sync visible cards with data
    useMemo(() => {
        const dataCards = Object.keys(expensesByCard);
        setVisibleCards(prev => [...new Set([...prev, ...dataCards])]);
    }, [expensesByCard]);

    const handleAddCard = () => {
        if (newCardName.trim()) {
            setVisibleCards(prev => [...new Set([...prev, newCardName.trim()])]);
            setNewCardName('');
            setIsAddingCard(false);
        }
    };

    // Delete Confirmation
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, cardName: null });

    const promptDeleteCard = (cardName) => {
        setConfirmConfig({ isOpen: true, cardName });
    };

    const confirmDeleteCard = () => {
        if (confirmConfig.cardName) {
            deleteCardGroup(confirmConfig.cardName, selectedMonth);
        }
        setConfirmConfig({ isOpen: false, cardName: null });
    };

    return (
        <div className="container" style={{ paddingBottom: '4rem' }}>
            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig({ isOpen: false, cardName: null })}
                onConfirm={confirmDeleteCard}
                title="Delete Card Group"
                message={`Are you sure you want to delete the entire "${confirmConfig.cardName}" group? This action cannot be undone.`}
                confirmText="Delete"
                isDanger
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Credit Cards</h2>
                    <p style={{ color: 'var(--color-text-muted)' }}>Add and track monthly expenses for each credit card to know your total bill clearly.</p>
                </div>
                <select
                    value={selectedMonth}
                    onChange={(e) => {
                        setSelectedMonth(e.target.value);
                        setVisibleCards([]); // Reset visible checking on month change
                    }}
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

            {/* Card Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem',
                alignItems: 'start'
            }}>
                {visibleCards.map(cardName => (
                    <CardGroup
                        key={cardName}
                        cardName={cardName}
                        items={expensesByCard[cardName] || []}
                        month={selectedMonth}
                        onAdd={(item) => addCCExpense({ ...item, cardName, month: selectedMonth })}
                        onUpdate={updateCCExpense}
                        onDelete={deleteCCExpense}

                        onRename={(newName) => renameCardGroup(cardName, newName, selectedMonth)}
                        onDeleteGroup={() => promptDeleteCard(cardName)}
                        onMarkPaid={(isPaid) => markCardGroupPaid(cardName, selectedMonth, isPaid)}
                        evaluateMath={evaluateMathExpression}
                    />
                ))}

                {/* Add New Card Group */}
                <div className="card" style={{ padding: '1.5rem', borderStyle: 'dashed', borderColor: 'var(--color-border)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isAddingCard ? (
                        <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                            <input
                                autoFocus
                                type="text"
                                placeholder="Card Name (e.g. HDFC)"
                                className="input-field"
                                value={newCardName}
                                onChange={(e) => setNewCardName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCard()}
                            />
                            <Button onClick={handleAddCard} size="sm">Add</Button>
                        </div>
                    ) : (
                        <Button variant="ghost" onClick={() => setIsAddingCard(true)}>
                            <Plus size={18} /> Add New Card Group
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

const CardGroup = ({ cardName, items, onAdd, onUpdate, onDelete, onRename, onDeleteGroup, onMarkPaid, evaluateMath }) => {
    const [newItemDesc, setNewItemDesc] = useState('');
    const [newItemAmount, setNewItemAmount] = useState('');

    const total = items.reduce((sum, item) => {
        if (item.isChecked) return sum;
        return sum + (Number(item.amount) || 0);
    }, 0);

    const allPaid = items.length > 0 && items.every(item => item.isChecked);

    const handleAddItem = (e) => {
        e.preventDefault();
        if (!newItemDesc || !newItemAmount) return;

        const calculatedAmount = evaluateMath(newItemAmount);

        onAdd({
            description: newItemDesc,
            amount: calculatedAmount,
            expression: newItemAmount, // Store original string
            isChecked: false
        });
        setNewItemDesc('');
        setNewItemAmount('');
    };

    const handleEditSave = (id, updates) => {
        const calculatedAmount = evaluateMath(updates.expression || updates.amount);
        onUpdate(id, {
            ...updates,
            amount: calculatedAmount,
            // If expression is just a number, maybe clear expression? 
            // Better to just save what user typed.
        });
        setEditingId(null);
    };

    const [editingId, setEditingId] = useState(null);
    const [editFormData, setEditFormData] = useState({});

    const startEdit = (item) => {
        setEditingId(item.id);
        setEditFormData({
            description: item.description,
            expression: item.expression || item.amount, // Show expression if exists
            cardName: cardName
        });
    };




    // Card Name Edit State
    const [isEditingCard, setIsEditingCard] = useState(false);
    const [editedCardName, setEditedCardName] = useState(cardName);

    const handleCardRename = () => {
        if (editedCardName.trim() && editedCardName !== cardName) {
            onRename(editedCardName);
        }
        setIsEditingCard(false);
    };

    return (
        <div className="card" style={{ transition: 'all 0.2s' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-subtle)' }}>
                {isEditingCard ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            value={editedCardName}
                            onChange={(e) => setEditedCardName(e.target.value)}
                            className="input-field"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleCardRename()}
                        />
                        <Button size="sm" onClick={handleCardRename}>Save</Button>
                    </div>
                ) : (
                    <div className="card-group-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{cardName}</h3>

                        <div className="header-actions" style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => { setIsEditingCard(true); setEditedCardName(cardName); }}
                                className="header-edit-btn"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                                title="Rename Card"
                            >
                                <Edit2 size={14} />
                            </button>
                            <button
                                onClick={() => onMarkPaid(!allPaid)}
                                className="header-edit-btn"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: allPaid ? 'var(--color-success)' : 'var(--color-text-muted)' }}
                                title={allPaid ? "Mark All Unpaid" : "Mark All Paid"}
                            >
                                <CheckCircle size={14} />
                            </button>
                            <button
                                onClick={onDeleteGroup}
                                className="header-edit-btn"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}
                                title="Delete Card Group"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                )}
                <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(total)}
                </span>
            </div>

            <div style={{ padding: '0.5rem 0' }}>
                {items.map(item => (
                    <div key={item.id} className="distribution-row" style={{
                        padding: '0.5rem 1.5rem',
                        borderBottom: '1px solid var(--color-border-subtle)',
                        fontSize: '0.9rem'
                    }}>
                        {editingId === item.id ? (
                            <div style={{ display: 'flex', gap: '0.5rem', width: '100%', alignItems: 'center' }}>
                                <input
                                    className="input-field"
                                    value={editFormData.description || ''}
                                    onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                                    placeholder="Description"
                                    style={{
                                        width: '40%',
                                        minWidth: '100px',
                                        background: 'transparent',
                                        border: 'none',
                                        borderBottom: '1px solid var(--color-primary)',
                                        borderRadius: 0,
                                        padding: '0.25rem 0',
                                        boxShadow: 'none'
                                    }}
                                />

                                <input
                                    className="input-field"
                                    value={editFormData.expression}
                                    onChange={e => setEditFormData({ ...editFormData, expression: e.target.value })}
                                    placeholder="Amount"
                                    autoFocus
                                    onFocus={(e) => {
                                        const val = e.target.value;
                                        e.target.value = '';
                                        e.target.value = val;
                                    }}
                                    style={{
                                        width: '100px',
                                        background: 'transparent',
                                        border: 'none',
                                        borderBottom: '1px solid var(--color-primary)',
                                        borderRadius: 0,
                                        padding: '0.25rem 0',
                                        boxShadow: 'none',
                                        fontFamily: 'monospace',
                                        textAlign: 'right'
                                    }}
                                />
                                <div style={{ display: 'flex', gap: '5px', marginLeft: 'auto' }}>
                                    <button
                                        onClick={() => handleEditSave(item.id, editFormData)}
                                        style={{
                                            background: 'var(--color-primary)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            padding: '4px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        title="Save"
                                    >
                                        <Check size={14} />
                                    </button>
                                    <button
                                        onClick={() => setEditingId(null)}
                                        style={{
                                            background: 'transparent',
                                            color: 'var(--color-text-muted)',
                                            border: 'none',
                                            borderRadius: '4px',
                                            padding: '4px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        title="Cancel"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                                <button
                                    onClick={() => onUpdate(item.id, { isChecked: !item.isChecked })}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.isChecked ? 'var(--color-success)' : 'var(--color-text-muted)', display: 'flex' }}
                                >
                                    {item.isChecked ? <CheckSquare size={18} /> : <Square size={18} />}
                                </button>

                                <div style={{ flex: 1, textDecoration: item.isChecked ? 'line-through' : 'none', color: item.isChecked ? 'var(--color-text-muted)' : 'var(--color-text-main)' }}>
                                    {item.description}
                                </div>

                                <div style={{ fontWeight: 500, fontFamily: 'monospace' }}>
                                    {item.amount}
                                </div>

                                <div className="action-buttons" style={{ display: 'flex', gap: '5px' }}>
                                    <button
                                        onClick={() => startEdit(item)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(item.id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <form onSubmit={handleAddItem} style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder="Add new item..."
                    className="input-field"
                    style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid var(--color-border)',
                        borderRadius: 0,
                        padding: '0.5rem 0',
                        fontSize: '0.9rem',
                        boxShadow: 'none'
                    }}
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="0"
                    className="input-field"
                    style={{
                        width: '80px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid var(--color-border)',
                        borderRadius: 0,
                        padding: '0.5rem 0',
                        fontSize: '0.9rem',
                        boxShadow: 'none',
                        fontFamily: 'monospace',
                        textAlign: 'right'
                    }}
                    value={newItemAmount}
                    onChange={(e) => setNewItemAmount(e.target.value)}
                />
                <button
                    type="submit"
                    style={{
                        background: 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0
                    }}
                    title="Add Item"
                >
                    <Plus size={16} />
                </button>
            </form>
        </div>
    );
};

export default CreditCardPage;
