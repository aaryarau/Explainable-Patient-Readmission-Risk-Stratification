import { useEffect, useState, useCallback } from 'react'
import { Layout } from '../components/layout/Layout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { RiskBadge } from '../components/ui/Badge'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { predictionService } from '../services/predictions'
import { PredictionHistory as PH, Dataset } from '../types'
import toast from 'react-hot-toast'
import {
  History, Trash2, ChevronLeft, ChevronRight,
  Search, Eye, Hash, FileText, User, X,
} from 'lucide-react'
import { formatDate, formatPercent } from '../utils/formatters'

const PAGE_SIZE = 20

export default function PredictionHistory() {
  const [predictions, setPredictions] = useState<PH[]>([])
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const [datasetFilter, setDatasetFilter] = useState<Dataset | ''>('')
  const [riskFilter, setRiskFilter] = useState('')
  const [searchText, setSearchText] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [selected, setSelected] = useState<any | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await predictionService.listPredictions({
        dataset: datasetFilter || undefined,
        risk_level: riskFilter || undefined,
        search: searchText || undefined,
        limit: PAGE_SIZE,
        skip,
      })
      setPredictions(res.predictions)
      setTotal(res.total)
    } catch {
      //
    } finally {
      setLoading(false)
    }
  }, [datasetFilter, riskFilter, searchText, skip])

  useEffect(() => { load() }, [load])

  const handleSearch = () => {
    setSearchText(searchInput)
    setSkip(0)
  }

  const clearSearch = () => {
    setSearchInput('')
    setSearchText('')
    setSkip(0)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this prediction record?')) return
    setDeleting(id)
    try {
      await predictionService.deletePrediction(id)
      toast.success('Deleted')
      load()
    } catch {
      toast.error('Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  const handleView = async (id: string) => {
    setDetailLoading(true)
    try {
      const detail = await predictionService.getPrediction(id)
      setSelected(detail)
    } catch {
      toast.error('Could not load details')
    } finally {
      setDetailLoading(false)
    }
  }

  const pages = Math.ceil(total / PAGE_SIZE)
  const currentPage = Math.floor(skip / PAGE_SIZE) + 1
  const riskColor = (level: string) =>
    level === 'high' ? 'text-red-600' : level === 'medium' ? 'text-amber-600' : 'text-green-600'

  return (
    <Layout title="Prediction History" subtitle="Browse and manage all saved patient predictions">
      <div className="space-y-4">
        {/* Search + filters */}
        <Card>
          <div className="flex flex-wrap gap-3 items-end">
            {/* Search */}
            <div className="flex-1 min-w-[220px]">
              <label className="label">Search</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    className="input pl-8"
                    placeholder="Patient name, PAT-ID or PRD-ID"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button size="sm" onClick={handleSearch} leftIcon={<Search size={14} />}>Search</Button>
                {searchText && (
                  <Button size="sm" variant="ghost" onClick={clearSearch} leftIcon={<X size={14} />}>Clear</Button>
                )}
              </div>
            </div>

            {/* Dataset filter */}
            <div>
              <label className="label">Dataset</label>
              <select className="input w-44" value={datasetFilter}
                onChange={e => { setDatasetFilter(e.target.value as Dataset | ''); setSkip(0) }}>
                <option value="">All datasets</option>
                <option value="diabetes">Diabetes 130-US</option>
                <option value="heart">Heart Failure</option>
              </select>
            </div>

            {/* Risk filter */}
            <div>
              <label className="label">Risk Level</label>
              <select className="input w-36" value={riskFilter}
                onChange={e => { setRiskFilter(e.target.value); setSkip(0) }}>
                <option value="">All levels</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <span className="text-xs text-gray-400 self-center ml-auto">{total} records</span>
          </div>
          {searchText && (
            <p className="text-xs text-brand-600 mt-2">
              Showing results for: <strong>"{searchText}"</strong>
            </p>
          )}
        </Card>

        {/* Table */}
        <Card padding="none">
          {loading ? (
            <PageLoader />
          ) : predictions.length === 0 ? (
            <EmptyState
              icon={<History size={32} />}
              title="No predictions found"
              description={searchText
                ? `No results for "${searchText}". Try a different name or ID.`
                : 'Run a patient analysis to save predictions here.'}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                    {['Patient', 'PAT-ID', 'PRD-ID', 'Dataset', 'Probability', 'Risk', 'Date', ''].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {predictions.map(p => (
                    <tr key={p.id}
                      className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors">
                      {/* Patient name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-700 dark:text-brand-400 text-xs font-bold shrink-0">
                            {(p.patient_name || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[120px]">
                            {p.patient_name || '—'}
                          </span>
                        </div>
                      </td>
                      {/* PAT-XXXX */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400">
                          {p.patient_record_id || '—'}
                        </span>
                      </td>
                      {/* PRD-XXXX */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs text-gray-500">
                          {p.prediction_id || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 capitalize text-gray-600 dark:text-gray-400">{p.dataset}</td>
                      <td className="py-3 px-4 font-semibold">{formatPercent(p.probability)}</td>
                      <td className="py-3 px-4"><RiskBadge level={p.risk_level} /></td>
                      <td className="py-3 px-4 text-gray-400 text-xs">
                        {p.created_at ? formatDate(p.created_at) : '—'}
                      </td>
                      {/* Actions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleView(p.id)}
                            disabled={detailLoading}
                            className="p-1.5 rounded-md text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                            title="View details">
                            <Eye size={13} />
                          </button>
                          <button onClick={() => handleDelete(p.id)}
                            disabled={deleting === p.id}
                            className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                            title="Delete">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">Page {currentPage} of {pages}</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={skip === 0}
                onClick={() => setSkip(s => Math.max(0, s - PAGE_SIZE))}
                leftIcon={<ChevronLeft size={14} />}>Prev</Button>
              <Button variant="secondary" size="sm" disabled={skip + PAGE_SIZE >= total}
                onClick={() => setSkip(s => s + PAGE_SIZE)}
                rightIcon={<ChevronRight size={14} />}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Prediction Detail" size="lg">
        {selected && (
          <div className="space-y-5">
            {/* Patient identity */}
            <div className="p-4 bg-brand-50 dark:bg-brand-900/20 rounded-xl grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><User size={11} /> Patient Name</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selected.patient_name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><Hash size={11} /> Patient Record ID</p>
                <p className="font-mono font-bold text-brand-600">{selected.patient_record_id || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><FileText size={11} /> Prediction ID</p>
                <p className="font-mono text-gray-700 dark:text-gray-300">{selected.prediction_id || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Date</p>
                <p className="text-sm">{selected.created_at ? formatDate(selected.created_at) : '—'}</p>
              </div>
            </div>

            {/* Prediction result */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-2xl font-bold text-brand-600">{(selected.probability * 100).toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-0.5">Model Probability</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className={`text-lg font-bold ${selected.risk_level === 'high' ? 'text-red-600' : selected.risk_level === 'medium' ? 'text-amber-600' : 'text-green-600'}`}>
                  {selected.risk_level?.charAt(0).toUpperCase() + selected.risk_level?.slice(1)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Risk Level</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className={`text-lg font-bold ${selected.prediction === 1 ? 'text-red-600' : 'text-green-600'}`}>
                  {selected.prediction === 1
                    ? (selected.dataset === 'diabetes' ? 'Readmitted' : 'High Risk')
                    : (selected.dataset === 'diabetes' ? 'Not Readmitted' : 'Lower Risk')}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Predicted Outcome</p>
              </div>
            </div>

            {/* Top contributing factors */}
            {selected.top_features?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Top Contributing Factors</p>
                <div className="space-y-2">
                  {selected.top_features.map((f: any) => (
                    <div key={f.feature} className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${f.shap_value >= 0 ? 'bg-red-500' : 'bg-green-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                          {f.feature.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-gray-400">
                          {f.direction} readmission risk  ·  SHAP = {f.shap_value > 0 ? '+' : ''}{f.shap_value.toFixed(4)}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold ${f.shap_value >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {f.shap_value > 0 ? '↑' : '↓'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dataset & cluster */}
            <div className="flex gap-4 text-sm">
              <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-400">Dataset</p>
                <p className="font-medium capitalize mt-0.5">{selected.dataset}</p>
              </div>
              {selected.cluster_id !== null && selected.cluster_id !== undefined && (
                <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-400">Risk Profile (Cluster)</p>
                  <p className="font-medium mt-0.5">Cluster {selected.cluster_id}</p>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3">
              This prediction was generated by a machine learning model for research purposes only.
              It must not be used as a substitute for professional medical judgment.
            </p>
          </div>
        )}
      </Modal>
    </Layout>
  )
}
