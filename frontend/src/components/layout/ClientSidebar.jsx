import { Link, useLocation } from 'react-router-dom';
import { Dumbbell, ClipboardList, History, LogOut, User } from 'lucide-react';
import { auth } from '../../firebase';

const ClientSidebar = () => {
  const location = useLocation();

  const handleLogout = () => {
    auth.signOut();
  };

  const navItems = [
    { name: 'My Workout', path: '/client/dashboard', icon: ClipboardList },
    { name: 'Sign-off Log', path: '/client/log', icon: History },
    { name: 'My Profile', path: '/client/dashboard', hash: '#profile', icon: User },
  ];

  return (
    <div className="hidden lg:flex w-64 flex-col bg-[#141414] border-r border-[#2A2A2A] h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3 border-b border-[#2A2A2A]">
        <Dumbbell className="text-[#FFD000]" size={32} />
        <span className="text-3xl font-display tracking-wide">MaxxGym</span>
      </div>

      <div className="flex-1 py-6 flex flex-col gap-2 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path && !item.hash;
          return (
            <Link
              key={item.name}
              to={item.hash ? `${item.path}${item.hash}` : item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                (item.hash ? location.hash === item.hash : (location.pathname === item.path && !location.hash))
                  ? 'bg-[#FFD000] text-[#0B0B0B] font-bold' 
                  : 'text-[#888888] hover:bg-[#1E1E1E] hover:text-[#F5F5F5]'
              }`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-[#2A2A2A]">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-[#888888] hover:bg-[#1E1E1E] hover:text-[#F5F5F5] rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default ClientSidebar;
