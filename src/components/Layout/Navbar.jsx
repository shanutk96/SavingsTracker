import { LogOut, Wallet, User, CreditCard } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../UI/Button';

const Navbar = () => {
    const { user, logout } = useAuth();

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <div style={{ display: 'flex', gap: '1.5rem', marginRight: '1rem' }}>
                            <NavLink
                                to="/"
                                end
                                style={({ isActive }) => ({
                                    textDecoration: 'none',
                                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    fontWeight: isActive ? 600 : 500,
                                    fontSize: '0.925rem',
                                    transition: 'color 0.2s'
                                })}
                            >
                                Overview
                            </NavLink>
                            <NavLink
                                to="/distribution"
                                style={({ isActive }) => ({
                                    textDecoration: 'none',
                                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    fontWeight: isActive ? 600 : 500,
                                    fontSize: '0.925rem',
                                    transition: 'color 0.2s'
                                })}
                            >
                                Investments
                            </NavLink>
                            <NavLink
                                to="/expenses"
                                style={({ isActive }) => ({
                                    textDecoration: 'none',
                                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    fontWeight: isActive ? 600 : 500,
                                    fontSize: '0.925rem',
                                    transition: 'color 0.2s'
                                })}
                            >
                                Expense
                            </NavLink>
                            <NavLink
                                to="/analytics"
                                style={({ isActive }) => ({
                                    textDecoration: 'none',
                                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    fontWeight: isActive ? 600 : 500,
                                    fontSize: '0.925rem',
                                    transition: 'color 0.2s'
                                })}
                            >
                                Trends
                            </NavLink>
                            <NavLink
                                to="/credit-cards"
                                style={({ isActive }) => ({
                                    textDecoration: 'none',
                                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    fontWeight: isActive ? 600 : 500,
                                    fontSize: '0.925rem',
                                    transition: 'color 0.2s'
                                })}
                            >
                                Cards
                            </NavLink>
                        </div>
                        <div style={{ width: '1px', height: '24px', background: 'var(--color-border)' }}></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
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
                                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                    {user.username}
                                </span>
                            </div>
                            <Button variant="ghost" onClick={logout} style={{ fontSize: '0.875rem' }}>
                                <LogOut size={16} />
                                <span>Logout</span>
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
        @media (max-width: 640px) {
          .mobile-hidden { display: none !important; }
        }
      `}</style>
        </nav >
    );
};

export default Navbar;
