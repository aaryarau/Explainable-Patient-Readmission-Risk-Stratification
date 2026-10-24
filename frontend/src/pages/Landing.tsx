import { Link } from 'react-router-dom'
import { Heart, Brain, Users, FlaskConical, Shield, GitCompare, ArrowRight, Activity } from 'lucide-react'

const features = [
  { icon: Brain, title: 'Explainable AI', desc: 'SHAP-powered explanations for every prediction — understand exactly which factors matter.' },
  { icon: FlaskConical, title: 'Counterfactual Lab', desc: 'Explore "what if" scenarios to discover actionable paths that change predicted outcomes.' },
  { icon: Users, title: 'Similar Patients', desc: 'Find historically similar cases and compare outcomes using nearest-neighbor retrieval.' },
  { icon: Activity, title: 'Risk Stratification', desc: 'K-Means clustering discovers data-driven risk profiles across your patient population.' },
  { icon: Shield, title: 'Trust & Reliability', desc: 'Calibration metrics and fairness analysis so you know when to trust the model.' },
  { icon: GitCompare, title: 'Cross-Dataset Intelligence', desc: 'Compare ML methodology across diabetes readmission and heart failure prediction tasks.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-brand-600 rounded-lg">
            <Heart size={18} />
          </div>
          <span className="font-bold text-lg">ReAdmissionIQ</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-gray-300 hover:text-white transition-colors px-4 py-2">
            Sign in
          </Link>
          <Link
            to="/register"
            className="text-sm bg-brand-600 hover:bg-brand-500 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-8 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-900/50 border border-brand-800 text-brand-300 text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
          Academic Research Platform · UCI Datasets
        </div>
        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
          Understand Readmission Risk.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-cyan-400">
            Explain Every Prediction.
          </span>
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-10">
          An explainable machine learning platform for patient readmission analysis, patient
          profiling, and healthcare research — powered by hybrid ML, SHAP, and clustering.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/register"
            className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 rounded-xl font-medium transition-colors"
          >
            Start Exploring <ArrowRight size={16} />
          </Link>
          <Link
            to="/login"
            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors backdrop-blur"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-8 pb-24">
        <h2 className="text-center text-2xl font-bold mb-12 text-gray-100">
          Six unique research capabilities
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="p-2.5 w-fit rounded-xl bg-brand-600/30 text-brand-400 mb-4">
                <Icon size={20} />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <footer className="border-t border-white/10 px-8 py-8 text-center">
        <p className="text-xs text-gray-500 max-w-2xl mx-auto">
          This application is developed for academic and research purposes. Its outputs are
          machine-learning predictions and must not be used as a substitute for professional
          medical judgment.
        </p>
        <p className="text-xs text-gray-600 mt-2">
          Datasets: UCI Diabetes 130-US Hospitals & Heart Failure Clinical Records
        </p>
      </footer>
    </div>
  )
}
