/**
 * Generates a printable HTML report for a prediction result and triggers
 * the browser's print-to-PDF dialog.
 *
 * No external PDF library needed — works in every modern browser.
 */

interface ReportData {
  patientName: string
  patientRecordId: string
  predictionId: string
  dataset: string
  probability: number
  riskLevel: string
  prediction: number
  clusterId?: number | null
  topFeatures?: Array<{ feature: string; shap_value: number; direction: string }>
  createdAt?: string
}

export function downloadPredictionReport(data: ReportData): void {
  const outcomeLabel =
    data.prediction === 1
      ? data.dataset === 'diabetes' ? 'Readmitted (within 30 days)' : 'High Risk (death event)'
      : data.dataset === 'diabetes' ? 'Not Readmitted' : 'Lower Risk'

  const riskColor =
    data.riskLevel === 'high' ? '#dc2626' :
    data.riskLevel === 'medium' ? '#d97706' : '#16a34a'

  const featuresHtml = data.topFeatures?.length
    ? data.topFeatures.map(f => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;">${f.feature.replace(/_/g, ' ')}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:${f.shap_value >= 0 ? '#dc2626' : '#16a34a'};font-weight:600;">
            ${f.shap_value > 0 ? '+' : ''}${f.shap_value.toFixed(4)}
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#6b7280;">${f.direction} risk</td>
        </tr>`).join('')
    : '<tr><td colspan="3" style="padding:8px 12px;color:#9ca3af;">No explanation data available.</td></tr>'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Prediction Report — ${data.patientName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111827; background: #fff; padding: 40px; }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 2px solid #0d9488; }
    .logo { font-size: 20px; font-weight: 800; color: #0d9488; }
    .logo span { font-size: 11px; display: block; font-weight: 400; color: #6b7280; }
    .title { font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 4px; }
    .subtitle { font-size: 13px; color: #6b7280; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .field { background: #f9fafb; border-radius: 8px; padding: 12px; }
    .field label { font-size: 11px; color: #9ca3af; display: block; margin-bottom: 2px; }
    .field value { font-size: 14px; font-weight: 600; color: #111827; }
    .outcome-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px; text-align: center; }
    .outcome-label { font-size: 11px; color: #6b7280; }
    .outcome-value { font-size: 28px; font-weight: 800; color: ${riskColor}; margin: 4px 0; }
    .outcome-sub { font-size: 13px; font-weight: 600; color: #374151; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead th { background: #f3f4f6; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #6b7280; }
    .disclaimer { font-size: 11px; color: #9ca3af; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; line-height: 1.6; }
    .id-badge { display: inline-block; background: #eff6ff; color: #1d4ed8; font-family: monospace; font-size: 13px; font-weight: 700; padding: 3px 10px; border-radius: 6px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">ReAdmissionIQ<span>Explainable Healthcare Intelligence</span></div>
    <div style="text-align:right">
      <div style="font-size:12px;color:#6b7280;">Generated: ${new Date().toLocaleString()}</div>
      <div style="font-size:12px;color:#6b7280;margin-top:2px;">Academic Research Report</div>
    </div>
  </div>

  <div class="section">
    <div class="title">${data.patientName}</div>
    <div class="subtitle">Patient Readmission Risk Analysis Report</div>
  </div>

  <div class="section">
    <div class="section-title">Patient Identification</div>
    <div class="grid">
      <div class="field">
        <label>Patient Record ID</label>
        <div><span class="id-badge">${data.patientRecordId || '—'}</span></div>
      </div>
      <div class="field">
        <label>Prediction ID</label>
        <div><span class="id-badge" style="background:#f5f3ff;color:#6d28d9;">${data.predictionId || '—'}</span></div>
      </div>
      <div class="field">
        <label>Patient Name</label>
        <value>${data.patientName}</value>
      </div>
      <div class="field">
        <label>Analysis Date</label>
        <value>${data.createdAt ? new Date(data.createdAt).toLocaleString() : new Date().toLocaleString()}</value>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Prediction Result</div>
    <div class="grid" style="grid-template-columns:1fr 1fr 1fr;gap:12px;">
      <div class="outcome-box">
        <div class="outcome-label">Model Probability</div>
        <div class="outcome-value">${(data.probability * 100).toFixed(1)}%</div>
        <div class="outcome-sub">Readmission Risk</div>
      </div>
      <div class="outcome-box" style="background:#fef2f2;border-color:#fecaca;">
        <div class="outcome-label">Risk Level</div>
        <div class="outcome-value" style="color:${riskColor}">${data.riskLevel.charAt(0).toUpperCase() + data.riskLevel.slice(1)}</div>
        <div class="outcome-sub">Classification</div>
      </div>
      <div class="outcome-box" style="background:#f0f9ff;border-color:#bae6fd;">
        <div class="outcome-label">Predicted Outcome</div>
        <div class="outcome-value" style="font-size:16px;color:#0369a1;">${outcomeLabel}</div>
        <div class="outcome-sub">Dataset: ${data.dataset}</div>
      </div>
    </div>
    ${data.clusterId !== null && data.clusterId !== undefined ? `
    <div class="field" style="margin-top:12px;">
      <label>Risk Profile (K-Means Cluster)</label>
      <value>Cluster ${data.clusterId}</value>
    </div>` : ''}
  </div>

  <div class="section">
    <div class="section-title">Explanation — Top Contributing Factors (SHAP)</div>
    <table>
      <thead>
        <tr>
          <th>Feature</th>
          <th>SHAP Value</th>
          <th>Effect on Risk</th>
        </tr>
      </thead>
      <tbody>${featuresHtml}</tbody>
    </table>
    <p style="font-size:11px;color:#9ca3af;margin-top:8px;">
      Red (positive) SHAP values increase predicted risk. Green (negative) values decrease it.
      These are model associations, not proven clinical causes.
    </p>
  </div>

  <div class="disclaimer">
    <strong>DISCLAIMER:</strong> This report is generated by the ReAdmissionIQ academic research platform.
    All outputs are machine-learning model predictions based on historical hospital data.
    This report must NOT be used as a substitute for professional medical judgment, clinical diagnosis,
    or treatment decisions. Patient name is used for identification purposes only and has no influence
    on the model's prediction. The prediction was calculated exclusively from clinical and
    hospital-related features.
  </div>
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 500)
}
