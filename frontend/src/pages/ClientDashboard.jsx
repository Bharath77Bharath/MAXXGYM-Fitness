import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import ClientSidebar from '../components/layout/ClientSidebar';
import TopBar from '../components/layout/TopBar';
import { 
  Dumbbell, 
  ChevronDown, 
  ChevronUp, 
  History,
  Plus,
  User,
  Save,
  Camera
} from 'lucide-react';
import toast from 'react-hot-toast';

const MuscleGroupSection = ({ title, exercises }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!exercises || exercises.length === 0) return null;

  return (
    <div className="mb-6">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between bg-[#FFD000] text-[#0B0B0B] px-4 py-3 rounded-lg font-bold uppercase tracking-wider mb-3 shadow-lg"
      >
        <div className="flex items-center gap-2">
          <Dumbbell size={18} />
          <span>{title}</span>
        </div>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exercises.map((ex, i) => (
            <div key={ex.id || i} className="bg-[#141414] rounded-xl p-5 border border-[#2A2A2A] hover:border-[#FFD000]/30 transition-all">
              <h4 className="text-[#F5F5F5] font-bold text-lg mb-3">{ex.name}</h4>
              <div className="flex items-center gap-4 text-sm">
                <div className="bg-[#1E1E1E] px-4 py-2 rounded-lg border border-[#2A2A2A] flex-1 text-center">
                  <span className="text-[#FFD000] font-display text-lg mr-1">{ex.sets}</span>
                  <span className="text-[#888888] text-[10px] uppercase font-bold tracking-widest">Sets</span>
                </div>
                <div className="bg-[#1E1E1E] px-4 py-2 rounded-lg border border-[#2A2A2A] flex-1 text-center">
                  <span className="text-[#FFD000] font-display text-lg mr-1">{ex.reps}</span>
                  <span className="text-[#888888] text-[10px] uppercase font-bold tracking-widest">Reps</span>
                </div>
              </div>
              {ex.notes && (
                <div className="mt-4 pt-4 border-t border-[#2A2A2A] text-sm text-[#888888]">
                  <p className="leading-relaxed"><span className="text-[#FFD000] font-bold mr-1">Coach's Tip:</span> {ex.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ClientDashboard = () => {
  const { currentUser, userData, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [plan, setPlan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('workout'); // 'workout' or 'profile'

  // Sync tab with URL hash
  useEffect(() => {
    if (location.hash === '#profile') {
      setActiveTab('profile');
    } else {
      setActiveTab('workout');
    }
  }, [location.hash]);
  
  // Profile state
  const [editName, setEditName] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  const [editTrainerCode, setEditTrainerCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (userData) {
      setEditName(userData.displayName || '');
      setEditHeight(userData.height || '');
      setEditWeight(userData.weight || '');
      setEditPhoto(userData.photoURL || '');
      setEditTrainerCode(userData.trainerId || '');
    }
  }, [userData]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      try {
        const planDoc = await getDoc(doc(db, 'workoutPlans', currentUser.uid));
        if (planDoc.exists()) {
          setPlan(planDoc.data().plan || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#FFD000] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const groupedPlan = plan.reduce((acc, ex) => {
    const group = ex.muscleGroup || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(ex);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex flex-col lg:flex-row">
      <ClientSidebar />
      <TopBar />

      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Greeting */}
          <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-display text-[#F5F5F5] mb-2">
                {activeTab === 'profile' ? 'Your Profile' : `Hey, ${userData?.displayName?.split(' ')[0] || 'Athlete'} 💪`}
              </h1>
              <p className="text-[#888888]">
                {activeTab === 'profile' ? 'Manage your personal details for your trainer' : 'Your customized training routines'}
              </p>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab(activeTab === 'workout' ? 'profile' : 'workout')}
                className={`px-6 py-3 rounded-2xl flex items-center gap-2 font-bold uppercase tracking-widest text-xs transition-all border ${
                  activeTab === 'profile' 
                    ? 'bg-[#FFD000] border-[#FFD000] text-[#0B0B0B]' 
                    : 'bg-[#141414] border-[#2A2A2A] text-[#F5F5F5] hover:border-[#FFD000]'
                }`}
              >
                {activeTab === 'profile' ? <Dumbbell size={18} /> : <User size={18} />}
                {activeTab === 'profile' ? 'My Workout' : 'My Profile'}
              </button>

              <button 
                onClick={() => navigate('/client/log')}
                className="bg-[#141414] border border-[#2A2A2A] hover:border-[#FFD000] text-[#F5F5F5] hover:text-[#FFD000] px-6 py-3 rounded-2xl flex items-center gap-2 font-bold uppercase tracking-widest text-xs transition-all"
              >
                <History size={18} />
                Sign-off Log
              </button>
            </div>
          </header>

          {activeTab === 'workout' ? (
            <>
              {/* Workout Plan Section */}
              <section className="mb-16">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-[#F5F5F5] flex items-center gap-2">
                    <Plus className="text-[#FFD000]" size={20} />
                    Your Routines
                  </h2>
                </div>

                {plan.length === 0 ? (
                  <div className="bg-[#141414] border border-[#2A2A2A] border-dashed rounded-xl p-12 text-center">
                    <p className="text-[#888888]">No routines assigned by your coach yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedPlan).map(([group, exercises]) => (
                      <MuscleGroupSection key={group} title={group} exercises={exercises} />
                    ))}
                  </div>
                )}
              </section>

              {/* CTA to Log */}
              <section className="bg-gradient-to-r from-[#141414] to-[#0B0B0B] border border-[#2A2A2A] rounded-3xl p-8 text-center shadow-2xl">
                <h3 className="text-xl font-bold text-[#F5F5F5] mb-4">Finished your workout?</h3>
                <p className="text-[#888888] mb-6 max-w-md mx-auto">Don't forget to record your session in the Sign-off Log to get credit from your trainer.</p>
                <button 
                  onClick={() => navigate('/client/log')}
                  className="bg-[#FFD000] text-[#0B0B0B] px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform"
                >
                  Log Today's Session
                </button>
              </section>
            </>
          ) : (
            /* === PROFILE SECTION === */
            <div className="bg-[#141414] border border-[#2A2A2A] rounded-3xl p-8 shadow-2xl">
              <div className="flex flex-col md:flex-row gap-10">
                {/* Photo Upload Placeholder */}
                <div className="flex flex-col items-center gap-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-40 h-40 rounded-full bg-[#1E1E1E] border-2 border-[#2A2A2A] flex items-center justify-center relative overflow-hidden group cursor-pointer"
                  >
                    {uploading ? (
                      <div className="w-8 h-8 border-2 border-[#FFD000] border-t-transparent rounded-full animate-spin"></div>
                    ) : editPhoto ? (
                      <img src={editPhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={64} className="text-[#333333]" />
                    )}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="text-white" />
                    </div>
                  </div>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      setUploading(true);
                      try {
                        const storageRef = ref(storage, `profile_pictures/${currentUser.uid}`);
                        await uploadBytes(storageRef, file);
                        const downloadURL = await getDownloadURL(storageRef);
                        setEditPhoto(downloadURL);
                        toast.success('Photo uploaded!');
                      } catch (err) {
                        toast.error('Upload failed: ' + err.message);
                      } finally {
                        setUploading(false);
                      }
                    }}
                  />
                  <p className="text-[10px] text-[#555555] uppercase tracking-widest mt-2">Click to change photo</p>
                </div>

                {/* Form Fields */}
                <div className="flex-1 space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-[#888888] uppercase tracking-widest mb-2">Full Name</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-4 text-[#F5F5F5] focus:border-[#FFD000] outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-[#888888] uppercase tracking-widest mb-2">Height (cm)</label>
                      <input 
                        type="number" 
                        value={editHeight}
                        onChange={(e) => setEditHeight(e.target.value)}
                        placeholder="175"
                        className="w-full bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-4 text-[#F5F5F5] focus:border-[#FFD000] outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#888888] uppercase tracking-widest mb-2">Weight (kg)</label>
                      <input 
                        type="number" 
                        value={editWeight}
                        onChange={(e) => setEditWeight(e.target.value)}
                        placeholder="70"
                        className="w-full bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-4 text-[#F5F5F5] focus:border-[#FFD000] outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#888888] uppercase tracking-widest mb-2">Trainer Code</label>
                    <input 
                      type="text" 
                      value={editTrainerCode}
                      onChange={(e) => setEditTrainerCode(e.target.value)}
                      placeholder="Enter your trainer's name or code"
                      className="w-full bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-4 text-[#F5F5F5] focus:border-[#FFD000] outline-none transition-colors"
                    />
                    <p className="text-[10px] text-[#555555] mt-1 ml-1 uppercase tracking-tighter">Ask your trainer for their name-based code (e.g. johndoe)</p>
                  </div>

                  <button 
                    onClick={async () => {
                      setSaving(true);
                      try {
                        let finalTrainerUid = editTrainerCode;
                        
                        // If it's a name-based ID, look it up
                        if (editTrainerCode && editTrainerCode.length < 25) { 
                           const trainersQuery = query(
                            collection(db, 'users'),
                            where('trainerId', '==', editTrainerCode.toLowerCase().replace(/\s+/g, ''))
                          );
                          const trainersSnap = await getDocs(trainersQuery);
                          const trainerDoc = trainersSnap.docs.find(d => d.data().role === 'trainer');
                          if (trainerDoc) {
                            finalTrainerUid = trainerDoc.id;
                          } else if (trainersSnap.empty) {
                            toast.error('Trainer code not found.');
                            setSaving(false);
                            return;
                          }
                        }

                        await updateDoc(doc(db, 'users', currentUser.uid), {
                          displayName: editName,
                          height: editHeight,
                          weight: editWeight,
                          photoURL: editPhoto,
                          trainerId: finalTrainerUid
                        });
                        await refreshUser();
                        toast.success('Profile updated successfully!');
                        setActiveTab('workout');
                      } catch (err) {
                        toast.error(`Update failed: ${err.message}`);
                        console.error(err);
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                    className="w-full bg-[#FFD000] text-[#0B0B0B] py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#C9A200] transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : <><Save size={20} /> Save Profile</>}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ClientDashboard;
