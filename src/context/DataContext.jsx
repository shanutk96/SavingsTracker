import { createContext, useContext, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const { user } = useAuth();
    // If no user, mock a default key or return empty. Since App logic protects dashboard, user should exist.
    // We use a key based on username to separate data.
    const userKey = user ? `savings_entries_${user.username}` : 'savings_entries_guest';
    const balanceKey = user ? `initial_balance_${user.username}` : 'initial_balance_guest';

    const distributionKey = user ? `savings_distribution_${user.username}` : 'savings_distribution_guest';

    const [entries, setEntries] = useLocalStorage(userKey, []);
    const [initialBalance, setInitialBalance] = useLocalStorage(balanceKey, 0);
    const [distributions, setDistributions] = useLocalStorage(distributionKey, []);

    // Calculate moving totals dynamically to ensure consistency
    const processedEntries = useMemo(() => {
        let runningTotal = Number(initialBalance);

        // Helper to parse "Jan 2025" to a comparable value
        const getMonthValue = (monthStr) => {
            const [m, y] = monthStr.split(' ');
            const monthIndex = [
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
            ].indexOf(m);
            return (Number(y) * 12) + monthIndex;
        };

        // 1. Sort Ascending (Oldest First) for calculation
        const sortedAscending = [...entries].sort((a, b) => getMonthValue(a.month) - getMonthValue(b.month));

        // 2. Calculate Running Totals
        const calculated = sortedAscending.map(entry => {
            const savings = Number(entry.savings) || 0;
            runningTotal += savings;

            return {
                ...entry,
                totalSavings: runningTotal
            };
        });

        // 3. Return Descending (Newest First) for Display
        return calculated.reverse();
    }, [entries, initialBalance]);

    const addEntry = (entry) => {
        setEntries(prev => [...prev, { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() }]);
    };

    const updateEntry = (id, updatedEntry) => {
        setEntries(prev => prev.map(item => item.id === id ? { ...item, ...updatedEntry } : item));
    };

    const deleteEntry = (id) => {
        setEntries(prev => prev.filter(item => item.id !== id));
    };

    const updateInitialBalance = (amount) => {
        setInitialBalance(Number(amount));
    };

    // Distribution Handlers
    const addDistribution = (item) => {
        setDistributions(prev => [...prev, { ...item, id: crypto.randomUUID() }]);
    };

    const updateDistribution = (id, updatedItem) => {
        setDistributions(prev => prev.map(item => item.id === id ? { ...item, ...updatedItem } : item));
    };

    const deleteDistribution = (id) => {
        setDistributions(prev => prev.filter(item => item.id !== id));
    };

    return (
        <DataContext.Provider value={{
            entries: processedEntries,
            initialBalance,
            distributions,
            addEntry,
            updateEntry,
            deleteEntry,
            updateInitialBalance,
            addDistribution,
            updateDistribution,
            deleteDistribution
        }}>
            {children}
        </DataContext.Provider>
    );
};
