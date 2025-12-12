import React, { useState, useEffect } from 'react';
import Modal from '../UI/Modal';
import Input from '../UI/Input';
import Button from '../UI/Button';

const AddEntryModal = ({ isOpen, onClose, onSave, editingEntry, existingEntries }) => {
    const [formData, setFormData] = useState({
        salary: '',
        expense: ''
    });
    const [error, setError] = useState('');

    const currentYear = new Date().getFullYear();
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState(currentYear);

    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const years = Array.from({ length: 10 }, (_, i) => currentYear - 2 + i);

    useEffect(() => {
        if (editingEntry) {
            // Parse "Jan 2024" format
            const [m, y] = editingEntry.month.split(' ');
            setSelectedMonth(m || months[new Date().getMonth()]);
            setSelectedYear(Number(y) || currentYear);

            setFormData({
                salary: editingEntry.salary || '',
                expense: editingEntry.expense
            });
        } else {
            setSelectedMonth(months[new Date().getMonth()]);
            setSelectedYear(currentYear);

            // Auto-fill salary from the last entry if available
            // Auto-fill salary from the last entry (first in descending list) if available
            const lastEntry = existingEntries && existingEntries.length > 0 ? existingEntries[0] : null;

            setFormData({
                salary: lastEntry ? lastEntry.salary : '',
                expense: ''
            });
        }
    }, [editingEntry, isOpen, existingEntries]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

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

    const calculatedSavings = evaluateExpression(formData.salary) - evaluateExpression(formData.expense);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        const monthString = `${selectedMonth} ${selectedYear}`;

        // Check for duplicates
        const isDuplicate = existingEntries && existingEntries.some(entry => {
            if (editingEntry && entry.id === editingEntry.id) return false;
            return entry.month === monthString;
        });

        if (isDuplicate) {
            setError(`An entry for ${monthString} already exists. Please edit the existing entry instead.`);
            return;
        }

        const salary = evaluateExpression(formData.salary);
        const expense = evaluateExpression(formData.expense);

        if (salary === 0 && formData.salary !== '' && formData.salary !== '0') {
            setError('Please enter a valid salary amount or expression');
            return;
        }
        if (expense === 0 && formData.expense !== '' && formData.expense !== '0') {
            setError('Please enter a valid expense amount or expression');
            return;
        }

        const savings = salary - expense;

        onSave({
            month: monthString,
            salary,
            expense,
            savings
        });
        onClose();
    };

    // Safe default
    const safeSelectedMonth = selectedMonth || months[0];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingEntry ? 'Edit Entry' : 'Add New Entry'}
        >
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {error && (
                    <div style={{
                        padding: '0.75rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--color-danger)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.875rem',
                        border: '1px solid var(--color-danger)'
                    }}>
                        {error}
                    </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem', color: 'var(--color-text-main)' }}>
                            Month
                        </label>
                        <select
                            value={safeSelectedMonth}
                            onChange={(e) => { setSelectedMonth(e.target.value); setError(''); }}
                            className="input-field"
                            style={{ appearance: 'none', backgroundImage: 'none' }}
                        >
                            {months.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem', color: 'var(--color-text-main)' }}>
                            Year
                        </label>
                        <select
                            value={selectedYear}
                            onChange={(e) => { setSelectedYear(Number(e.target.value)); setError(''); }}
                            className="input-field"
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <Input
                    label="Salary / Income"
                    name="salary"
                    type="text"
                    value={formData.salary}
                    onChange={handleChange}
                    required
                    placeholder="e.g. 50000 + 1000"
                />

                <Input
                    label="Total Expense"
                    name="expense"
                    type="text"
                    value={formData.expense}
                    onChange={handleChange}
                    placeholder="e.g. 5000 + 200"
                    required
                />

                <div style={{
                    padding: '1rem',
                    background: 'var(--color-bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Calculated Savings:</span>
                    <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(calculatedSavings)}
                    </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        {editingEntry ? 'Update Entry' : 'Add Entry'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default AddEntryModal;
