import { supabase } from '../services/supabaseClient';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Activity, Notice, PaymentMethod, Transaction, Admin, AppSettings, ThemeColor } from '../types';

// …rest of the file…


// Import the Supabase client.  This client is configured using environment
// variables (see services/supabaseClient.ts).  Real‑time synchronization
// between clients is driven by the subscriptions defined below.
import { supabase } from '../services/supabaseClient';

interface AppContextType {
  isAdmin: boolean;
  login: (code: string) => boolean;
  logout: () => void;
  
  activities: Activity[];
  addActivity: (activity: Activity) => void;
  deleteActivity: (id: string) => void;

  notices: Notice[];
  addNotice: (notice: Notice) => void;
  deleteNotice: (id: string) => void;

  paymentMethods: PaymentMethod[];
  updatePaymentMethods: (methods: PaymentMethod[]) => void;

  transactions: Transaction[];
  submitTransaction: (trx: Transaction) => void;
  updateTransactionStatus: (id: string, status: Transaction['status']) => void;

  admins: Admin[];
  addAdmin: (admin: Admin) => void;

  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

const defaultSettings: AppSettings = {
  orgName: "36th July Pathagar",
  logoUrl: "https://cdn-icons-png.flaticon.com/512/3062/3062634.png", // Generic placeholder
  primaryColor: 'red',
  welcomeMessage: "Welcome to our digital community platform."
};

const defaultPaymentMethods: PaymentMethod[] = [
  { id: '1', name: 'Bkash', number: '01700000000', instructions: 'Send Money (Personal)' },
  { id: '2', name: 'Nagad', number: '01800000000', instructions: 'Cash In or Send Money' },
  { id: '3', name: 'Rocket', number: '01600000000', instructions: 'Send Money (Personal)' }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children?: ReactNode }> = ({ children }) => {
  // Load from local storage or defaults
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  /**
   * Activities and notices are initialized as empty arrays.  They will be
   * populated from Supabase on mount and kept in sync via real‑time
   * subscriptions.  We deliberately do not read from localStorage here so
   * that multiple devices see the same data instead of each persisting its
   * own copy.
   */
  const [activities, setActivities] = useState<Activity[]>([]);

  const [notices, setNotices] = useState<Notice[]>([]);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() => {
    const saved = localStorage.getItem('paymentMethods');
    return saved ? JSON.parse(saved) : defaultPaymentMethods;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [admins, setAdmins] = useState<Admin[]>(() => {
    const saved = localStorage.getItem('admins');
    return saved ? JSON.parse(saved) : [{ id: '1', name: 'Main Admin', accessCode: 'admin123' }];
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  // Effects to persist data
  useEffect(() => localStorage.setItem('activities', JSON.stringify(activities)), [activities]);
  useEffect(() => localStorage.setItem('notices', JSON.stringify(notices)), [notices]);
  useEffect(() => localStorage.setItem('paymentMethods', JSON.stringify(paymentMethods)), [paymentMethods]);
  useEffect(() => localStorage.setItem('transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('admins', JSON.stringify(admins)), [admins]);
  useEffect(() => localStorage.setItem('settings', JSON.stringify(settings)), [settings]);

  // Apply Theme Color to CSS Variables
  useEffect(() => {
    const root = document.documentElement;
    const colors: Record<string, string> = {
      red: '#ef4444',
      blue: '#3b82f6',
      green: '#10b981',
      purple: '#8b5cf6',
      orange: '#f97316',
      black: '#1f2937'
    };
    root.style.setProperty('--color-primary', colors[settings.primaryColor] || colors.red);
  }, [settings.primaryColor]);

  /**
   * On initial mount, load activities and notices from Supabase and set up
   * real‑time listeners.  The listeners update local state whenever an
   * insert or delete happens in the corresponding table.  This ensures
   * that users on different devices see the same content without needing
   * to refresh the page.
   */
  useEffect(() => {
    // Fetch current activities from Supabase
    const init = async () => {
      try {
        const { data: actData, error: actError } = await supabase
          .from('activities')
          .select('*')
          .order('date', { ascending: false });
        if (!actError && actData) setActivities(actData as Activity[]);

        const { data: noticeData, error: noticeError } = await supabase
          .from('notices')
          .select('*')
          .order('date', { ascending: false });
        if (!noticeError && noticeData) setNotices(noticeData as Notice[]);
      } catch (err) {
        console.error('Error fetching data from Supabase:', err);
      }
    };
    init();

    // Subscribe to activity inserts and deletes
    const activitiesChannel = supabase
      .channel('public:activities')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities' }, payload => {
        const newActivity = payload.new as Activity;
        setActivities(prev => {
          // Avoid duplicates if this client inserted the row
          if (prev.find(a => a.id === newActivity.id)) return prev;
          return [newActivity, ...prev];
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'activities' }, payload => {
        const oldActivity = payload.old as Activity;
        setActivities(prev => prev.filter(a => a.id !== oldActivity.id));
      })
      .subscribe();

    // Subscribe to notice inserts and deletes
    const noticesChannel = supabase
      .channel('public:notices')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notices' }, payload => {
        const newNotice = payload.new as Notice;
        setNotices(prev => {
          if (prev.find(n => n.id === newNotice.id)) return prev;
          return [newNotice, ...prev];
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'notices' }, payload => {
        const oldNotice = payload.old as Notice;
        setNotices(prev => prev.filter(n => n.id !== oldNotice.id));
      })
      .subscribe();

    // Clean up on unmount
    return () => {
      supabase.removeChannel(activitiesChannel);
      supabase.removeChannel(noticesChannel);
    };
  }, []);

  const login = (code: string) => {
    const isValid = admins.some(a => a.accessCode === code);
    if (isValid) setIsAdmin(true);
    return isValid;
  };

  const logout = () => setIsAdmin(false);

  /**
   * Persist a new activity to Supabase and update local state.  We optimistically
   * update the local state before awaiting the remote insert so that the
   * UI responds instantly.  A real‑time subscription defined below will
   * ensure that other clients receive the new row.
   */
  const addActivity = async (activity: Activity) => {
    // update local state immediately using functional update to avoid stale state
    setActivities(prev => [activity, ...prev]);
    try {
      await supabase.from('activities').insert([activity]);
    } catch (err) {
      console.error('Error inserting activity:', err);
    }
  };

  /**
   * Delete an activity both locally and remotely.  The remote deletion
   * triggers the subscription for other clients.
   */
  const deleteActivity = async (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
    try {
      await supabase.from('activities').delete().eq('id', id);
    } catch (err) {
      console.error('Error deleting activity:', err);
    }
  };

  /**
   * Persist a new notice to Supabase and update local state.
   */
  const addNotice = async (notice: Notice) => {
    setNotices(prev => [notice, ...prev]);
    try {
      await supabase.from('notices').insert([notice]);
    } catch (err) {
      console.error('Error inserting notice:', err);
    }
  };

  /**
   * Delete a notice both locally and remotely.
   */
  const deleteNotice = async (id: string) => {
    setNotices(prev => prev.filter(n => n.id !== id));
    try {
      await supabase.from('notices').delete().eq('id', id);
    } catch (err) {
      console.error('Error deleting notice:', err);
    }
  };

  const updatePaymentMethods = (methods: PaymentMethod[]) => setPaymentMethods(methods);

  const submitTransaction = (trx: Transaction) => setTransactions([trx, ...transactions]);
  const updateTransactionStatus = (id: string, status: Transaction['status']) => {
    setTransactions(transactions.map(t => t.id === id ? { ...t, status } : t));
  };

  const addAdmin = (admin: Admin) => setAdmins([...admins, admin]);

  const updateSettings = (newSettings: Partial<AppSettings>) => setSettings({ ...settings, ...newSettings });

  return (
    <AppContext.Provider value={{
      isAdmin, login, logout,
      activities, addActivity, deleteActivity,
      notices, addNotice, deleteNotice,
      paymentMethods, updatePaymentMethods,
      transactions, submitTransaction, updateTransactionStatus,
      admins, addAdmin,
      settings, updateSettings
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
