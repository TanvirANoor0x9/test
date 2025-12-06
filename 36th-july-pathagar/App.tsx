import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Home as HomeIcon, Bell, CreditCard, Settings, Menu, X } from 'lucide-react';
import Home from './pages/Home';
import Payment from './pages/Payment';
import Notices from './pages/Notices';
import Admin from './pages/Admin';

const Navigation = ({ currentPage, setPage }: { currentPage: string, setPage: (p: string) => void }) => {
  const { settings, isAdmin } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'notices', label: 'Notices', icon: Bell },
    { id: 'payment', label: 'Donate/Pay', icon: CreditCard },
    { id: 'admin', label: 'Admin', icon: Settings },
  ];

  return (
    <nav className="bg-white sticky top-0 z-50 shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setPage('home')}>
             {settings.logoUrl && <img src={settings.logoUrl} className="h-8 w-8 rounded-full object-cover" alt="Logo" />}
             <span className="font-bold text-xl text-gray-900 truncate max-w-[200px]">{settings.orgName}</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === item.id 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon size={18} />
                {item.label}
                {item.id === 'admin' && isAdmin && (
                    <span className="w-2 h-2 rounded-full bg-green-500 ml-1"></span>
                )}
              </button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setPage(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-base font-medium ${
                  currentPage === item.id 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

const MainLayout = () => {
  const [page, setPage] = useState('home');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navigation currentPage={page} setPage={setPage} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {page === 'home' && <Home />}
        {page === 'notices' && <Notices />}
        {page === 'payment' && <Payment />}
        {page === 'admin' && <Admin />}
      </main>
    </div>
  );
};

const App = () => {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default App;
