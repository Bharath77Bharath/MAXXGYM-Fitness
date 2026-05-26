import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import TrainerSidebar from '../components/layout/TrainerSidebar';
import TopBar from '../components/layout/TopBar';
import { 
  History, 
  ArrowLeft, 
  Calendar, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Award,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

const ClientHistory = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [client, setClient] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    mostFrequent: 'None'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch client details
        const clientDoc = await getDoc(doc(db, 'users', clientId));
        if (clientDoc.exists()) {
          setClient(clientDoc.data());
        }

        // Fetch history - added trainerId filter to satisfy security rules
        const historyQuery = query(
          collection(db, 'signOffRequests'),
          where('clientId', '==', clientId),
          where('trainerId', '==', currentUser.uid)
        );
        const historySnap = await getDocs(historyQuery);
        const historyList = historySnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Sort by date desc
        historyList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setHistory(historyList);

        // Calculate stats
        const approved = historyList.filter(h => h.status === 'approved').length;
        const pending = historyList.filter(h => h.status === 'pending').length;
        
        // Find most trained muscle
        const counts = {};
        historyList.forEach(h => {
          if (h.status === 'approved') {
            counts[h.muscleGroup] = (counts[h.muscleGroup] || 0) + 1;
          }
        });
        const mostFrequent = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

        setStats({
          total: historyList.length,
          approved,
          pending,
          mostFrequent
        });

      } catch (error) {
        console.error("Error fetching history:", error);
        toast.error("Failed to load history");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clientId]);

  const handleApprove = async (requestId) => {
    try {
      await updateDoc(doc(db, 'signOffRequests', requestId), {
        status: 'approved',
        approvedAt: new Date().toISOString()
      });

      setHistory(prev => prev.map(h => 
        h.id === requestId ? { ...h, status: 'approved' } : h
      ));
      
      setStats(prev => ({
        ...prev,
        approved: prev.approved + 1,
        pending: prev.pending - 1
      }));

      toast.success("Workout signed off!");
    } catch (error) {
      console.error("Error approving:", error);
      toast.error("Failed to approve");
    }
  };

  const getDayOfWeek = (dateString) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = new Date(dateString);
    return days[d.getDay()];
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex flex-col lg:flex-row">
      <TrainerSidebar />
      <TopBar />
      
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <button 
            onClick={() => navigate('/trainer/dashboard')}
            className="flex items-center gap-2 text-[#888888] hover:text-[#FFD000] mb-6 transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <History className="text-[#FFD000]" size={32} />
                <h1 className="text-4xl font-display text-[#F5F5F5]">Workout History</h1>
              </div>
              <p className="text-[#888888]">
                Viewing individual record for <span className="text-[#F5F5F5] font-bold">{client?.displayName}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-[#141414] border border-[#2A2A2A] rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-[#FFD000]/10 flex items-center justify-center text-[#FFD000] font-bold text-xl border border-[#FFD000]/20 overflow-hidden">
                {client?.photoURL ? (
                  <img src={client.photoURL} alt="Client" className="w-full h-full object-cover" />
                ) : (
                  client?.displayName?.[0].toUpperCase()
                )}
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-[#888888] uppercase font-bold tracking-widest">Client</p>
                  <p className="text-[#F5F5F5] font-bold">{client?.displayName}</p>
                </div>
                {(client?.height || client?.weight) && (
                  <div className="flex gap-4 border-l border-[#2A2A2A] pl-6">
                    {client?.height && (
                      <div>
                        <p className="text-[10px] text-[#555555] uppercase font-bold tracking-tighter">Height</p>
                        <p className="text-sm text-[#F5F5F5] font-bold">{client.height} cm</p>
                      </div>
                    )}
                    {client?.weight && (
                      <div>
                        <p className="text-[10px] text-[#555555] uppercase font-bold tracking-tighter">Weight</p>
                        <p className="text-sm text-[#F5F5F5] font-bold">{client.weight} kg</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <div className="bg-[#141414] border border-[#2A2A2A] p-6 rounded-2xl">
              <div className="flex items-center gap-3 text-[#888888] mb-2">
                <Calendar size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Total Sessions</span>
              </div>
              <p className="text-3xl font-display text-[#F5F5F5]">{stats.total}</p>
            </div>
            
            <div className="bg-[#141414] border border-[#2A2A2A] p-6 rounded-2xl">
              <div className="flex items-center gap-3 text-green-500 mb-2">
                <CheckCircle size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Signed Off</span>
              </div>
              <p className="text-3xl font-display text-[#F5F5F5]">{stats.approved}</p>
            </div>

            <div className="bg-[#141414] border border-[#2A2A2A] p-6 rounded-2xl">
              <div className="flex items-center gap-3 text-[#FFD000] mb-2">
                <Clock size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Pending</span>
              </div>
              <p className="text-3xl font-display text-[#F5F5F5]">{stats.pending}</p>
            </div>

            <div className="bg-[#141414] border border-[#2A2A2A] p-6 rounded-2xl">
              <div className="flex items-center gap-3 text-blue-400 mb-2">
                <Award size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Most Trained</span>
              </div>
              <p className="text-3xl font-display text-[#F5F5F5] truncate uppercase">{stats.mostFrequent}</p>
            </div>
          </div>

          {/* History Table */}
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[#2A2A2A] flex items-center justify-between bg-[#1A1A1A]">
              <h3 className="text-xl font-bold text-[#F5F5F5] flex items-center gap-2">
                <Filter size={18} className="text-[#FFD000]" />
                Detailed Logs
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-20 text-center">
                  <div className="w-10 h-10 border-4 border-[#FFD000] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-[#888888]">Loading records...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="p-20 text-center">
                  <p className="text-[#888888]">No workout history found for this client.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1A1A1A] border-b border-[#2A2A2A]">
                      <th className="px-6 py-4 text-xs font-bold text-[#888888] uppercase tracking-wider">Date / Day</th>
                      <th className="hidden sm:table-cell px-6 py-4 text-xs font-bold text-[#888888] uppercase tracking-wider">Day</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#888888] uppercase tracking-wider">Muscle Group</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#888888] uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#888888] uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record, index) => (
                      <tr key={record.id} className="border-b border-[#2A2A2A]/50 hover:bg-[#1E1E1E] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-[#F5F5F5] font-medium">
                              <Calendar size={14} className="text-[#888888]" />
                              {record.date}
                            </div>
                            <span className="text-[10px] text-[#888888] font-bold uppercase tracking-wider mt-1 md:hidden ml-5">
                              {getDayOfWeek(record.date)}
                            </span>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-6 py-4">
                          <span className="text-[#888888]">{getDayOfWeek(record.date)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-[#2A2A2A] text-[#FFD000] rounded-lg text-xs font-bold uppercase tracking-wider">
                            {record.muscleGroup}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {record.status === 'approved' ? (
                              <>
                                <CheckCircle size={16} className="text-green-500" />
                                <span className="text-green-500 text-xs font-bold uppercase">Signed</span>
                              </>
                            ) : (
                              <>
                                <Clock size={16} className="text-[#FFD000]" />
                                <span className="text-[#FFD000] text-xs font-bold uppercase">Pending</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {record.status === 'pending' ? (
                            <button 
                              onClick={() => handleApprove(record.id)}
                              className="bg-[#FFD000] text-[#0B0B0B] px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#C9A200] transition-colors"
                            >
                              Sign Off
                            </button>
                          ) : (
                            <span className="text-[#888888] text-[10px] uppercase font-bold tracking-widest opacity-50">Completed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="p-6 bg-[#1A1A1A] border-t border-[#2A2A2A] text-center">
              <p className="text-xs text-[#555555]">
                End of history log for {client?.displayName}. Total records: {history.length}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClientHistory;
