import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import {
    collection,
    query,
    onSnapshot,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    writeBatch,
    getDocs,
    where,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const { user } = useAuth(); // Now provides { uid, email, username } logic
    const [entries, setEntries] = useState([]);
    const [initialBalance, setInitialBalance] = useState(0);
    const [distributions, setDistributions] = useState([]);
    const [ccExpenses, setCcExpenses] = useState([]);
    const [dailyExpenses, setDailyExpenses] = useState([]);
    const [categoriesList, setCategoriesList] = useState([]);

    // Real-time Data Sync
    useEffect(() => {
        if (!user) {
            setEntries([]);
            setInitialBalance(0);
            setDistributions([]);
            setCcExpenses([]);
            setDailyExpenses([]);
            return;
        }

        // 1. Listen to Initial Balance (stored on user doc)
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setInitialBalance(data.initialBalance || 0);

                if (data.categories) {
                    setCategoriesList(data.categories);
                } else {
                    // Initialize empty list for new users
                    // We explicitly set it to empty array so we know they are initialized
                    setDoc(userDocRef, { categories: [] }, { merge: true });
                    setCategoriesList([]);
                }
            }
        });

        // 2. Listen to Entries Subcollection
        const entriesQuery = query(collection(db, 'users', user.uid, 'entries'));
        const unsubscribeEntries = onSnapshot(entriesQuery, (snapshot) => {
            const fetchedEntries = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setEntries(fetchedEntries);
        });

        // 3. Listen to Distributions Subcollection
        const distQuery = query(collection(db, 'users', user.uid, 'distributions'));
        const unsubscribeDist = onSnapshot(distQuery, (snapshot) => {
            const fetchedDist = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setDistributions(fetchedDist);
        });

        // 4. Listen to Credit Card Expenses Subcollection
        const ccQuery = query(collection(db, 'users', user.uid, 'cc_expenses'));
        const unsubscribeCC = onSnapshot(ccQuery, (snapshot) => {
            const fetchedCC = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCcExpenses(fetchedCC);
        });

        // 5. Listen to Daily Expenses Subcollection
        const dailyQuery = query(collection(db, 'users', user.uid, 'daily_expenses'));
        const unsubscribeDaily = onSnapshot(dailyQuery, (snapshot) => {
            const fetchedDaily = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setDailyExpenses(fetchedDaily);
        });

        return () => {
            unsubscribeUser();
            unsubscribeEntries();
            unsubscribeDist();
            unsubscribeCC();
            unsubscribeDaily();
        };
    }, [user]);


    // Calculate moving totals dynamically
    const processedEntries = useMemo(() => {
        let runningTotal = Number(initialBalance);

        // Helper to parse "Jan 2025" to a comparable value
        const getMonthValue = (monthStr) => {
            if (!monthStr) return 0;
            const [m, y] = monthStr.split(' ');
            const monthIndex = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ].indexOf(m);
            // Fallback for legacy short names if needed, though fresh start won't need it.
            // If index is -1, try short names for backward compatibility
            if (monthIndex === -1) {
                return (Number(y) * 12) + [
                    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                ].indexOf(m);
            }
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


    // Firestore Actions
    const addEntry = async (entry) => {
        if (!user) return;
        const newDocRef = doc(collection(db, 'users', user.uid, 'entries'));
        await setDoc(newDocRef, {
            ...entry,
            id: newDocRef.id, // redundancy but helpful
            createdAt: new Date().toISOString()
        });
    };

    const updateEntry = async (id, updatedEntry) => {
        if (!user) return;
        const entryRef = doc(db, 'users', user.uid, 'entries', id);
        await updateDoc(entryRef, updatedEntry);
    };

    const deleteEntry = async (id) => {
        if (!user) return;
        const entryRef = doc(db, 'users', user.uid, 'entries', id);
        await deleteDoc(entryRef);
    };

    const updateInitialBalance = async (amount) => {
        if (!user) return;
        const userDocRef = doc(db, 'users', user.uid);
        // Set with merge to create if not exists or just update field
        await setDoc(userDocRef, { initialBalance: Number(amount) }, { merge: true });
    };

    // Distribution Handlers
    const addDistribution = async (item) => {
        if (!user) return;
        const newDocRef = doc(collection(db, 'users', user.uid, 'distributions'));
        await setDoc(newDocRef, {
            ...item,
            id: newDocRef.id
        });
    };

    const updateDistribution = async (id, updatedItem) => {
        if (!user) return;
        const distRef = doc(db, 'users', user.uid, 'distributions', id);
        await updateDoc(distRef, updatedItem);
    };

    const deleteDistribution = async (id) => {
        if (!user) return;
        const distRef = doc(db, 'users', user.uid, 'distributions', id);
        await deleteDoc(distRef);
    };

    // Credit Card Handlers
    const addCCExpense = async (item) => {
        if (!user) return;
        const newDocRef = doc(collection(db, 'users', user.uid, 'cc_expenses'));
        await setDoc(newDocRef, {
            ...item,
            id: newDocRef.id,
            createdAt: new Date().toISOString()
        });
    };

    const updateCCExpense = async (id, updatedItem) => {
        if (!user) return;
        const ccRef = doc(db, 'users', user.uid, 'cc_expenses', id);
        await updateDoc(ccRef, updatedItem);
    };

    const deleteCCExpense = async (id) => {
        if (!user) return;
        const ccRef = doc(db, 'users', user.uid, 'cc_expenses', id);
        await deleteDoc(ccRef);
    };

    const renameCardGroup = async (oldName, newName, month) => {
        if (!user) return;

        // 1. Get all expenses for this card/month
        const q = query(
            collection(db, 'users', user.uid, 'cc_expenses'),
            where('cardName', '==', oldName),
            where('month', '==', month)
        );

        const snapshot = await getDocs(q); // Need getDocs import? No, I need it.
        // Wait, I missed importing getDocs.

        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { cardName: newName });
        });

        await batch.commit();
    };

    const deleteCardGroup = async (cardName, month) => {
        if (!user) return;
        const q = query(
            collection(db, 'users', user.uid, 'cc_expenses'),
            where('cardName', '==', cardName),
            where('month', '==', month)
        );
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    };

    const markCardGroupPaid = async (cardName, month, isPaid) => {
        if (!user) return;
        const q = query(
            collection(db, 'users', user.uid, 'cc_expenses'),
            where('cardName', '==', cardName),
            where('month', '==', month)
        );
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => batch.update(doc.ref, { isChecked: isPaid }));
        await batch.commit();
    };

    // Daily Expenses Handlers
    const addDailyExpense = async (item) => {
        if (!user) return;
        const newDocRef = doc(collection(db, 'users', user.uid, 'daily_expenses'));
        await setDoc(newDocRef, {
            ...item,
            id: newDocRef.id,
            createdAt: new Date().toISOString()
        });
    };

    const updateDailyExpense = async (id, updatedItem) => {
        if (!user) return;
        const ref = doc(db, 'users', user.uid, 'daily_expenses', id);
        await updateDoc(ref, updatedItem);
    };

    const deleteDailyExpense = async (id) => {
        if (!user) return;
        const ref = doc(db, 'users', user.uid, 'daily_expenses', id);
        await deleteDoc(ref);
    };

    const renameCategory = async (oldName, newName) => {
        if (!user) return;

        // Find all expenses with the old category name
        const q = query(
            collection(db, 'users', user.uid, 'daily_expenses'),
            where('category', '==', oldName)
        );

        const snapshot = await getDocs(q);
        const batch = writeBatch(db);

        // Update all matching expenses
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { category: newName });
        });

        // Also update categoriesList if the old name was in there
        if (categoriesList.includes(oldName)) {
            const userRef = doc(db, 'users', user.uid);

            // Avoid arrayRemove/arrayUnion conflict in same batch by calculating new list
            const newCategories = categoriesList.map(c => c === oldName ? newName : c);

            // Ensure uniqueness just in case
            const uniqueCategories = [...new Set(newCategories)];

            batch.update(userRef, {
                categories: uniqueCategories
            });
        }

        await batch.commit();
    };

    const addCategory = async (categoryName) => {
        if (!user || !categoryName) return;
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            categories: arrayUnion(categoryName)
        });
    };

    const deleteCategory = async (categoryName) => {
        if (!user || !categoryName) return;
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            categories: arrayRemove(categoryName)
        });
    };

    // Helper to evaluate math expressions
    const evaluateMathExpression = (expression) => {
        try {
            const sanitized = String(expression).replace(/[^0-9+\-*/. ]/g, '');
            if (!sanitized) return 0;
            // eslint-disable-next-line no-new-func
            const result = new Function('return ' + sanitized)();
            if (isNaN(result) || !isFinite(result)) return 0;
            return result;
        } catch (err) {
            return 0;
        }
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
            deleteDistribution,
            ccExpenses,
            addCCExpense,
            updateCCExpense,
            deleteCCExpense,

            renameCardGroup,
            deleteCardGroup,
            markCardGroupPaid,
            evaluateMathExpression,
            dailyExpenses,
            addDailyExpense,
            updateDailyExpense,
            deleteDailyExpense,
            renameCategory,
            categoriesList,
            addCategory,
            deleteCategory
        }}>
            {children}
        </DataContext.Provider>
    );
};
