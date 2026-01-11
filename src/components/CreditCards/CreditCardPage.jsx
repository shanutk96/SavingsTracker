import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import Button from '../UI/Button';
import ConfirmModal from '../UI/ConfirmModal';
import Modal from '../UI/Modal';
import { Plus, Trash2, CheckSquare, Square, Calculator, Edit2, Check, X, CheckCircle, ArrowRight, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

const CreditCardPage = () => {
    const {
        ccExpenses,
        addCCExpense,
        updateCCExpense,
        deleteCCExpense,
        evaluateMathExpression,
        renameCardGroup,
        deleteCardGroup,
        markCardGroupPaid,
        cardsList,
        addCard,
        renameCard,
        deleteCard
    } = useData();

    // Month Selection
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentDate = new Date();
    const [selectedMonthName, setSelectedMonthName] = useState(months[currentDate.getMonth()]);
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

    const handlePrevMonth = () => {
        const currentIndex = months.indexOf(selectedMonthName);
        if (currentIndex === 0) {
            setSelectedMonthName(months[11]);
            setSelectedYear(prev => prev - 1);
        } else {
            setSelectedMonthName(months[currentIndex - 1]);
        }
    };

    const handleNextMonth = () => {
        const currentIndex = months.indexOf(selectedMonthName);
        if (currentIndex === 11) {
            setSelectedMonthName(months[0]);
            setSelectedYear(prev => prev + 1);
        } else {
            setSelectedMonthName(months[currentIndex + 1]);
        }
    };


    // Derived full string for filtering
    const selectedMonth = `${selectedMonthName} ${selectedYear}`;

    // Year Options (Current Year - 1 to Current Year + 5)
    // Same range as ExpensesPage for consistency
    const yearOptions = useMemo(() => {
        const currentYear = currentDate.getFullYear();
        const years = [];
        for (let i = -1; i <= 5; i++) {
            years.push(currentYear + i);
        }
        return years;
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
    const [hoveredCardName, setHoveredCardName] = useState(null);

    // Filter expenses for current month
    const currentMonthExpenses = useMemo(() => {
        return ccExpenses.filter(e => e.month === selectedMonth);
    }, [ccExpenses, selectedMonth]);

    // Get suggestions from the centralized cardsList
    // If cardsList is empty (new user), we might still have historical data if migration hasn't run?
    // Migration runs on load. So cardsList should be truthy.
    const cardSuggestions = useMemo(() => {
        // If cardsList has items, use it.
        // Fallback to history if empty? (Safety net)
        if (cardsList && cardsList.length > 0) return cardsList;
        const unique = new Set(ccExpenses.map(e => e.cardName));
        return Array.from(unique).sort();
    }, [cardsList, ccExpenses]);

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
    // When data changes (month switch or CRUD), we reset the view to exactly what's in the data.
    // This removes "empty" manual cards if they aren't used, but ensures the view is always correct.
    React.useEffect(() => {
        const dataCards = Object.keys(expensesByCard);
        setVisibleCards(dataCards);
    }, [expensesByCard]);

    // Sort Visible Cards: Unpaid first, Paid (all checked) last
    // Within groups, sort by Last Activity (Newest First)
    const sortedVisibleCards = useMemo(() => {
        return [...visibleCards].sort((a, b) => {
            const itemsA = expensesByCard[a] || [];
            const itemsB = expensesByCard[b] || [];

            // Helper to get last activity timestamp
            const getLastActivity = (items) => {
                if (!items || items.length === 0) return 0;
                // Use updatedAt if available, falling back to createdAt
                return Math.max(...items.map(i => new Date(i.updatedAt || i.createdAt || 0).getTime()));
            };

            const lastActivityA = getLastActivity(itemsA);
            const lastActivityB = getLastActivity(itemsB);

            // A card is "Paid" if it has items and ALL are checked
            const isPaidA = itemsA.length > 0 && itemsA.every(item => item.isChecked);
            const isPaidB = itemsB.length > 0 && itemsB.every(item => item.isChecked);

            if (isPaidA !== isPaidB) {
                return isPaidA ? 1 : -1; // Paid goes to bottom
            }

            // If Paid status is same, sort by Last Activity Descending (Newest First)
            if (lastActivityA !== lastActivityB) {
                return lastActivityB - lastActivityA;
            }

            // Fallback to alphabetical for stability
            return a.localeCompare(b);
        });
    }, [visibleCards, expensesByCard]);

    const handleAddCard = () => {
        if (newCardName.trim()) {
            // Allow adding a card manually (it will stay until next data update/month switch)
            setVisibleCards(prev => {
                if (prev.includes(newCardName.trim())) return prev;
                return [...prev, newCardName.trim()];
            });

            // Also add to the global list if not present
            // Safety check: cardsList might be undefined initially
            if (cardsList && !cardsList.includes(newCardName.trim())) {
                addCard(newCardName.trim());
            }

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

    // Card Manager State
    const [isManagerOpen, setIsManagerOpen] = useState(false);
    const [editingCardName, setEditingCardName] = useState(null);
    const [tempCardName, setTempCardName] = useState('');
    const [deleteListConfig, setDeleteListConfig] = useState({ isOpen: false, cardName: null });

    const handleSaveRename = async (oldName) => {
        if (tempCardName.trim() && tempCardName !== oldName) {
            await renameCard(oldName, tempCardName.trim());
            setEditingCardName(null);
        }
    };

    const promptDeleteCardFromList = (cardName) => {
        setDeleteListConfig({ isOpen: true, cardName });
    };

    const confirmDeleteCardList = async () => {
        if (deleteListConfig.cardName) {
            await deleteCard(deleteListConfig.cardName);
        }
        setDeleteListConfig({ isOpen: false, cardName: null });
    };



    // Split into Active and Paid for separate sections
    const activeCards = sortedVisibleCards.filter(cardName => {
        const items = expensesByCard[cardName] || [];
        // Active if NO items (new card) OR NOT all items are checked
        return items.length === 0 || !items.every(item => item.isChecked);
    });

    const paidCards = sortedVisibleCards.filter(cardName => {
        const items = expensesByCard[cardName] || [];
        return items.length > 0 && items.every(item => item.isChecked);
    });

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

            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <div className="flex-responsive" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>Credit Cards</h2>
                        <p style={{ color: 'var(--color-text-muted)' }}>Track your credit card spending and payments.</p>
                    </div>

                    <div className="header-controls" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {/* Month/Year Selects */}
                        <div className="date-selector-group" style={{ display: 'flex', gap: '0.5rem', flex: 1, alignItems: 'center' }}>
                            <Button variant="ghost" onClick={handlePrevMonth} style={{ padding: '0.5rem' }}>
                                <ChevronLeft size={20} />
                            </Button>
                            <select
                                value={selectedMonthName}
                                onChange={(e) => setSelectedMonthName(e.target.value)}
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
                                {months.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
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
                                {yearOptions.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <Button variant="ghost" onClick={handleNextMonth} style={{ padding: '0.5rem' }}>
                                <ChevronRight size={20} />
                            </Button>
                        </div>
                        {/* Manage Categories Button - Moved inside header-controls for better stacking on mobile */}
                        <button
                            onClick={() => setIsManagerOpen(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                background: 'transparent',
                                border: '1px solid var(--color-border)',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: 'var(--color-text-muted)',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <Settings size={16} /> Manage
                        </button>
                    </div>
                </div>

                {/* Card Manager Modal */}
                <Modal isOpen={isManagerOpen} onClose={() => setIsManagerOpen(false)} title="Manage Cards">
                    <div style={{ padding: '1.5rem' }}>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Edit or delete your saved cards. Renaming a card will update it across all past transactions globally.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {cardSuggestions.map(card => (
                                <div
                                    key={card}
                                    onMouseEnter={() => setHoveredCardName(card)}
                                    onMouseLeave={() => setHoveredCardName(null)}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.75rem',
                                        background: 'var(--color-bg-surface)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '8px',
                                        transition: 'background-color 0.2s ease'
                                    }}
                                >
                                    {editingCardName === card ? (
                                        <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                                            <input
                                                autoFocus
                                                type="text"
                                                value={tempCardName}
                                                onChange={(e) => setTempCardName(e.target.value)}
                                                className="input-field"
                                                style={{ padding: '0.4rem' }}
                                            />
                                            <button onClick={() => handleSaveRename(card)} style={{ background: 'var(--color-success)', color: 'white', border: 'none', borderRadius: '4px', padding: '0.4rem', cursor: 'pointer' }}><Check size={16} /></button>
                                            <button onClick={() => setEditingCardName(null)} style={{ background: 'var(--color-text-muted)', color: 'white', border: 'none', borderRadius: '4px', padding: '0.4rem', cursor: 'pointer' }}><X size={16} /></button>
                                        </div>
                                    ) : (
                                        <>
                                            <span style={{ fontWeight: 500 }}>{card}</span>
                                            {/* Action buttons - only visible on hover */}
                                            <div style={{
                                                display: 'flex',
                                                gap: '0.5rem',
                                                opacity: hoveredCardName === card ? 1 : 0,
                                                pointerEvents: hoveredCardName === card ? 'auto' : 'none',
                                                transition: 'opacity 0.2s ease'
                                            }}>
                                                <button
                                                    onClick={() => {
                                                        setEditingCardName(card);
                                                        setTempCardName(card);
                                                    }}
                                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                                                    title="Rename"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => promptDeleteCardFromList(card)}
                                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                            {cardSuggestions.length === 0 && (
                                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No saved cards yet.</div>
                            )}
                        </div>
                    </div>
                </Modal>

                {/* Delete Confirmation for List */}
                <ConfirmModal
                    isOpen={deleteListConfig.isOpen}
                    onClose={() => setDeleteListConfig({ isOpen: false, cardName: null })}
                    onConfirm={confirmDeleteCardList}
                    title="Delete Card"
                    message={`Are you sure you want to delete "${deleteListConfig.cardName}" from your saved list? Existing transactions will remain, but it won't be suggested anymore.`}
                    confirmText="Delete"
                    isDanger
                />

                {/* Active Cards Section */}
                <div style={{
                    columnWidth: '320px',
                    columnGap: '1.5rem',
                    width: '100%',
                    marginBottom: paidCards.length > 0 ? '3rem' : '0'
                }}>
                    {activeCards.map(cardName => (
                        <div key={cardName} style={{ breakInside: 'avoid', marginBottom: '1.5rem' }}>
                            <CardGroup
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
                        </div>
                    ))}

                    {/* Add New Card Group */}
                    <div className="card" style={{
                        padding: '1.5rem',
                        borderStyle: 'dashed',
                        borderColor: 'var(--color-border)',
                        background: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        breakInside: 'avoid',
                        marginBottom: '1.5rem'
                    }}>
                        {isAddingCard ? (
                            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                                <input
                                    autoFocus
                                    type="text"
                                    list="card-suggestions"
                                    placeholder="Card Name (e.g. HDFC)"
                                    className="input-field"
                                    value={newCardName}
                                    onChange={(e) => setNewCardName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddCard()}
                                />
                                <datalist id="card-suggestions">
                                    {cardSuggestions.filter(c => !visibleCards.includes(c)).map(card => (
                                        <option key={card} value={card} />
                                    ))}
                                </datalist>
                                <Button onClick={handleAddCard} size="sm">Add</Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setIsAddingCard(false);
                                        setNewCardName('');
                                    }}
                                    style={{ padding: '0.5rem' }}
                                >
                                    <X size={20} />
                                </Button>
                            </div>
                        ) : (
                            <Button variant="ghost" onClick={() => setIsAddingCard(true)}>
                                <Plus size={18} /> Add New Card Group
                            </Button>
                        )}
                    </div>
                </div>

                {/* Paid Cards Section */}
                {paidCards.length > 0 && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', marginTop: '1rem' }}>
                            <div style={{ height: '1px', flex: 1, background: 'var(--color-border)' }}></div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <CheckCircle size={18} /> Paid Cards
                            </h3>
                            <div style={{ height: '1px', flex: 1, background: 'var(--color-border)' }}></div>
                        </div>

                        <div style={{
                            columnWidth: '320px',
                            columnGap: '1.5rem',
                            width: '100%',
                            opacity: 0.8
                        }}>
                            {paidCards.map(cardName => (
                                <div key={cardName} style={{ breakInside: 'avoid', marginBottom: '1.5rem' }}>
                                    <CardGroup
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
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const CardGroup = ({ cardName, items, onAdd, onUpdate, onDelete, onRename, onDeleteGroup, onMarkPaid, evaluateMath }) => {
    // Sort items by Oldest First (Newest at Bottom)
    const sortedItems = [...items].sort((a, b) => {
        if (a.isChecked !== b.isChecked) {
            return a.isChecked ? 1 : -1;
        }
        return new Date(a.createdAt) - new Date(b.createdAt);
    });

    const [newItemDesc, setNewItemDesc] = useState('');
    const [newItemAmount, setNewItemAmount] = useState('');
    const [isAddingItem, setIsAddingItem] = useState(false);

    const grandTotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

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
        setIsAddingItem(false); // Hide after adding
    };

    const handleEditSave = (id, updates) => {
        const calculatedAmount = evaluateMath(updates.expression || updates.amount);
        onUpdate(id, {
            ...updates,
            amount: calculatedAmount,
        });
        setEditingId(null);
    };

    const [editingId, setEditingId] = useState(null);
    const [editFormData, setEditFormData] = useState({});

    const startEdit = (item) => {
        setEditingId(item.id);
        setEditFormData({
            description: item.description,
            expression: item.expression || item.amount,
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {allPaid && (
                        <div style={{
                            color: 'var(--color-success)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(var(--color-success-rgb), 0.1)',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 600
                        }}>
                            <CheckCircle size={12} /> Paid
                        </div>
                    )}
                    <span style={{ fontWeight: 600, color: allPaid ? 'var(--color-success)' : 'var(--color-primary)' }}>
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(allPaid ? grandTotal : total)}
                    </span>
                </div>
            </div>

            <div style={{ padding: '0.5rem 0' }}>
                {sortedItems.map(item => (
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

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    if (!isAddingItem) {
                        setIsAddingItem(true);
                    } else {
                        handleAddItem(e);
                    }
                }}
                style={{
                    padding: '1rem 1rem', // Reduced side padding for more space
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center',
                    justifyContent: isAddingItem ? 'flex-start' : 'flex-end', // Align button to right when collapsed? Or keep left?
                    // User image shows button on right, text on left. If hidden, where should button be?
                    // "The + button will become right arrow".
                    // If textboxes are hidden, maybe just the button is visible.
                    // Let's assume right alignment for collapsed state looks cleaner if it was originally there.
                    // But usually "Add Item" is distinct.
                    // Let's keep flex-end if collapsed? No, default was simple flex row.
                    // Let's try keeping it simple: just hide inputs.
                }}
            >
                {isAddingItem && (
                    <>
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
                            autoFocus
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
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleAddItem(e);
                                }
                            }}
                        />
                    </>
                )}
                <button
                    type="submit" // On click, if !isAddingItem, handler sets state. If isAddingItem, handler adds.
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
                        flexShrink: 0,
                        marginLeft: isAddingItem ? '0.5rem' : 'auto', // Add small margin when adding
                        transition: 'all 0.2s'
                    }}
                    title={isAddingItem ? "Send" : "Add New Item"}
                >
                    {isAddingItem ? <ArrowRight size={16} /> : <Plus size={16} />}
                </button>
                {isAddingItem && (
                    <button
                        type="button"
                        onClick={() => {
                            setIsAddingItem(false);
                            setNewItemDesc('');
                            setNewItemAmount('');
                        }}
                        style={{
                            background: 'transparent',
                            color: 'var(--color-text-muted)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                            marginLeft: '0.25rem', // Tighter spacing between buttons
                            transition: 'all 0.2s'
                        }}
                        title="Cancel"
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-danger)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                    >
                        <X size={14} />
                    </button>
                )}
            </form>
        </div>
    );
};

export default CreditCardPage;
