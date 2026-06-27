import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
    return (
        <>
            <Navbar />
            <main className="container main-content" style={{ flex: 1 }}>
                <Outlet />
            </main>
            <footer style={{
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                fontSize: '0.875rem',
                borderTop: '1px solid var(--color-border)',
                marginTop: 'auto'
            }}>
                <div className="container">
                    &copy; {new Date().getFullYear()} SavingsTracker. All rights reserved.
                </div>
            </footer>
        </>
    );
};

export default Layout;
