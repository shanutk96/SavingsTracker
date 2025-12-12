import React from 'react';

const StatCard = ({ title, value, icon: Icon, trend, action }) => {
    return (
        <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
                            {title}
                        </p>
                        {action}
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                        {value}
                    </h3>
                </div>
                <div style={{
                    padding: '0.75rem',
                    background: 'var(--color-bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-primary)'
                }}>
                    {Icon && <Icon size={24} />}
                </div>
            </div>
        </div>
    );
};

export default StatCard;
