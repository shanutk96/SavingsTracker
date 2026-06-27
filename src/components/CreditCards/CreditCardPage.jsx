import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import Button from '../UI/Button';
import ConfirmModal from '../UI/ConfirmModal';
import Modal from '../UI/Modal';
import { Plus, Trash2, CheckSquare, Square, Calculator, SquarePen, Check, X, CheckCircle, ArrowRight, Settings, ChevronLeft, ChevronRight, Clock, Calendar, MoreVertical, ChevronDown, ChevronUp, PlusCircle } from 'lucide-react';

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
        deleteCard,
        cardBillDates,
        updateCardBillDate
    } = useData();

    // Month Selection
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentDate = new Date();

    // Smart Default: If date is <= 20th, show previous month. Else current month.
    let initialMonthIndex = currentDate.getMonth();
    let initialYear = currentDate.getFullYear();

    if (currentDate.getDate() <= 20) {
        if (initialMonthIndex === 0) {
            initialMonthIndex = 11;
            initialYear -= 1;
        } else {
            initialMonthIndex -= 1;
        }
    }

    const [selectedMonthName, setSelectedMonthName] = useState(months[initialMonthIndex]);
    const [selectedYear, setSelectedYear] = useState(initialYear);

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
    const [newCardBillDay, setNewCardBillDay] = useState('');
    const [isAddingCard, setIsAddingCard] = useState(false);
    const [hoveredCardName, setHoveredCardName] = useState(null);
    const [addExpenseConfig, setAddExpenseConfig] = useState({ isOpen: false, cardName: null });

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
    // Within groups:
    // 1. Sort by Bill Day (ascending). If no bill day, place at the end.
    // 2. Fallback to alphabetical for stability.
    const sortedVisibleCards = useMemo(() => {
        return [...visibleCards].sort((a, b) => {
            const itemsA = expensesByCard[a] || [];
            const itemsB = expensesByCard[b] || [];

            // A card is "Paid" if it has items and ALL are checked
            const isPaidA = itemsA.length > 0 && itemsA.every(item => item.isChecked);
            const isPaidB = itemsB.length > 0 && itemsB.every(item => item.isChecked);

            if (isPaidA !== isPaidB) {
                return isPaidA ? 1 : -1; // Paid goes to bottom
            }

            // Sort by Bill Day
            const dayA = cardBillDates[a];
            const dayB = cardBillDates[b];

            const hasDayA = typeof dayA === 'number' && dayA > 0;
            const hasDayB = typeof dayB === 'number' && dayB > 0;

            if (hasDayA && hasDayB) {
                if (dayA !== dayB) {
                    return dayA - dayB; // Earlier due date first
                }
            } else if (hasDayA) {
                return -1;
            } else if (hasDayB) {
                return 1;
            }

            // Fallback to alphabetical for stability
            return a.localeCompare(b);
        });
    }, [visibleCards, expensesByCard, cardBillDates]);

    const handleAddCard = async () => {
        if (newCardName.trim()) {
            const trimmedName = newCardName.trim();
            // Allow adding a card manually (it will stay until next data update/month switch)
            setVisibleCards(prev => {
                if (prev.includes(trimmedName)) return prev;
                return [...prev, trimmedName];
            });

            // Also add to the global list if not present
            // Safety check: cardsList might be undefined initially
            if (cardsList && !cardsList.includes(trimmedName)) {
                await addCard(trimmedName);
            }

            // Save the bill day cycle if provided
            if (newCardBillDay) {
                const dayNum = parseInt(newCardBillDay, 10);
                if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
                    await updateCardBillDate(trimmedName, dayNum);
                }
            }

            setNewCardName('');
            setNewCardBillDay('');
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
    const [tempBillDay, setTempBillDay] = useState('');
    const [deleteListConfig, setDeleteListConfig] = useState({ isOpen: false, cardName: null });
    const [activeDropdownCard, setActiveDropdownCard] = useState(null);

    const handleSaveRename = async (oldName) => {
        const targetName = tempCardName.trim();
        if (targetName) {
            if (targetName !== oldName) {
                await renameCard(oldName, targetName);
            }
            const dayNum = tempBillDay ? parseInt(tempBillDay, 10) : '';
            await updateCardBillDate(targetName, dayNum);
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
                <div className="flex-responsive" style={{ marginBottom: '2rem' }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>Credit Cards</h2>
                        <p style={{ color: 'var(--color-text-muted)' }}>Track your credit card spending and payments.</p>
                    </div>

                    <div className="header-controls">
                        {/* Month/Year Selects */}
                        <div className="date-selector-group">
                            <Button variant="ghost" onClick={handlePrevMonth} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ChevronLeft size={20} />
                            </Button>
                            <select
                                value={selectedMonthName}
                                onChange={(e) => setSelectedMonthName(e.target.value)}
                                className="select-minimal"
                                style={{
                                    cursor: 'pointer'
                                }}
                            >
                                {months.map(m => (
                                    <option key={m} value={m}>{m} Cycle</option>
                                ))}
                            </select>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="select-minimal"
                                style={{
                                    cursor: 'pointer'
                                }}
                            >
                                {yearOptions.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <Button variant="ghost" onClick={handleNextMonth} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ChevronRight size={20} />
                            </Button>
                        </div>
                        <Button
                            onClick={() => setIsAddingCard(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Plus size={16} /> Add Card
                        </Button>
                        {/* Manage Categories Button - Moved inside header-controls for better stacking on mobile */}
                        <button
                            onClick={() => setIsManagerOpen(true)}
                            className="btn btn-ghost"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                border: '1px solid var(--color-border)',
                                cursor: 'pointer',
                                color: 'var(--color-text-muted)'
                            }}
                        >
                            <Settings size={16} /> Manage
                        </button>
                    </div>
                </div>

                {/* Card Manager Modal */}
                <Modal isOpen={isManagerOpen} onClose={() => { setIsManagerOpen(false); setActiveDropdownCard(null); }} title="Manage Cards">
                    <div style={{ padding: '1.5rem' }}>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Edit or delete your saved cards. Renaming a card will update it across all past transactions globally.
                        </p>

                        <div style={{
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            background: 'var(--color-bg-surface)',
                            position: 'relative',
                            overflow: 'visible'
                        }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--color-border)', background: 'var(--color-bg-subtle)' }}>
                                        <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Card Name</th>
                                        <th style={{ textAlign: 'center', padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', width: '100px' }}>Bill Day</th>
                                        <th style={{ textAlign: 'right', padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', width: '100px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cardSuggestions.map((card, index) => {
                                        const isEditing = editingCardName === card;
                                        return (
                                            <tr
                                                key={card}
                                                onMouseEnter={() => setHoveredCardName(card)}
                                                onMouseLeave={() => setHoveredCardName(null)}
                                                style={{
                                                    borderBottom: index === cardSuggestions.length - 1 ? 'none' : '1px solid var(--color-border)',
                                                    background: hoveredCardName === card ? 'var(--color-bg-subtle)' : 'transparent',
                                                    transition: 'background-color 0.15s ease'
                                                }}
                                            >
                                                {isEditing ? (
                                                    <>
                                                        <td style={{ padding: '0.5rem 1rem' }}>
                                                             <input
                                                                 autoFocus
                                                                 type="text"
                                                                 value={tempCardName}
                                                                 onChange={(e) => setTempCardName(e.target.value)}
                                                                 className="input-field"
                                                                 style={{ padding: '0.4rem 0.6rem', width: '100%', minHeight: '34px', fontSize: '0.85rem' }}
                                                             />
                                                        </td>
                                                        <td style={{ padding: '0.5rem 1rem', textAlign: 'center' }}>
                                                             <input
                                                                 type="number"
                                                                 min="1"
                                                                 max="31"
                                                                 placeholder="DD"
                                                                 value={tempBillDay}
                                                                 onChange={(e) => setTempBillDay(e.target.value)}
                                                                 className="input-field"
                                                                 style={{ padding: '0.4rem 0.6rem', width: '65px', minHeight: '34px', fontSize: '0.85rem', textAlign: 'center', margin: '0 auto' }}
                                                             />
                                                        </td>
                                                        <td style={{ padding: '0.5rem 1rem', textAlign: 'right' }}>
                                                             <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                                                 <button
                                                                     onClick={() => handleSaveRename(card)}
                                                                     style={{ background: 'var(--color-success)', color: 'white', border: 'none', borderRadius: '4px', padding: '0.45rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                                                                     title="Save"
                                                                 >
                                                                     <Check size={14} />
                                                                 </button>
                                                                 <button
                                                                     onClick={() => setEditingCardName(null)}
                                                                     style={{ background: 'var(--color-text-muted)', color: 'white', border: 'none', borderRadius: '4px', padding: '0.45rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                                                                     title="Cancel"
                                                                 >
                                                                     <X size={14} />
                                                                 </button>
                                                             </div>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: 'var(--color-text-main)' }}>
                                                             {card}
                                                        </td>
                                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 500, color: 'var(--color-text-main)' }}>
                                                             {cardBillDates[card] || '-'}
                                                        </td>
                                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', position: 'relative' }}>
                                                             <div style={{ display: 'inline-block', position: 'relative' }}>
                                                                 <button
                                                                     onClick={(e) => {
                                                                         e.stopPropagation();
                                                                         setActiveDropdownCard(activeDropdownCard === card ? null : card);
                                                                     }}
                                                                     style={{
                                                                         background: 'transparent',
                                                                         border: 'none',
                                                                         cursor: 'pointer',
                                                                         color: 'var(--color-text-muted)',
                                                                         padding: '4px',
                                                                         display: 'inline-flex',
                                                                         alignItems: 'center',
                                                                         justifyContent: 'center',
                                                                         borderRadius: '4px',
                                                                         transition: 'all 0.15s ease'
                                                                     }}
                                                                     className="btn-ghost"
                                                                     title="Actions"
                                                                 >
                                                                     <MoreVertical size={16} />
                                                                 </button>
 
                                                                 {activeDropdownCard === card && (
                                                                     <>
                                                                         <div
                                                                             onClick={(e) => {
                                                                                 e.stopPropagation();
                                                                                 setActiveDropdownCard(null);
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
                                                                             right: 0,
                                                                             top: '100%',
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
                                                                                     setActiveDropdownCard(null);
                                                                                     setEditingCardName(card);
                                                                                     setTempCardName(card);
                                                                                     setTempBillDay(cardBillDates[card] || '');
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
                                                                                     setActiveDropdownCard(null);
                                                                                     promptDeleteCardFromList(card);
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
                                                    </>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {cardSuggestions.length === 0 && (
                                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No saved cards yet.</div>
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
                                billDay={cardBillDates[cardName]}
                                onUpdateBillDay={updateCardBillDate}
                                onOpenAddExpense={(name) => setAddExpenseConfig({ isOpen: true, cardName: name })}
                            />
                        </div>
                    ))}
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
                                        billDay={cardBillDates[cardName]}
                                        onUpdateBillDay={updateCardBillDate}
                                        onOpenAddExpense={(name) => setAddExpenseConfig({ isOpen: true, cardName: name })}
                                    />
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
            {/* Add Expense Bottom Sheet */}
            <AddExpenseBottomSheet
                isOpen={addExpenseConfig.isOpen}
                onClose={() => setAddExpenseConfig({ isOpen: false, cardName: null })}
                cardName={addExpenseConfig.cardName}
                onAdd={(item) => addCCExpense({ ...item, cardName: addExpenseConfig.cardName, month: selectedMonth })}
                evaluateMath={evaluateMathExpression}
            />



            {/* Add Card Modal */}
            <Modal
                isOpen={isAddingCard}
                onClose={() => {
                    setIsAddingCard(false);
                    setNewCardName('');
                    setNewCardBillDay('');
                }}
                title="Add Credit Card"
            >
                <div style={{ padding: '1.5rem' }}>
                    <form onSubmit={(e) => { e.preventDefault(); handleAddCard(); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label className="label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Card Name</label>
                            <input
                                autoFocus
                                type="text"
                                list="modal-card-suggestions"
                                placeholder="Card Name (e.g. HDFC)"
                                className="input-field"
                                value={newCardName}
                                onChange={(e) => setNewCardName(e.target.value)}
                                required
                            />
                            <datalist id="modal-card-suggestions">
                                {cardSuggestions.filter(c => !visibleCards.includes(c)).map(card => (
                                    <option key={card} value={card} />
                                ))}
                            </datalist>
                        </div>

                        <div>
                            <label className="label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Bill Cycle Day (Optional)</label>
                            <input
                                type="number"
                                min="1"
                                max="31"
                                placeholder="Day of month (e.g. 15)"
                                className="input-field"
                                value={newCardBillDay}
                                onChange={(e) => setNewCardBillDay(e.target.value)}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    setIsAddingCard(false);
                                    setNewCardName('');
                                    setNewCardBillDay('');
                                }}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" variant="primary">
                                Add Card
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Custom Responsive Styles for FAB */}
            <style>{`
                @media (max-width: 768px) {
                    .fab-button {
                        bottom: 1.5rem !important;
                        right: 1.5rem !important;
                        padding: 0.75rem 1.25rem !important;
                        font-size: 0.9rem !important;
                    }
                }
            `}</style>
        </div>
    );
};

const CardGroup = ({ cardName, items, month, onAdd, onUpdate, onDelete, onRename, onDeleteGroup, onMarkPaid, evaluateMath, billDay, onUpdateBillDay, onOpenAddExpense }) => {
    const { ccExpenses } = useData();
    const today = new Date();
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const actualCurrentMonth = `${months[today.getMonth()]} ${today.getFullYear()}`;
    const currentMonthExpenses = ccExpenses.filter(e => e.cardName === cardName && e.month === actualCurrentMonth);
    const isCurrentMonthPaid = currentMonthExpenses.length === 0 || currentMonthExpenses.every(item => item.isChecked);

    // Sort items by Oldest First (Newest at Bottom)
    const sortedItems = [...items].sort((a, b) => {
        if (a.isChecked !== b.isChecked) {
            return a.isChecked ? 1 : -1;
        }
        return new Date(a.createdAt) - new Date(b.createdAt);
    });

    const [isExpanded, setIsExpanded] = useState(false);

    const grandTotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const total = items.reduce((sum, item) => {
        if (item.isChecked) return sum;
        return sum + (Number(item.amount) || 0);
    }, 0);

    const allPaid = items.length > 0 && items.every(item => item.isChecked);

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



    // Delete Item Confirmation State
    const [isItemDeleteModalOpen, setIsItemDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const promptDeleteItem = (item) => {
        setItemToDelete(item);
        setIsItemDeleteModalOpen(true);
    };

    const confirmDeleteItem = () => {
        if (itemToDelete) {
            onDelete(itemToDelete.id);
            setItemToDelete(null);
            setIsItemDeleteModalOpen(false);
        }
    };

    const daysRemainingInfo = getDaysRemainingInfo(billDay, cardName, month, ccExpenses);

    return (
        <div
            className="card card-group-header"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
                padding: '12px 16px',
                overflow: 'visible',
                transition: 'all 0.2s',
                cursor: 'pointer'
            }}
        >
            {/* Header Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%' }}>
                {/* Row 1: Card Name & Actions on Left, Amount & Paid status on Right */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{cardName}</h3>

                        <div className="header-actions" style={{ display: 'flex', gap: '4px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => onMarkPaid(!allPaid)}
                                className="header-edit-btn"
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    outline: 'none',
                                    cursor: 'pointer',
                                    color: allPaid ? 'var(--color-success)' : 'var(--color-text-muted)',
                                    width: '44px',
                                    height: '44px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                title={allPaid ? "Mark All Unpaid" : "Mark All Paid"}
                            >
                                <CheckCircle size={18} />
                            </button>
                            <button
                                onClick={onDeleteGroup}
                                className="header-edit-btn"
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--color-text-muted)',
                                    width: '44px',
                                    height: '44px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 'var(--radius-sm)',
                                    transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = 'var(--color-danger)';
                                    e.currentTarget.style.background = 'var(--color-danger-bg)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = 'var(--color-text-muted)';
                                    e.currentTarget.style.background = 'transparent';
                                }}
                                title="Delete Card Group"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <span style={{ fontWeight: 600, fontSize: '1.05rem', color: allPaid ? 'var(--color-success)' : 'var(--color-primary)' }}>
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(allPaid ? grandTotal : total)}
                        </span>
                    </div>
                </div>

                {/* Row 2: Cycle range & Days Remaining on one line */}
                {billDay && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.8rem',
                        color: 'var(--color-text-muted)',
                        marginTop: '2px'
                    }}>
                        <Calendar size={12} style={{ flexShrink: 0 }} />
                        <span>{getCycleRangeString(month, billDay)}</span>
                        {daysRemainingInfo && (
                            <>
                                <span>•</span>
                                <span style={{ color: daysRemainingInfo.color, fontWeight: 500 }}>
                                    {daysRemainingInfo.text}
                                </span>
                            </>
                        )}
                    </div>
                )}

                {/* Row 3: Transaction Count and Expand/Collapse indicator */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '4px'
                }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {items.length} {items.length === 1 ? 'transaction' : 'transactions'}
                    </span>
                    <div style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                </div>
            </div>

            {/* Expanded Content: Transaction List & Compact Add Form */}
            {isExpanded && (
                <>
                    <div style={{
                        borderTop: '1px solid var(--color-border)',
                        marginTop: '10px',
                        padding: '4px 0'
                    }} onClick={e => e.stopPropagation()}>
                        {sortedItems.map(item => (
                            <div key={item.id} className="distribution-row" style={{
                                padding: '8px 16px',
                                borderBottom: '1px solid var(--color-border-subtle)',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                minHeight: '36px'
                            }}>
                                {editingId === item.id ? (
                                    <div style={{ display: 'flex', gap: '0.5rem', width: '100%', alignItems: 'center' }}>
                                        <input
                                            className="input-field"
                                            value={editFormData.description || ''}
                                            onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                                            placeholder="Description"
                                            style={{
                                                flex: 1,
                                                background: 'transparent',
                                                border: 'none',
                                                borderBottom: '1px solid var(--color-primary)',
                                                borderRadius: 0,
                                                padding: '2px 0',
                                                fontSize: '0.85rem',
                                                boxShadow: 'none'
                                            }}
                                        />

                                        <input
                                            className="input-field"
                                            value={editFormData.expression}
                                            onChange={e => setEditFormData({ ...editFormData, expression: e.target.value })}
                                            placeholder="Amount"
                                            autoFocus
                                            style={{
                                                width: '80px',
                                                background: 'transparent',
                                                border: 'none',
                                                borderBottom: '1px solid var(--color-primary)',
                                                borderRadius: 0,
                                                padding: '2px 0',
                                                fontSize: '0.85rem',
                                                boxShadow: 'none',
                                                fontFamily: 'monospace',
                                                textAlign: 'right'
                                            }}
                                        />
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button
                                                onClick={() => handleEditSave(item.id, editFormData)}
                                                style={{
                                                    background: 'var(--gradient-primary)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    padding: '2px 6px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem'
                                                }}
                                                title="Save"
                                            >
                                                <Check size={12} />
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                style={{
                                                    background: 'transparent',
                                                    color: 'var(--color-text-muted)',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    padding: '2px 6px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem'
                                                }}
                                                title="Cancel"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => onUpdate(item.id, { isChecked: !item.isChecked })}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: item.isChecked ? 'var(--color-success)' : 'var(--color-text-muted)',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '4px',
                                                borderRadius: 'var(--radius-sm)',
                                                marginRight: '4px'
                                            }}
                                            title={item.isChecked ? "Mark as unpaid" : "Mark as paid"}
                                        >
                                            {item.isChecked ? <CheckSquare size={16} /> : <Square size={16} />}
                                        </button>
                                        <div style={{ flex: 1, color: item.isChecked ? 'var(--color-text-muted)' : 'var(--color-text-main)', textDecoration: item.isChecked ? 'line-through' : 'none' }}>
                                            {item.description}
                                        </div>
                                        <div style={{ fontWeight: 500, fontFamily: 'monospace', color: item.isChecked ? 'var(--color-text-muted)' : 'var(--color-text-main)' }}>
                                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.amount)}
                                        </div>
                                        <div className="action-buttons" style={{ display: 'flex', gap: '4px', marginLeft: '6px' }}>
                                            <button
                                                onClick={() => startEdit(item)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: 'var(--color-text-muted)',
                                                    width: '44px',
                                                    height: '44px',
                                                    borderRadius: 'var(--radius-sm)',
                                                    transition: 'all 0.15s ease',
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
                                                title="Edit"
                                            >
                                                <SquarePen size={18} />
                                            </button>
                                            <button
                                                onClick={() => promptDeleteItem(item)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: 'var(--color-text-muted)',
                                                    width: '44px',
                                                    height: '44px',
                                                    borderRadius: 'var(--radius-sm)',
                                                    transition: 'all 0.15s ease',
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
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                        {sortedItems.length === 0 && (
                            <div style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                                No transactions this month.
                            </div>
                        )}
                    </div>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '4px 0',
                        marginTop: '2px'
                    }} onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => onOpenAddExpense(cardName)}
                            style={{
                                background: 'none',
                                border: 'none',
                                outline: 'none',
                                cursor: 'pointer',
                                color: 'var(--color-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'transform 0.2s',
                                padding: '2px'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            title="Add Expense"
                        >
                            <PlusCircle size={20} />
                        </button>
                    </div>
                </>
            )}

            {/* Individual Item Delete Confirmation */}
            <ConfirmModal
                isOpen={isItemDeleteModalOpen}
                title="Delete Entry?"
                message={`Are you sure you want to delete "${itemToDelete?.description}"?`}
                onConfirm={confirmDeleteItem}
                onClose={() => {
                    setIsItemDeleteModalOpen(false);
                    setItemToDelete(null);
                }}
            />
        </div>
    );
};

const DaysRemainingBadge = ({ billDay, cardName, selectedMonth }) => {
    const { ccExpenses } = useData();
    if (!billDay) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const year = today.getFullYear();
    const month = today.getMonth();

    // 1. Calculate the due date for the selected billing cycle
    const [monthName, yearStr] = selectedMonth.split(' ');
    const selectedYear = parseInt(yearStr, 10);
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = months.indexOf(monthName);

    // Due date is the bill day of the following month
    let dueMonth = monthIndex + 1;
    let dueYear = selectedYear;
    if (dueMonth > 11) {
        dueMonth = 0;
        dueYear += 1;
    }
    const dueDate = new Date(dueYear, dueMonth, billDay);

    // 2. Check if the card is paid for the selected cycle
    const cycleExpenses = ccExpenses.filter(e => e.cardName === cardName && e.month === selectedMonth);
    const isPaid = cycleExpenses.length === 0 || cycleExpenses.every(item => item.isChecked);

    if (isPaid) {
        return (
            <span style={{
                fontSize: '0.68rem',
                fontWeight: 500,
                padding: '2px 6px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.1)',
                color: 'var(--color-success)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                whiteSpace: 'nowrap'
            }} title={`Billing Day: ${billDay}`}>
                <CheckCircle size={11} />
                Paid
            </span>
        );
    }

    if (dueDate < today) {
        const diffTime = today - dueDate;
        const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return (
            <span style={{
                fontSize: '0.68rem',
                fontWeight: 500,
                padding: '2px 6px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--color-danger)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                whiteSpace: 'nowrap'
            }} title={`Billing Day: ${billDay}`}>
                <Clock size={11} />
                Overdue by {days} {days === 1 ? 'day' : 'days'}
            </span>
        );
    }

    const diffTime = dueDate - today;
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let badgeBg = 'var(--color-bg-subtle)';
    let badgeColor = 'var(--color-text-muted)';
    let badgeBorder = '1px solid var(--color-border)';
    let text = `${days} days left`;

    if (days === 0) {
        badgeBg = 'rgba(239, 68, 68, 0.1)';
        badgeColor = 'var(--color-danger)';
        badgeBorder = '1px solid rgba(239, 68, 68, 0.2)';
        text = 'Bill today';
    } else if (days === 1) {
        badgeBg = 'rgba(239, 68, 68, 0.08)';
        badgeColor = 'var(--color-danger)';
        badgeBorder = '1px solid rgba(239, 68, 68, 0.15)';
        text = 'Bill tomorrow';
    } else if (days <= 3) {
        badgeBg = 'rgba(245, 158, 11, 0.1)';
        badgeColor = '#d97706';
        badgeBorder = '1px solid rgba(245, 158, 11, 0.2)';
        text = `${days} days left`;
    }

    return (
        <span style={{
            fontSize: '0.68rem',
            fontWeight: 500,
            padding: '2px 6px',
            borderRadius: '12px',
            background: badgeBg,
            color: badgeColor,
            border: badgeBorder,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            whiteSpace: 'nowrap'
        }} title={`Billing Day: ${billDay}`}>
            <Clock size={11} />
            {text}
        </span>
    );
};

const getCycleRangeString = (selectedMonth, billDay) => {
    if (!billDay) return '';
    const [monthName, yearStr] = selectedMonth.split(' ');
    const year = parseInt(yearStr, 10);
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = months.indexOf(monthName);

    // Start date: selected month, billDay, selectedYear
    const startDate = new Date(year, monthIndex, billDay);

    // End date: day before the next billDate
    let nextMonthIndex = monthIndex + 1;
    let nextYear = year;
    if (nextMonthIndex > 11) {
        nextMonthIndex = 0;
        nextYear += 1;
    }

    const endDate = new Date(nextYear, nextMonthIndex, billDay - 1);

    const formatShort = (date) => {
        const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${shortMonths[date.getMonth()]} ${date.getDate()}`;
    };

    return `${formatShort(startDate)} - ${formatShort(endDate)}`;
};

const getDaysRemainingInfo = (billDay, cardName, selectedMonth, ccExpenses) => {
    if (!billDay) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Calculate the due date for the selected billing cycle
    const [monthName, yearStr] = selectedMonth.split(' ');
    const selectedYear = parseInt(yearStr, 10);
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = months.indexOf(monthName);

    // Due date is the bill day of the following month
    let dueMonth = monthIndex + 1;
    let dueYear = selectedYear;
    if (dueMonth > 11) {
        dueMonth = 0;
        dueYear += 1;
    }
    const dueDate = new Date(dueYear, dueMonth, billDay);

    // 2. Check if the card is paid for the selected cycle
    const cycleExpenses = ccExpenses.filter(e => e.cardName === cardName && e.month === selectedMonth);
    const isPaid = cycleExpenses.length === 0 || cycleExpenses.every(item => item.isChecked);

    if (isPaid) {
        return { text: 'Paid', color: 'var(--color-success)' };
    }

    if (dueDate < today) {
        const diffTime = today - dueDate;
        const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return { text: `Overdue by ${days} ${days === 1 ? 'day' : 'days'}`, color: 'var(--color-danger)' };
    }

    const diffTime = dueDate - today;
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (days === 0) {
        return { text: 'Bill today', color: 'var(--color-danger)' };
    } else if (days === 1) {
        return { text: 'Bill tomorrow', color: 'var(--color-danger)' };
    } else if (days <= 3) {
        return { text: `${days} days left`, color: '#d97706' };
    }
    return { text: `${days} days left`, color: 'var(--color-text-muted)' };
};

const AddExpenseBottomSheet = ({ isOpen, onClose, cardName, onAdd, evaluateMath }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [evaluatedAmount, setEvaluatedAmount] = useState(0);

    // Auto-focus description field when open
    const descInputRef = React.useRef(null);
    useEffect(() => {
        if (isOpen) {
            setDescription('');
            setAmount('');
            setEvaluatedAmount(0);
            // Wait slightly for transition
            const timer = setTimeout(() => {
                descInputRef.current?.focus();
            }, 150);
            document.body.style.overflow = 'hidden';
            return () => {
                clearTimeout(timer);
                document.body.style.overflow = 'unset';
            };
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    // Live update evaluated amount
    useEffect(() => {
        if (amount.trim() === '') {
            setEvaluatedAmount(0);
            return;
        }
        const val = evaluateMath(amount);
        setEvaluatedAmount(val);
    }, [amount, evaluateMath]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const finalAmount = evaluateMath(amount);
        if (!finalAmount || !description.trim()) return;

        onAdd({
            description: description.trim(),
            amount: finalAmount,
            expression: amount,
            isChecked: false,
        });
        onClose();
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(4px)',
                }}
            />

            {/* Content Sheet / Modal */}
            <div
                className="add-expense-sheet card"
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '500px',
                    margin: '1rem',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    zIndex: 1001,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '1.5rem',
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                        Add to {cardName}
                    </h2>
                    <button
                        onClick={onClose}
                        className="btn btn-ghost"
                        style={{ padding: '0.5rem', minHeight: 'auto' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label className="label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Description</label>
                        <input
                            ref={descInputRef}
                            type="text"
                            placeholder="What was this for?"
                            className="input-field"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label className="label" style={{ fontWeight: 500, fontSize: '0.9rem', margin: 0 }}>Amount</label>
                            {amount && amount !== String(evaluatedAmount) && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                                    = {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(evaluatedAmount)}
                                </span>
                            )}
                        </div>
                        <input
                            type="text"
                            placeholder="0 (supports math like 50+20)"
                            className="input-field"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            style={{ fontFamily: 'monospace' }}
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        style={{ marginTop: '1rem', width: '100%' }}
                        disabled={!description.trim() || !amount}
                    >
                        Add Expense
                    </Button>
                </form>
            </div>

            <style>{`
                .add-expense-sheet {
                    animation: desktopSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes desktopSlideIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.96); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @media (max-width: 768px) {
                    .add-expense-sheet {
                        position: fixed !important;
                        left: 0 !important;
                        right: 0 !important;
                        bottom: 0 !important;
                        margin: 0 !important;
                        max-width: 100% !important;
                        border-radius: var(--radius-lg) var(--radius-lg) 0 0 !important;
                        animation: mobileSheetSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
                    }
                    @keyframes mobileSheetSlideUp {
                        from { transform: translateY(100%); }
                        to { transform: translateY(0); }
                    }
                }
            `}</style>
        </div>
    );
};

export default CreditCardPage;
