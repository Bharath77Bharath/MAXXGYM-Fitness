import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import TrainerSidebar from '../components/layout/TrainerSidebar';
import TopBar from '../components/layout/TopBar';
import ClientCard from '../components/trainer/ClientCard';
import { CheckCircle, Clock, Bell, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';

const TrainerDashboard = () => {
  const { currentUser, userData, refreshUser } = useAuth();
  const location = useLocation();
  const [clients, setClients] = useState([]);
  const [signOffRequests, setSignOffRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('clients'); // 'clients', 'signoffs', or 'settings'
  const [searchTerm, setSearchTerm] = useState('');

  // Profile/Settings state
  const [editName, setEditName] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  const [editTrainerCode, setEditTrainerCode] = useState('');
  const [saving, setSaving] = useState(false);

  // Sync tab with URL hash
  useEffect(() => {
    if (location.hash === '#settings') {
      setActiveTab('settings');
    } else if (location.hash === '#signoffs') {
      setActiveTab('signoffs');
    } else {
      setActiveTab('clients');
    }
  }, [location.hash]);

  useEffect(() => {
    if (userData) {
      setEditName(userData.displayName || '');
      setEditPhoto(userData.photoURL || '');
      setEditTrainerCode(userData.trainerId || '');
    }
  }, [userData]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      try {
        // Fetch clients
        const clientsQuery = query(
          collection(db, 'users'), 
          where('trainerId', '==', currentUser.uid)
        );
        const clientsSnap = await getDocs(clientsQuery);
        const clientsList = clientsSnap.docs
          .filter(d => d.data().role === 'client')
          .map(d => ({ id: d.id, ...d.data() }));
        setClients(clientsList);

        // Fetch sign-off requests for this trainer
        // Note: Removed orderBy to avoid requiring a composite index in Firestore
        const requestsQuery = query(
          collection(db, 'signOffRequests'),
          where('trainerId', '==', currentUser.uid)
        );
        const requestsSnap = await getDocs(requestsQuery);
        const requestsList = requestsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Sort in memory by createdAt desc
        requestsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setSignOffRequests(requestsList);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const handleApproveSignOff = async (requestId) => {
    try {
      await updateDoc(doc(db, 'signOffRequests', requestId), {
        status: 'approved',
        approvedAt: new Date().toISOString()
      });

      // Update local state
      setSignOffRequests(prev => prev.map(r => 
        r.id === requestId ? { ...r, status: 'approved', approvedAt: new Date().toISOString() } : r
      ));

      toast.success('Workout day signed off! ✓');
    } catch (error) {
      console.error("Error approving sign-off:", error);
      toast.error('Failed to approve');
    }
  };

  const pendingRequests = signOffRequests.filter(r => r.status === 'pending');
  const approvedRequests = signOffRequests.filter(r => r.status === 'approved');

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex flex-col lg:flex-row">
      <TrainerSidebar />
      <TopBar />
      
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <header className="mb-10">
            <h1 className="text-3xl md:text-5xl font-display text-[#F5F5F5] mb-2">My Clients</h1>
            <p className="text-[#888888]">Manage your clients and their workout plans.</p>
            <div className="mt-6 p-4 bg-[#1E1E1E] border border-[#2A2A2A] rounded-2xl inline-flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0 w-full sm:w-auto">
              <span className="text-[#888888] text-xs uppercase font-bold tracking-widest mr-2">Your Trainer Code:</span>
              <span className="text-[#FFD000] font-bold select-all text-lg">{userData?.trainerId || currentUser?.uid}</span>
            </div>
          </header>

          {/* Tabs */}
          <div className="flex gap-1 mb-8 bg-[#141414] p-1 rounded-lg border border-[#2A2A2A] w-fit">
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-6 py-2.5 rounded-md font-bold uppercase text-sm tracking-wider transition-colors ${
                activeTab === 'clients' 
                  ? 'bg-[#FFD000] text-[#0B0B0B]' 
                  : 'text-[#888888] hover:text-[#F5F5F5]'
              }`}
            >
              Clients
            </button>
            <button
              onClick={() => setActiveTab('signoffs')}
              className={`px-6 py-2.5 rounded-md font-bold uppercase text-sm tracking-wider transition-colors flex items-center gap-2 ${
                activeTab === 'signoffs' 
                  ? 'bg-[#FFD000] text-[#0B0B0B]' 
                  : 'text-[#888888] hover:text-[#F5F5F5]'
              }`}
            >
              <Bell size={16} />
              Sign-offs
              {pendingRequests.length > 0 && (
                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${
                  activeTab === 'signoffs' 
                    ? 'bg-[#0B0B0B] text-[#FFD000]' 
                    : 'bg-[#FFD000] text-[#0B0B0B]'
                }`}>
                  {pendingRequests.length}
                </span>
              )}
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-[#FFD000] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : activeTab === 'clients' ? (
            /* === CLIENTS TAB === */
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="relative group max-w-xl">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-[#555555] group-focus-within:text-[#FFD000] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input 
                  type="text"
                  placeholder="Search clients by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2A2A2A] rounded-2xl py-4 pl-12 pr-4 text-[#F5F5F5] focus:border-[#FFD000] focus:ring-1 focus:ring-[#FFD000]/20 outline-none transition-all placeholder:text-[#555555] shadow-inner"
                />
              </div>

              {clients.filter(c => c.displayName?.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                <div className="bg-[#141414] border border-[#2A2A2A] border-dashed rounded-2xl p-16 text-center">
                  <h3 className="text-xl font-bold text-[#F5F5F5] mb-2">No matches found</h3>
                  <p className="text-[#888888]">Try a different name or share your trainer code.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {clients
                    .filter(c => c.displayName?.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(client => {
                      const clientRequests = signOffRequests.filter(r => r.clientId === client.id);
                      const clientPendingCount = clientRequests.filter(r => r.status === 'pending').length;
                      return (
                        <ClientCard 
                          key={client.id} 
                          client={client} 
                          pendingCount={clientPendingCount}
                          history={clientRequests}
                          onViewSignOffs={() => setActiveTab('signoffs')} 
                        />
                      );
                    })}
                </div>
              )}
            </div>
          ) : activeTab === 'signoffs' ? (
            /* === SIGN-OFFS TAB === */
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Pending Requests */}
              <div>
                <h2 className="text-xl font-bold text-[#F5F5F5] mb-4 flex items-center gap-2">
                  <Clock className="text-[#FFD000]" size={20} />
                  Pending Requests
                  {pendingRequests.length > 0 && (
                    <span className="text-sm px-2 py-0.5 bg-[#FFD000] text-[#0B0B0B] rounded-full">{pendingRequests.length}</span>
                  )}
                </h2>
                {pendingRequests.length === 0 ? (
                  <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-6 text-center text-[#888888]">
                    No pending sign-off requests.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingRequests.map(req => (
                      <div key={req.id} className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-[#FFD000]/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-[#FFD000]/20 flex items-center justify-center text-[#FFD000] font-bold text-lg border border-[#FFD000]/30">
                            {req.clientName ? req.clientName[0].toUpperCase() : 'C'}
                          </div>
                          <div>
                            <h4 className="text-[#F5F5F5] font-bold text-lg">{req.clientName}</h4>
                            <div className="flex items-center gap-3 text-sm text-[#888888]">
                              <span className="text-[#FFD000] font-bold uppercase">{req.muscleGroup}</span>
                              <span>•</span>
                              <span>{req.date}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleApproveSignOff(req.id)}
                          className="bg-[#FFD000] text-[#0B0B0B] px-5 py-2.5 rounded-lg font-bold uppercase tracking-wider text-sm hover:bg-[#C9A200] transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
                        >
                          <CheckCircle size={18} />
                          Sign Off
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Approved History */}
              <div>
                <h2 className="text-xl font-bold text-[#F5F5F5] mb-4 flex items-center gap-2">
                  <CalendarDays className="text-green-400" size={20} />
                  Approved History
                </h2>
                {approvedRequests.length === 0 ? (
                  <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-6 text-center text-[#888888]">
                    No approved sign-offs yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {approvedRequests.map(req => (
                      <div key={req.id} className="bg-[#1E1E1E] rounded-lg border border-[#2A2A2A] p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="text-green-400" size={18} />
                          <div>
                            <span className="text-[#F5F5F5] font-bold">{req.clientName}</span>
                            <span className="text-[#888888] mx-2">—</span>
                            <span className="text-[#FFD000] font-bold uppercase text-sm">{req.muscleGroup}</span>
                          </div>
                        </div>
                        <span className="text-sm text-[#888888]">{req.date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* === SETTINGS TAB === */
            <div className="max-w-2xl bg-[#141414] border border-[#2A2A2A] rounded-3xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
               <h2 className="text-2xl font-display text-[#F5F5F5] mb-6">Trainer Settings</h2>
               
               <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-[#888888] uppercase tracking-widest mb-2">Display Name</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-4 text-[#F5F5F5] focus:border-[#FFD000] outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#888888] uppercase tracking-widest mb-2">Trainer Code (Name-based)</label>
                    <input 
                      type="text" 
                      value={editTrainerCode}
                      onChange={(e) => setEditTrainerCode(e.target.value)}
                      className="w-full bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-4 text-[#F5F5F5] focus:border-[#FFD000] outline-none transition-colors"
                    />
                    <p className="text-[10px] text-[#555555] mt-1 uppercase tracking-widest">This is what clients use to join your roster.</p>
                  </div>

                  <button 
                    onClick={async () => {
                      setSaving(true);
                      try {
                        const cleanCode = editTrainerCode.toLowerCase().replace(/\s+/g, '');
                        
                        // Check if code is already taken by someone else
                        if (cleanCode !== userData.trainerId) {
                           const q = query(collection(db, 'users'), where('trainerId', '==', cleanCode));
                           const snap = await getDocs(q);
                           if (!snap.empty) {
                             toast.error('This trainer code is already taken.');
                             setSaving(false);
                             return;
                           }
                        }

                        await updateDoc(doc(db, 'users', currentUser.uid), {
                          displayName: editName,
                          trainerId: cleanCode
                        });
                        await refreshUser();
                        toast.success('Settings updated successfully!');
                        setActiveTab('clients');
                      } catch (err) {
                        toast.error(`Update failed: ${err.message}`);
                        console.error(err);
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                    className="w-full bg-[#FFD000] text-[#0B0B0B] py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-[#C9A200] transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TrainerDashboard;
