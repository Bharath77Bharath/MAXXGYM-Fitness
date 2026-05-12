import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleRedirect } from './routes/RoleRedirect';

// Page placeholders
import Landing from './pages/Landing';
import TrainerAuth from './pages/TrainerAuth';
import ClientAuth from './pages/ClientAuth';
import TrainerDashboard from './pages/TrainerDashboard';
import AssignWorkout from './pages/AssignWorkout';
import ClientHistory from './pages/ClientHistory';
import ClientDashboard from './pages/ClientDashboard';
import ClientLog from './pages/ClientLog';

function App() {
  return (
    <div className="min-h-screen bg-[#0B0B0B] text-[#F5F5F5] font-sans">
      <Routes>
        <Route path="/" element={<Landing />} />
        
        {/* Auth routes */}
        <Route path="/trainer/auth" element={<TrainerAuth />} />
        <Route path="/client/auth" element={<ClientAuth />} />
        
        {/* Helper route to redirect to correct dashboard */}
        <Route path="/dashboard" element={<RoleRedirect />} />
        
        {/* Trainer protected routes */}
        <Route 
          path="/trainer/dashboard" 
          element={
            <ProtectedRoute allowedRole="trainer">
              <TrainerDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/trainer/assign/:clientId" 
          element={
            <ProtectedRoute allowedRole="trainer">
              <AssignWorkout />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/trainer/history/:clientId" 
          element={
            <ProtectedRoute allowedRole="trainer">
              <ClientHistory />
            </ProtectedRoute>
          } 
        />
        
        {/* Client protected routes */}
        <Route 
          path="/client/dashboard" 
          element={
            <ProtectedRoute allowedRole="client">
              <ClientDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/client/log" 
          element={
            <ProtectedRoute allowedRole="client">
              <ClientLog />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
  );
}

export default App;
