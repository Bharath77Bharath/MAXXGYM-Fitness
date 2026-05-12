import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { exerciseLibrary } from '../data/exercises';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Plus, X, GripVertical } from 'lucide-react';

const AssignWorkout = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [clientName, setClientName] = useState('Client');
  const [plan, setPlan] = useState([]);
  const [activeTab, setActiveTab] = useState('chest');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch client name
        const userDoc = await getDoc(doc(db, 'users', clientId));
        if (userDoc.exists()) {
          setClientName(userDoc.data().displayName || 'Client');
        }

        // Fetch existing plan
        const planDoc = await getDoc(doc(db, 'workoutPlans', clientId));
        if (planDoc.exists()) {
          setPlan(planDoc.data().plan || []);
        }
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [clientId]);

  const addExercise = (exercise) => {
    const newExercise = {
      ...exercise,
      id: `${exercise.id}-${Date.now()}`, // unique instance id
      sets: 3,
      reps: '10',
      notes: '',
      order: plan.length
    };
    setPlan([...plan, newExercise]);
    toast.success(`Added ${exercise.name}`);
  };

  const removeExercise = (idToRemove) => {
    setPlan(plan.filter(item => item.id !== idToRemove));
  };

  const updateExercise = (id, field, value) => {
    setPlan(plan.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const newPlan = [...plan];
    const temp = newPlan[index - 1];
    newPlan[index - 1] = newPlan[index];
    newPlan[index] = temp;
    setPlan(newPlan);
  };

  const moveDown = (index) => {
    if (index === plan.length - 1) return;
    const newPlan = [...plan];
    const temp = newPlan[index + 1];
    newPlan[index + 1] = newPlan[index];
    newPlan[index] = temp;
    setPlan(newPlan);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'workoutPlans', clientId), {
        assignedBy: currentUser.uid,
        lastUpdated: new Date().toISOString(),
        plan: plan.map((p, i) => ({ ...p, order: i }))
      });
      toast.success(`Workout plan saved for ${clientName}!`);
    } catch (error) {
      toast.error('Failed to save plan');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center text-[#FFD000]">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex flex-col">
      {/* Header */}
      <header className="bg-[#141414] border-b border-[#2A2A2A] p-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-[#888888] hover:text-[#FFD000] transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#F5F5F5]">Assign Workout</h1>
            <p className="text-sm text-[#888888]">for {clientName}</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-[#FFD000] text-[#0B0B0B] px-4 py-2 rounded font-bold uppercase tracking-wide flex items-center gap-2 hover:bg-[#C9A200] disabled:opacity-50"
        >
          <Save size={18} />
          <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save Plan'}</span>
        </button>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel: Exercise Library */}
        <div className="w-full lg:w-1/3 bg-[#141414] border-r border-[#2A2A2A] flex flex-col h-[40vh] lg:h-auto">
          <div className="flex overflow-x-auto border-b border-[#2A2A2A] custom-scrollbar">
            {Object.keys(exerciseLibrary).map(muscle => (
              <button
                key={muscle}
                onClick={() => setActiveTab(muscle)}
                className={`px-4 py-3 whitespace-nowrap font-bold uppercase text-sm tracking-wider ${
                  activeTab === muscle 
                    ? 'text-[#FFD000] border-b-2 border-[#FFD000]' 
                    : 'text-[#888888] hover:text-[#F5F5F5]'
                }`}
              >
                {muscle}
              </button>
            ))}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="space-y-3">
              {exerciseLibrary[activeTab].map(exercise => (
                <div key={exercise.id} className="bg-[#1E1E1E] p-3 rounded border border-[#2A2A2A] flex items-center justify-between hover:border-[#FFD000] transition-colors group">
                  <span className="text-[#F5F5F5] font-medium">{exercise.name}</span>
                  <button 
                    onClick={() => addExercise(exercise)}
                    className="text-[#888888] group-hover:text-[#FFD000] bg-[#2A2A2A] p-1.5 rounded-full"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Workout Plan */}
        <div className="w-full lg:w-2/3 flex flex-col flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          {plan.length === 0 ? (
            <div className="flex-1 flex items-center justify-center flex-col text-center border-2 border-dashed border-[#2A2A2A] rounded-xl p-8">
              <div className="w-16 h-16 rounded-full bg-[#1E1E1E] flex items-center justify-center mb-4">
                <Plus className="text-[#FFD000]" size={32} />
              </div>
              <h3 className="text-xl font-bold text-[#F5F5F5] mb-2">Plan is empty</h3>
              <p className="text-[#888888] max-w-md">Select exercises from the library on the left to start building the workout plan.</p>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto w-full pb-20 lg:pb-0">
              {plan.map((item, index) => (
                <div key={item.id} className="bg-[#1E1E1E] rounded-lg border border-[#2A2A2A] p-4 flex flex-col sm:flex-row gap-4">
                  <div className="flex sm:flex-col justify-between items-center text-[#888888]">
                    <span className="font-bold text-lg">{index + 1}</span>
                    <div className="flex sm:flex-col gap-1">
                      <button onClick={() => moveUp(index)} disabled={index === 0} className="hover:text-[#F5F5F5] disabled:opacity-30">↑</button>
                      <button onClick={() => moveDown(index)} disabled={index === plan.length - 1} className="hover:text-[#F5F5F5] disabled:opacity-30">↓</button>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-[#F5F5F5]">{item.name}</h4>
                        <span className="text-xs text-[#FFD000] uppercase tracking-wider font-bold bg-[#FFD000]/10 px-2 py-0.5 rounded">
                          {item.muscleGroup}
                        </span>
                      </div>
                      <button onClick={() => removeExercise(item.id)} className="text-[#888888] hover:text-red-500">
                        <X size={20} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-[#888888] mb-1">Sets</label>
                        <input 
                          type="number" 
                          value={item.sets} 
                          onChange={(e) => updateExercise(item.id, 'sets', parseInt(e.target.value))}
                          className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#FFD000] focus:outline-none"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#888888] mb-1">Reps (e.g. 8-12)</label>
                        <input 
                          type="text" 
                          value={item.reps} 
                          onChange={(e) => updateExercise(item.id, 'reps', e.target.value)}
                          className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#FFD000] focus:outline-none"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-[#888888] mb-1">Trainer Notes</label>
                      <input 
                        type="text" 
                        value={item.notes} 
                        onChange={(e) => updateExercise(item.id, 'notes', e.target.value)}
                        placeholder="e.g. Focus on eccentric phase"
                        className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#FFD000] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignWorkout;
