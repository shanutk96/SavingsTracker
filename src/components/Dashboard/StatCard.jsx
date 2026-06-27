import React, { useState } from 'react';

const StatCard = ({ title, value, hoverValue, action }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div 
            className="card" 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ 
                padding: '1rem 1.25rem', 
                minHeight: '80px', 
                height: 'auto',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                cursor: 'pointer',
                gap: '0.5rem',
                flexWrap: 'wrap'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0, fontWeight: 500 }}>
                    {title}
                </p>
                {action}
            </div>
            <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 700, 
                margin: 0,
                transition: 'opacity 0.15s ease-in-out'
            }}>
                {isHovered && hoverValue ? hoverValue : value}
            </h3>
        </div>
    );
};

export default StatCard;
