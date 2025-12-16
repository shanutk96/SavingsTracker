import React from 'react';
import Modal from './Modal';
import Button from './Button';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', isDanger = false }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div style={{ padding: '1.5rem', paddingTop: '0' }}>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                    {message}
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <Button variant="ghost" onClick={onClose}>
                        {cancelText}
                    </Button>
                    <Button
                        onClick={() => { onConfirm(); onClose(); }}
                        style={isDanger ? { background: 'var(--color-danger)', borderColor: 'var(--color-danger)' } : {}}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmModal;
