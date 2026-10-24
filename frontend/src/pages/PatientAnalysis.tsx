import { useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ProbabilityMeter } from '../components/charts/ProbabilityMeter'
import { RiskBadge } from '../components/ui/Badge'
import { predictionService } from '../services/predictions'
import { PredictResponse, Dataset } from '../types'
import toast from 'react-hot-toast'
import { Activity, User, ChevronRight, Download, Hash, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { downloadPredictionReport } from '../utils/pdfReport'

const DIABETES_FIELDS = [
  { key: 'age', label: 'Age Group (encoded)', type: 'number', default: 5 },
  { key: 'time_in_hospital', label: 'Days in Hospital', type: 'number', default: 4 },
  { key: 'num_lab_procedures', label: 'Lab Procedures', type: 'number', default: 40 },
  { key: 'num_procedures', label: 'Procedures', type: 'number', default: 1 },
  { key: 'num_medications', label: 'Medications', type: 'number', default: 15 },
  { key: 'number_outpatient', label: 'Prior Outpatient Visits', type: 'number', default: 0 },
  { key: 'number_emergency', label: 'Prior Emergency Visits', type: 'number', default: 0 },
  { key: 'number_inpatient', label: 'Prior Inpatient Visits', type: 'number', default: 1 },
  { key: 'number_diagnoses', label: 'Number of Diagnoses', type: 'number', default: 7 },
  { key: 'insulin', label: 'Insulin (1=yes)', type: 'number', default: 1 },
  { key: 'diabetesMed', label: 'Diabetes Med (encoded)', type: 'number', default: 1 },
  { key: 'change', label: 'Medication Changed (encoded)', type: 'number', default: 0 },
  { key: 'A1Cresult', label: 'A1C Result (encoded)', type: 'number', default: 0 },
]

const HEART_FIELDS = [
  { key: 'age', label: 'Age (years)', type: 'number', default: 60 },
  { key: 'anaemia', label: 'Anaemia (0/1)', type: 'number', default: 0 },
  { key: 'creatinine_phosphokinase', label: 'CPK Level (mcg/L)', type: 'number', default: 250 },
  { key: 'diabetes', label: 'Diabetes (0/1)', type: 'number', default: 0 },
  { key: 'ejection_fraction', label: 'Ejection Fraction (%)', type: 'number', default: 38 },
  { key: 'high_blood_pressure', label: 'High Blood Pressure (0/1)', type: 'number', default: 0 },
  { key: 'platelets', label: 'Platelets (kiloplatelets/mL)', type: 'number', default: 263000 },
  { key: 'serum_creatinine', label: 'Serum Creatinine (mg/dL)', type: 'number', default: 1.1 },
  { key: 'serum_sodium', label: 'Serum Sodium (mEq/L)', type: 'number', default: 137 },
  { key: 'sex', label: 'Sex (0=F, 1=M)', type: 'number', default: 1 },
  { key: 'smoking', label: 'Smoking (0/1)', type: 'number', default: 0 },
  { key: 'time', label: 'Follow-up Period (days)', type: 'number', default: 130 },
]

export default function PatientAnalysis() {
  const [dataset, setDataset] = useState<Dataset>('diabetes')
  const [patientName, setPatientName] = useState('')
  const [nameError, setNameError] = useState('')
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(DIABETES_FIELDS.map(f => [f.key, f.default]))
  )
  const [result, setResult] = useState<PredictResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [submittedName, setSubmittedName] = useState('')

  const fields = dataset === 'diabetes' ? DIABETES_FIELDS : HEART_FIELDS

  const handleDatasetChange = (d: Dataset) => {
    setDataset(d)
    setResult(null)
    const fieldList = d === 'diabetes' ? DIABETES_FIELDS : HEART_FIELDS
    setValues(Object.fromEntries(fieldList.map(f => [f.key, f.default])))
  }

  const handlePredict = async () => {
    // Validate patient name
    if (!patientName.trim()) {
      setNameError('Patient name is required')
      return
    }
    if (patientName.trim().length < 2) {
      setNameError('Patient name must be at least 2 characters')
      return
    }
    setNameError('')

    setLoading(true)
    try {
      const res = await predictionService.predict({
        dataset,
        patient_data: values,
        patient_name: patientName.trim(),
      })
      setResult(res)
      setSubmittedName(patientName.trim())
      toast.success('Prediction complete')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Prediction failed — ensure models are trained')
    } finally {
      setLoading(false)
    }
  }

  const riskColor = result?.risk_level === 'high'
    ? 'text-red-600' : result?.risk_level === 'medium'
    ? 'text-amber-600' : 'text-green-600'

  return (
    <Layout title="Patient Analysis" subtitle="Run a readmission risk prediction">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-2 space-y-4">

          {/* Dataset selector */}
          <Card>
            <CardHeader title="Dataset" icon={<Activity size={16} />} />
            <div className="flex gap-3">
              {(['diabetes', 'heart'] as Dataset[]).map(d => (
                <button
                  key={d}
                  onClick={() => handleDatasetChange(d)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dataset === d
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {d === 'diabetes' ? 'Diabetes 130-US' : 'Heart Failure'}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {dataset === 'diabetes'
                ? 'Target: early readmission within 30 days'
                : 'Target: death during follow-up period (separate task from readmission)'}
            </p>
          </Card>

          {/* Patient Name — separate from ML features */}
          <Card>
            <CardHeader title="Patient Identification" icon={<User size={16} />}
              subtitle="Name is used for records only — never influences the prediction" />
            <div>
              <label className="label">
                Patient Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`input ${nameError ? 'border-red-400 focus:ring-red-400' : ''}`}
                placeholder="e.g. Aarya Sharma"
                value={patientName}
                onChange={e => { setPatientName(e.target.value); setNameError('') }}
                maxLength={120}
              />
              {nameError && (
                <p className="text-xs text-red-500 mt-1">{nameError}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                A unique Patient Record ID (PAT-XXXX) will be auto-generated and stored in MongoDB.
              </p>
            </div>
          </Card>

          {/* Clinical features */}
          <Card>
            <CardHeader title="Clinical Features" icon={<Activity size={16} />} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map(f => (
                <div key={f.key}>
                  <label className="label">{f.label}</label>
                  <input
                    type="number"
                    className="input"
                    value={values[f.key] ?? f.default}
                    step="any"
                    onChange={e =>
                      setValues(v => ({ ...v, [f.key]: parseFloat(e.target.value) || 0 }))
                    }
                  />
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Button onClick={handlePredict} isLoading={loading} leftIcon={<Activity size={16} />}>
                Run Prediction
              </Button>
            </div>
          </Card>
        </div>

        {/* Result Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Prediction Result" />
            {result ? (
              <div className="flex flex-col gap-4">
                {/* Patient identity */}
                <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Patient</p>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{submittedName}</p>
                  <div className="flex gap-3 mt-2">
                    {result.patient_record_id && (
                      <span className="flex items-center gap-1 text-xs font-mono text-brand-700 dark:text-brand-300 bg-brand-100 dark:bg-brand-900/40 px-2 py-0.5 rounded-md">
                        <Hash size={10} /> {result.patient_record_id}
                      </span>
                    )}
                    {result.prediction_id && (
                      <span className="flex items-center gap-1 text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                        <FileText size={10} /> {result.prediction_id}
                      </span>
                    )}
                  </div>
                </div>

                {/* Probability meter */}
                <div className="flex justify-center">
                  <ProbabilityMeter probability={result.probability} riskLevel={result.risk_level} />
                </div>

                {/* Metrics */}
                <div className="w-full space-y-2 text-sm">
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-50 dark:border-gray-800">
                    <span className="text-gray-500">Predicted Outcome</span>
                    <span className={`font-bold ${riskColor}`}>
                      {result.prediction === 1
                        ? (dataset === 'diabetes' ? 'Readmitted' : 'High Risk')
                        : (dataset === 'diabetes' ? 'Not Readmitted' : 'Lower Risk')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-50 dark:border-gray-800">
                    <span className="text-gray-500">Model Probability</span>
                    <span className="font-bold">{(result.probability * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-50 dark:border-gray-800">
                    <span className="text-gray-500">Risk Level</span>
                    <RiskBadge level={result.risk_level} />
                  </div>
                  {result.cluster_id !== undefined && result.cluster_id !== null && (
                    <div className="flex justify-between items-center py-1.5 border-b border-gray-50 dark:border-gray-800">
                      <span className="text-gray-500">Risk Profile</span>
                      <span className="font-medium">Cluster {result.cluster_id}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-gray-500">Dataset</span>
                    <span className="text-xs font-medium capitalize">{dataset}</span>
                  </div>
                </div>

                {/* Action links */}
                <div className="w-full pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
                  <Link to="/explainable" className="btn-secondary w-full justify-between text-sm">
                    Why this prediction? <ChevronRight size={14} />
                  </Link>
                  <Link to="/counterfactual" className="btn-secondary w-full justify-between text-sm">
                    Counterfactual Lab <ChevronRight size={14} />
                  </Link>
                  <Link to="/similar-patients" className="btn-secondary w-full justify-between text-sm">
                    Similar Patients <ChevronRight size={14} />
                  </Link>
                  <Link to="/history" className="btn-secondary w-full justify-between text-sm">
                    View in History <ChevronRight size={14} />
                  </Link>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-center"
                    leftIcon={<Download size={14} />}
                    onClick={() => downloadPredictionReport({
                      patientName: submittedName,
                      patientRecordId: result.patient_record_id || '—',
                      predictionId: result.prediction_id || '—',
                      dataset,
                      probability: result.probability,
                      riskLevel: result.risk_level,
                      prediction: result.prediction,
                      clusterId: result.cluster_id,
                    })}
                  >
                    Download PDF Report
                  </Button>
                </div>

                <p className="text-xs text-gray-400 text-center">
                  Model output only — not a medical recommendation.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <User size={36} className="text-gray-300 dark:text-gray-700 mb-3" />
                <p className="text-sm text-gray-500">Enter patient name and clinical features, then run a prediction.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  )
}
