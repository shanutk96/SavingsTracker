import React from 'react';

const StatCard = ({ title, value, action }) => {
    return (
        <div className="card" style={{ 
            padding: '1rem 1.5rem', 
            height: '80px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between' 
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0, fontWeight: 500 }}>
                    {title}
                </p>
                {action}
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                {value}
            </h3>
        </div>
    );
};

export default StatCard;
