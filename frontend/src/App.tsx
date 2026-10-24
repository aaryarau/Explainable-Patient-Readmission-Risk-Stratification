import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { PageLoader } from './components/ui/LoadingSpinner'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import PatientAnalysis from './pages/PatientAnalysis'
import ExplainablePredictions from './pages/ExplainablePredictions'
import RiskProfiles from './pages/RiskProfiles'
import SimilarPatients from './pages/SimilarPatients'
import CounterfactualLab from './pages/CounterfactualLab'
import WhatIfSimulator from './pages/WhatIfSimulator'
import ModelLab from './pages/ModelLab'
import TrustReliability from './pages/TrustReliability'
import CrossDatasetIntelligence from './pages/CrossDatasetIntelligence'
import Analytics from './pages/Analytics'
import PredictionHistory from './pages/PredictionHistory'
import Settings from './pages/Settings'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Protected */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/patient-analysis" element={<ProtectedRoute><PatientAnalysis /></ProtectedRoute>} />
      <Route path="/explainable" element={<ProtectedRoute><ExplainablePredictions /></ProtectedRoute>} />
      <Route path="/risk-profiles" element={<ProtectedRoute><RiskProfiles /></ProtectedRoute>} />
      <Route path="/similar-patients" element={<ProtectedRoute><SimilarPatients /></ProtectedRoute>} />
      <Route path="/counterfactual" element={<ProtectedRoute><CounterfactualLab /></ProtectedRoute>} />
      <Route path="/what-if" element={<ProtectedRoute><WhatIfSimulator /></ProtectedRoute>} />
      <Route path="/model-lab" element={<ProtectedRoute><ModelLab /></ProtectedRoute>} />
      <Route path="/reliability" element={<ProtectedRoute><TrustReliability /></ProtectedRoute>} />
      <Route path="/cross-dataset" element={<ProtectedRoute><CrossDatasetIntelligence /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><PredictionHistory /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
