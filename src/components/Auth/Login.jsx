import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Input from '../UI/Input';
import Button from '../UI/Button';
import { Wallet, ArrowRight } from 'lucide-react';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const { login, signup } = useAuth();

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!isLogin && password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (isLogin) {
            if (!login(username, password)) {
                setError('Invalid credentials');
            }
        } else {
            const result = signup(username, password);
            if (!result.success) {
                setError(result.message);
            }
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setPassword('');
        setConfirmPassword('');
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, hsl(260, 50%, 90%) 0%, hsl(300, 50%, 90%) 100%)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Ambient Background blobs */}
            <div style={{
                position: 'absolute',
                top: '-10%', left: '-10%',
                width: '500px', height: '500px',
                background: 'var(--color-primary)',
                opacity: 0.1,
                filter: 'blur(80px)',
                borderRadius: '50%',
                animation: 'float 6s ease-in-out infinite'
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-10%', right: '-10%',
                width: '400px', height: '400px',
                background: 'var(--color-secondary, #ec4899)', /* Fallback pink */
                opacity: 0.1,
                filter: 'blur(80px)',
                borderRadius: '50%',
                animation: 'float 8s ease-in-out infinite reverse'
            }} />

            <div className="card" style={{
                width: '100%',
                maxWidth: '400px',
                padding: '2.5rem',
                backdropFilter: 'blur(10px)', /* Glass effect */
                background: 'rgba(255, 255, 255, 0.8)',
                zIndex: 1,
                animation: 'scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        background: 'var(--gradient-primary)',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        margin: '0 auto 1rem',
                        boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.4)',
                        transform: 'rotate(-5deg)'
                    }}>
                        <Wallet size={28} />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        {isLogin ? 'Sign in to track your savings' : 'Start tracking your financial journey'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ animation: 'slideUp 0.4s ease-out 0.1s backwards' }}>
                        <Input
                            label="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            required
                        />
                    </div>
                    <div style={{ animation: 'slideUp 0.4s ease-out 0.2s backwards' }}>
                        <Input
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    {!isLogin && (
                        <div style={{ animation: 'slideUp 0.4s ease-out 0.3s backwards' }}>
                            <Input
                                label="Confirm Password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your password"
                                required
                            />
                        </div>
                    )}

                    {error && (
                        <div style={{
                            padding: '0.75rem',
                            background: 'var(--color-danger-bg)',
                            color: 'var(--color-danger)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            animation: 'fadeIn 0.3s ease-out'
                        }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                            {error}
                        </div>
                    )}

                    <div style={{ animation: 'slideUp 0.4s ease-out 0.3s backwards' }}>
                        <Button type="submit" style={{ marginTop: '0.5rem', width: '100%', padding: '0.8rem' }}>
                            <span>{isLogin ? 'Sign In' : 'Sign Up'}</span>
                            <ArrowRight size={18} />
                        </Button>
                    </div>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', animation: 'fadeIn 0.5s ease-out 0.5s backwards' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                    </span>
                    <button
                        onClick={toggleMode}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-primary)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'opacity 0.2s',
                            fontSize: 'inherit'
                        }}
                    >
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
