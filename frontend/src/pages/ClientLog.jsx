import { useState, useEffect } from 'react';
import { collection, query, where, addDoc, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import ClientSidebar from '../components/layout/ClientSidebar';
import TopBar from '../components/layout/TopBar';
import { 
  CalendarDays, 
  Plus, 
  Send, 
  CheckCircle, 
  Clock, 
  History,
  Calendar,
  Filter,
  Award,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

const ClientLog = () => {
  const { currentUser, userData } = useAuth();
  const [signOffRequests, setSignOffRequests] = useState([]);
  const [plan, setPlan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    mostFrequent: 'None'
  });

  const [newRequest, setNewRequest] = useState({
    muscleGroup: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!currentUser) return;

    // Real-time listener for sign-off requests
    const q = query(
      collection(db, 'signOffRequests'),
      where('clientId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort in memory by createdAt desc
      requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setSignOffRequests(requests);

      // Calculate stats in real-time
      const approved = requests.filter(r => r.status === 'approved').length;
      const pending = requests.filter(r => r.status === 'pending').length;
      
      const counts = {};
      requests.forEach(r => {
        if (r.status === 'approved') {
          counts[r.muscleGroup] = (counts[r.muscleGroup] || 0) + 1;
        }
      });
      const mostFrequent = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

      setStats({
        total: requests.length,
        approved,
        pending,
        mostFrequent
      });

      setLoading(false);
    }, (error) => {
      console.error("Error listening to requests:", error);
      setLoading(false);
    });

    // Fetch plan for muscle group dropdown
    const fetchPlan = async () => {
      try {
        const planDoc = await getDoc(doc(db, 'workoutPlans', currentUser.uid));
        if (planDoc.exists()) {
          setPlan(planDoc.data().plan || []);
        }
      } catch (err) {
        console.error("Error fetching plan:", err);
      }
    };
    fetchPlan();

    return () => unsubscribe();
  }, [currentUser]);

  const handleRequestSignOff = async (e) => {
    e.preventDefault();
    if (sendingRequest) return;
    if (!newRequest.muscleGroup) {
      toast.error("Please select a muscle group");
      return;
    }
    if (!userData || !userData.trainerId) {
      toast.error("No trainer assigned to your account.");
      return;
    }

    setSendingRequest(true);
    try {
      const docData = {
        clientId: currentUser.uid,
        clientName: userData.displayName || 'Unknown',
        trainerId: userData.trainerId,
        muscleGroup: newRequest.muscleGroup,
        date: newRequest.date,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'signOffRequests'), docData);
      toast.success("Workout logged! Waiting for coach signature.");
      setShowForm(false);
      setNewRequest({ ...newRequest, muscleGroup: '' });
    } catch (error) {
      console.error("Error sending request:", error);
      toast.error('Failed to log workout');
    } finally {
      setSendingRequest(false);
    }
  };

  const muscleGroups = Array.from(new Set(plan.map(ex => ex.muscleGroup))).filter(Boolean);

  const getDayOfWeek = (dateString) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = new Date(dateString);
    return days[d.getDay()];
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex flex-col lg:flex-row">
      <ClientSidebar />
      <TopBar />

      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <CalendarDays className="text-[#FFD000]" size={32} />
                <h1 className="text-4xl font-display text-[#F5F5F5]">Sign-off Log</h1>
              </div>
              <p className="text-[#888888]">Record your sessions and track signatures</p>
            </div>
            
            <button
              onClick={() => setShowForm(!showForm)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold uppercase tracking-wider text-sm transition-all shadow-lg ${
                showForm 
                  ? 'bg-[#1E1E1E] text-[#888888] border border-[#2A2A2A]' 
                  : 'bg-[#FFD000] text-[#0B0B0B] hover:scale-105 active:scale-95'
              }`}
            >
              {showForm ? 'Close' : <><Plus size={20} /> New Sign-off Request</>}
            </button>
          </div>

          {/* New Request Form - Moved here to appear immediately after button on mobile */}
          {showForm && (
            <div className="bg-[#141414] border border-[#FFD000]/30 rounded-3xl p-8 mb-10 animate-in fade-in zoom-in duration-300 shadow-2xl">
              <h3 className="text-[#F5F5F5] font-bold text-lg mb-6 flex items-center gap-2">
                <Plus className="text-[#FFD000]" size={18} />
                Log a New Session
              </h3>
              <form onSubmit={handleRequestSignOff} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#888888] mb-2 tracking-widest">Which Routine?</label>
                  <select
                    value={newRequest.muscleGroup}
                    onChange={(e) => setNewRequest({...newRequest, muscleGroup: e.target.value})}
                    className="w-full bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl px-4 py-3.5 text-[#F5F5F5] focus:border-[#FFD000] outline-none transition-all shadow-inner"
                    required
                  >
                    <option value="">Select Routine</option>
                    {muscleGroups.map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                    <option value="Cardio">Cardio</option>
                    <option value="Full Body">Full Body</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#888888] mb-2 tracking-widest">Workout Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555555]" size={18} />
                    <input
                      type="date"
                      value={newRequest.date}
                      onChange={(e) => setNewRequest({...newRequest, date: e.target.value})}
                      className="w-full bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl pl-12 pr-4 py-3 text-[#F5F5F5] focus:border-[#FFD000] outline-none transition-all"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={sendingRequest}
                  className="bg-[#FFD000] text-[#0B0B0B] h-[52px] rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-[#C9A200] disabled:opacity-50 transition-all shadow-xl"
                >
                  {sendingRequest ? (
                    <div className="w-5 h-5 border-3 border-[#0B0B0B] border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <><Send size={18} /> Send Request</>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <div className="bg-[#141414] border border-[#2A2A2A] p-6 rounded-2xl shadow-xl">
              <div className="flex items-center gap-3 text-[#888888] mb-2">
                <Calendar size={18} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Total Sessions</span>
              </div>
              <p className="text-3xl font-display text-[#F5F5F5]">{stats.total}</p>
            </div>
            
            <div className="bg-[#141414] border border-[#2A2A2A] p-6 rounded-2xl shadow-xl">
              <div className="flex items-center gap-3 text-green-500 mb-2">
                <CheckCircle size={18} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Signed Off</span>
              </div>
              <p className="text-3xl font-display text-green-400">{stats.approved}</p>
            </div>

            <div className="bg-[#141414] border border-[#2A2A2A] p-6 rounded-2xl shadow-xl">
              <div className="flex items-center gap-3 text-[#FFD000] mb-2">
                <Clock size={18} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Pending</span>
              </div>
              <p className="text-3xl font-display text-[#FFD000]">{stats.pending}</p>
            </div>

            <div className="bg-[#141414] border border-[#2A2A2A] p-6 rounded-2xl shadow-xl">
              <div className="flex items-center gap-3 text-blue-400 mb-2">
                <Award size={18} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Most Trained</span>
              </div>
              <p className="text-3xl font-display text-[#F5F5F5] truncate uppercase">{stats.mostFrequent}</p>
            </div>
          </div>


          {/* History Table */}
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[#2A2A2A] bg-[#1A1A1A] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-widest flex items-center gap-2">
                <History size={16} className="text-[#FFD000]" />
                Your Signature Record
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-20 text-center">
                  <div className="w-10 h-10 border-4 border-[#FFD000] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-[#888888]">Syncing records...</p>
                </div>
              ) : signOffRequests.length === 0 ? (
                <div className="p-20 text-center">
                  <p className="text-[#888888] text-sm">No workout history found. Log your first session above!</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1A1A1A] border-b border-[#2A2A2A]">
                      <th className="px-8 py-5 text-[10px] font-bold text-[#555555] uppercase tracking-widest">Date</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-[#555555] uppercase tracking-widest">Day</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-[#555555] uppercase tracking-widest">Routine</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-[#555555] uppercase tracking-widest text-right">Signature</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signOffRequests.map((req) => (
                      <tr key={req.id} className="border-b border-[#2A2A2A]/50 hover:bg-[#1E1E1E] transition-colors group">
                        <td className="px-8 py-6 text-sm font-medium text-[#F5F5F5]">{req.date}</td>
                        <td className="px-8 py-6 text-sm text-[#888888]">{getDayOfWeek(req.date)}</td>
                        <td className="px-8 py-6">
                          <span className="px-4 py-1.5 bg-[#2A2A2A] text-[#FFD000] rounded-xl text-[10px] font-bold uppercase tracking-widest border border-[#FFD000]/10">
                            {req.muscleGroup}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="inline-flex items-center gap-2">
                            {req.status === 'approved' ? (
                              <div className="flex items-center gap-2 text-green-500">
                                <CheckCircle size={16} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Signed ✓</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-[#FFD000]">
                                <Clock size={16} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Pending</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClientLog;
