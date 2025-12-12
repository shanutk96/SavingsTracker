import React from 'react';
import Modal from '../UI/Modal';
import Button from '../UI/Button';
import { AlertTriangle } from 'lucide-react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName, itemType = 'entry' }) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Delete ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', textAlign: 'center', padding: '1rem 0' }}>
                <div style={{
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '50%',
                    background: 'var(--color-danger-subtle, rgba(239, 68, 68, 0.1))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-danger)'
                }}>
                    <AlertTriangle size={24} />
                </div>

                <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>
                        Are you sure?
                    </h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                        This action cannot be undone. This will permanently delete the {itemType} for
                        <strong style={{ color: 'var(--color-text-main)' }}> {itemName}</strong>.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
                    <Button variant="ghost" onClick={onClose} style={{ flex: 1 }}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={onConfirm}
                        style={{ flex: 1, background: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                    >
                        Delete Entry
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteConfirmationModal;
