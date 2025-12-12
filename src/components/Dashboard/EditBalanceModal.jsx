import React, { useState, useEffect } from 'react';
import Modal from '../UI/Modal';
import Input from '../UI/Input';
import Button from '../UI/Button';

const EditBalanceModal = ({ isOpen, onClose, onSave, currentBalance }) => {
    const [balanceInput, setBalanceInput] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setBalanceInput(currentBalance.toString());
            setError('');
        }
    }, [isOpen, currentBalance]);

    const evaluateExpression = (expression) => {
        try {
            // Remove any non-math characters (allowed: 0-9, +, -, *, /, ., space)
            const sanitized = expression.replace(/[^0-9+\-*/. ]/g, '');
            if (!sanitized) return 0;
            // Evaluates safely
            // eslint-disable-next-line no-new-func
            const result = new Function('return ' + sanitized)();
            if (isNaN(result) || !isFinite(result)) throw new Error('Invalid calculation');
            return result;
        } catch (err) {
            throw new Error('Invalid format');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        try {
            const finalValue = evaluateExpression(balanceInput);
            onSave(finalValue);
            onClose();
        } catch (err) {
            setError('Please enter a valid number or expression (e.g., 50000 + 2000)');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Set Initial Savings">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                    Enter your total starting savings. You can do simple math here (e.g., "50000 + 5000" or "10000 - 200").
                </p>

                {error && (
                    <div style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}>
                        {error}
                    </div>
                )}

                <Input
                    label="Initial Savings Amount"
                    type="text"
                    value={balanceInput}
                    onChange={(e) => { setBalanceInput(e.target.value); setError(''); }}
                    placeholder="e.g. 50000 + 1000"
                    required
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        Save
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default EditBalanceModal;
