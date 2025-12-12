import React from 'react';

const Input = ({
    label,
    error,
    className = '',
    id,
    ...props
}) => {
    return (
        <div className={`input-group ${className}`}>
            {label && (
                <label
                    htmlFor={id || props.name}
                    style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontWeight: 500,
                        fontSize: '0.875rem',
                        color: 'var(--color-text-main)'
                    }}
                >
                    {label}
                </label>
            )}
            <input
                id={id || props.name}
                className="input-field"
                {...props}
            />
            {error && (
                <span style={{
                    color: 'var(--color-danger)',
                    fontSize: '0.75rem',
                    marginTop: '0.25rem',
                    display: 'block'
                }}>
                    {error}
                </span>
            )}
        </div>
    );
};

export default Input;
