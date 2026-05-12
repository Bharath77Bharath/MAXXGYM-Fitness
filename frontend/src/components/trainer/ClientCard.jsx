import { useNavigate } from 'react-router-dom';
import { User, ChevronRight, Bell, History } from 'lucide-react';

const ClientCard = ({ client, pendingCount, onViewSignOffs }) => {
  const navigate = useNavigate();
  
  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
  };

  return (
    <div className={`bg-[#1E1E1E] rounded-xl border p-5 flex flex-col h-full transition-all group ${
      pendingCount > 0 ? 'border-[#FFD000]' : 'border-[#2A2A2A] hover:border-[#FFD000]/50'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#2A2A2A] flex items-center justify-center text-[#FFD000] font-bold text-xl border border-[#FFD000]/30">
            {getInitials(client.displayName)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#F5F5F5] group-hover:text-[#FFD000] transition-colors">{client.displayName || 'Unnamed Client'}</h3>
            <p className="text-sm text-[#888888]">{client.email}</p>
            {(client.height || client.weight) && (
              <div className="flex gap-3 mt-1">
                {client.height && <span className="text-[10px] text-[#FFD000] font-bold uppercase tracking-tighter">{client.height} cm</span>}
                {client.weight && <span className="text-[10px] text-[#FFD000] font-bold uppercase tracking-tighter">{client.weight} kg</span>}
              </div>
            )}
          </div>
        </div>
        
        {pendingCount > 0 && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onViewSignOffs();
            }}
            className="bg-[#FFD000] text-[#0B0B0B] p-2 rounded-lg animate-pulse shadow-[0_0_15px_rgba(255,208,0,0.4)]"
          >
            <Bell size={18} />
          </button>
        )}
      </div>

      {pendingCount > 0 && (
        <div className="mb-4 p-2 bg-[#FFD000]/10 border border-[#FFD000]/30 rounded-lg text-xs font-bold text-[#FFD000] uppercase tracking-wider text-center">
          {pendingCount} Pending Sign-off{pendingCount > 1 ? 's' : ''}
        </div>
      )}
      
      <div className="space-y-2 mt-auto">
        <button 
          onClick={() => navigate(`/trainer/history/${client.id}`)}
          className="w-full flex items-center justify-center gap-2 p-3 bg-[#141414] border border-[#2A2A2A] rounded-xl text-[#F5F5F5] hover:border-[#FFD000] hover:text-[#FFD000] transition-all font-bold text-sm uppercase tracking-wide group/btn"
        >
          <History size={18} className="group-hover/btn:rotate-[-45deg] transition-transform" />
          Workout History
        </button>

        <div className="pt-2 flex items-center justify-between border-t border-[#2A2A2A]">
          <span className="text-xs px-2 py-1 bg-[#2A2A2A] text-[#888888] rounded-full uppercase tracking-wider font-bold">
            Active Client
          </span>
          <button 
            onClick={() => navigate(`/trainer/assign/${client.id}`)}
            className="flex items-center gap-1 text-[#FFD000] hover:text-[#C9A200] font-bold text-sm uppercase tracking-wide transition-colors"
          >
            Assign Plan <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientCard;
