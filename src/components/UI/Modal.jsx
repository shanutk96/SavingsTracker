import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50,
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

            {/* Content */}
            <div
                className="card"
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '500px',
                    margin: '1rem',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
            >
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{title}</h2>
                    <button
                        onClick={onClose}
                        className="btn btn-ghost"
                        style={{ padding: '0.5rem' }}
                    >
                        <X size={20} />
                    </button>
                </div>
                {children}
            </div>

            <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
        </div>
    );
};

export default Modal;
