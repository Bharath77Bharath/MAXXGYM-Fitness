import { Menu, Dumbbell, LogOut } from 'lucide-react';
import { auth } from '../../firebase';

const TopBar = ({ onMenuClick }) => {
  return (
    <div className="lg:hidden flex items-center justify-between p-4 bg-[#141414] border-b border-[#2A2A2A] sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <Dumbbell className="text-[#FFD000]" size={28} />
        <span className="text-2xl font-display tracking-wide">MaxxGym</span>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={() => auth.signOut()} className="text-[#888888] hover:text-[#F5F5F5]">
          <LogOut size={24} />
        </button>
      </div>
    </div>
  );
};

export default TopBar;
