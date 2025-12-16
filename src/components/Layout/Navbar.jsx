import { LogOut, Wallet, User, Menu, X } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../UI/Button';
import { useState, useEffect } from 'react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    // Close menu when route changes
    useEffect(() => {
        setIsMenuOpen(false);
    }, [location]);

    // Close menu on resize > 768px
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const navLinks = [
        { path: '/', label: 'Overview' },
        { path: '/distribution', label: 'Investments' },
        { path: '/expenses', label: 'Expense' },
        { path: '/analytics', label: 'Trends' },
        { path: '/credit-cards', label: 'Cards' },
    ];

    return (
        <nav style={{
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-bg-surface)',
            position: 'sticky',
            top: 0,
            zIndex: 40
        }}>
            <div className="container" style={{
                height: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        background: 'var(--color-primary)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                    }}>
                        <Wallet size={18} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>SavingsTracker</span>
                </div>

                {user && (
                    <>
                        {/* Desktop Menu */}
                        <div className="desktop-menu" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                            <div style={{ display: 'flex', gap: '1.5rem', marginRight: '1rem' }}>
                                {navLinks.map(link => (
                                    <NavLink
                                        key={link.path}
                                        to={link.path}
                                        end={link.path === '/'}
                                        style={({ isActive }) => ({
                                            textDecoration: 'none',
                                            color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                            fontWeight: isActive ? 600 : 500,
                                            fontSize: '0.925rem',
                                            transition: 'color 0.2s',
                                            borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                                            paddingBottom: '2px'
                                        })}
                                    >
                                        {link.label}
                                    </NavLink>
                                ))}
                            </div>
                            <div style={{ width: '1px', height: '24px', background: 'var(--color-border)' }}></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-main)' }}>
                                    <div style={{
                                        width: '2rem',
                                        height: '2rem',
                                        background: 'var(--color-bg-subtle)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--color-primary)'
                                    }}>
                                        <User size={18} />
                                    </div>
                                    <span className="desktop-username" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                        {user.username}
                                    </span>
                                </div>
                                <Button variant="ghost" size="sm" onClick={logout} style={{ fontSize: '0.875rem' }}>
                                    <LogOut size={16} />
                                    <span className="desktop-logout-text">Logout</span>
                                </Button>
                            </div>
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            className="mobile-menu-btn"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--color-text-main)',
                                padding: '0.5rem',
                                display: 'none' // Hidden by default, shown via CSS
                            }}
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>

                        {/* Mobile Menu Overlay */}
                        {isMenuOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '64px',
                                left: 0,
                                right: 0,
                                background: 'var(--color-bg-surface)',
                                borderBottom: '1px solid var(--color-border)',
                                padding: '1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                                boxShadow: 'var(--shadow-md)',
                                zIndex: 50
                            }}>
                                {navLinks.map(link => (
                                    <NavLink
                                        key={link.path}
                                        to={link.path}
                                        end={link.path === '/'}
                                        style={({ isActive }) => ({
                                            textDecoration: 'none',
                                            color: isActive ? 'var(--color-primary)' : 'var(--color-text-main)',
                                            fontWeight: isActive ? 600 : 500,
                                            fontSize: '1rem',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            background: isActive ? 'var(--color-bg-subtle)' : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center'
                                        })}
                                    >
                                        {link.label}
                                    </NavLink>
                                ))}
                                <div style={{ height: '1px', background: 'var(--color-border)', margin: '0.5rem 0' }}></div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem' }}>
                                    <span style={{ fontWeight: 500, color: 'var(--color-text-muted)' }}>{user.username}</span>
                                    <Button variant="ghost" size="sm" onClick={logout}>
                                        <LogOut size={16} style={{ marginRight: '4px' }} />
                                        Logout
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <style>{`
        @media (max-width: 768px) {
          .desktop-menu { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
        @media (min-width: 769px) {
            .mobile-menu-btn { display: none !important; }
        }
      `}</style>
        </nav >
    );
};

export default Navbar;
