import React, { useState, useEffect } from 'react';
import Modal from '../UI/Modal';
import Button from '../UI/Button';

const EditBalanceModal = ({ isOpen, onClose, onSave, currentBalance, currentExpression }) => {
    const [balanceInput, setBalanceInput] = useState('');
    const [evaluatedAmount, setEvaluatedAmount] = useState(null);
    const [error, setError] = useState('');

    const evaluateExpression = (expression) => {
        try {
            // Remove any non-math characters (allowed: 0-9, +, -, *, /, ., space)
            const sanitized = String(expression).replace(/[^0-9+\-*/. ]/g, '');
            if (!sanitized.trim()) return 0;
            // Evaluates safely
            // eslint-disable-next-line no-new-func
            const result = new Function('return ' + sanitized)();
            if (isNaN(result) || !isFinite(result)) throw new Error('Invalid calculation');
            return result;
        } catch (err) {
            throw new Error('Invalid format');
        }
    };

    useEffect(() => {
        if (isOpen) {
            const initialVal = currentExpression !== undefined && currentExpression !== null && currentExpression !== ''
                ? String(currentExpression)
                : (currentBalance !== undefined && currentBalance !== null ? currentBalance.toString() : '');
            setBalanceInput(initialVal);
            setError('');
            try {
                if (initialVal.trim()) {
                    setEvaluatedAmount(evaluateExpression(initialVal));
                } else {
                    setEvaluatedAmount(null);
                }
            } catch {
                setEvaluatedAmount(null);
            }
        }
    }, [isOpen, currentBalance, currentExpression]);

    // Live update evaluated amount
    useEffect(() => {
        if (!balanceInput || balanceInput.trim() === '') {
            setEvaluatedAmount(null);
            return;
        }
        try {
            const val = evaluateExpression(balanceInput);
            setEvaluatedAmount(val);
        } catch {
            // Expression might be incomplete while typing (e.g. "474760-")
        }
    }, [balanceInput]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        try {
            const finalValue = evaluateExpression(balanceInput);
            onSave(finalValue, balanceInput.trim());
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

                <div className="input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <label style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--color-text-main)', margin: 0 }}>
                            Initial Savings Amount
                        </label>
                        {balanceInput && evaluatedAmount !== null && !isNaN(evaluatedAmount) && balanceInput.trim() !== String(evaluatedAmount) && (
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                                = {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(evaluatedAmount)}
                            </span>
                        )}
                    </div>
                    <input
                        type="text"
                        className="input-field"
                        value={balanceInput}
                        onChange={(e) => { setBalanceInput(e.target.value); setError(''); }}
                        placeholder="e.g. 50000 + 1000"
                        style={{ fontFamily: 'monospace' }}
                        autoFocus
                        required
                    />
                </div>

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
