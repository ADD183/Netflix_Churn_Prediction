import { useState } from 'react'

const initialForm = {
  age: 30,
  gender: 'Male',
  country: 'USA',
  account_age_months: 12,
  subscription_type: 'Standard',
  monthly_fee: 12.99,
  payment_method: 'PayPal',
  primary_device: 'Laptop',
  devices_used: 2,
  favorite_genre: 'Comedy',
  avg_watch_time_minutes: 120,
  watch_sessions_per_week: 6,
  binge_watch_sessions: 2,
  completion_rate: 72,
  rating_given: 3.5,
  content_interactions: 10,
  recommendation_click_rate: 20,
  days_since_last_login: 4,
  threshold: 0.5,
}

const selectOptions = {
  gender: ['Male', 'Female', 'Other'],
  country: ['USA', 'India', 'UK', 'Canada', 'Brazil', 'France', 'Japan', 'Germany', 'Spain'],
  payment_method: ['PayPal', 'Credit Card', 'Debit Card', 'UPI'],
  primary_device: ['Mobile', 'Tablet', 'Laptop', 'Smart TV'],
  favorite_genre: ['Documentary', 'Comedy', 'Action', 'Romance', 'Thriller', 'Sci-Fi', 'Drama', 'Horror'],
}

const plans = [
  { id: 'mobile', label: 'Mobile', price: 6.99, detail: '1 screen · HD', backend: 'Basic' },
  { id: 'basic', label: 'Basic', price: 17.99, detail: '1 screen · Full HD', backend: 'Basic' },
  { id: 'standard', label: 'Standard', price: 22.99, detail: '2 screens · Full HD', backend: 'Standard' },
  { id: 'premium', label: 'Premium', price: 26.99, detail: '4 screens · 4K + HDR', backend: 'Premium' },
]

const sections = [
  {
    id: 'profile',
    title: 'Customer profile',
    description: 'Basic account context helps us benchmark this member fairly.',
    fields: ['age', 'gender', 'country', 'account_age_months', 'payment_method'],
  },
  {
    id: 'engagement',
    title: 'Viewing habits',
    description: 'Recent activity and content preferences shape the health signal.',
    fields: ['favorite_genre', 'avg_watch_time_minutes', 'watch_sessions_per_week', 'binge_watch_sessions'],
  },
  {
    id: 'satisfaction',
    title: 'Member signals',
    description: 'A few lightweight signals complete the account review.',
    fields: ['completion_rate', 'rating_given', 'content_interactions', 'recommendation_click_rate', 'days_since_last_login'],
  },
]

const sliderConfig = {
  account_age_months: { min: 0, max: 120, step: 1, suffix: ' months' },
  avg_watch_time_minutes: { min: 0, max: 360, step: 5, suffix: ' min' },
  watch_sessions_per_week: { min: 0, max: 30, step: 1, suffix: ' / week' },
  completion_rate: { min: 0, max: 100, step: 1, suffix: '%' },
  recommendation_click_rate: { min: 0, max: 100, step: 1, suffix: '%' },
  days_since_last_login: { min: 0, max: 90, step: 1, suffix: ' days' },
}

function App() {
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [planId, setPlanId] = useState('standard')
  const [extras, setExtras] = useState({ extraMemberSlots: false, ultraHd: false })

  const riskPercent = result ? Math.round(result.churn_probability * 100) : 0
  const previewPercent = calculatePreviewRisk(form)
  const riskLevel = result?.churn_prediction === 'Yes' ? 'Needs attention' : 'Healthy account'

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((e) => {
      if (!e || !e[key]) return e
      const next = { ...e }
      delete next[key]
      return next
    })
  }

  const updatePlan = (nextPlanId) => {
    const plan = plans.find((item) => item.id === nextPlanId)
    setPlanId(nextPlanId)
    updateField('subscription_type', plan.backend)
    updateField('monthly_fee', plan.price)
  }

  const updateExtra = (key, enabled) => {
    setExtras((current) => ({ ...current, [key]: enabled }))
    if (key === 'extraMemberSlots') updateField('devices_used', enabled ? 2 : 1)
    if (key === 'ultraHd') updateField('primary_device', enabled ? 'Smart TV' : 'Laptop')
  }

  function validateForm(values) {
    const errs = {}

    if (!Number.isInteger(Number(values.age)) || values.age < 1 || values.age > 100) {
      errs.age = 'Age must be an integer between 1 and 100.'
    }

    if (!Number.isFinite(Number(values.monthly_fee)) || Number(values.monthly_fee) < 0) {
      errs.monthly_fee = 'Monthly fee must be 0 or greater.'
    }

    if (!Number.isInteger(Number(values.account_age_months)) || Number(values.account_age_months) < 0) {
      errs.account_age_months = 'Account age (months) must be 0 or greater.'
    }

    if (!Number.isInteger(Number(values.devices_used)) || Number(values.devices_used) < 1) {
      errs.devices_used = 'Devices used must be 1 or more.'
    }

    if (!Number.isFinite(Number(values.avg_watch_time_minutes)) || Number(values.avg_watch_time_minutes) < 0) {
      errs.avg_watch_time_minutes = 'Average watch time must be 0 or greater.'
    }

    if (!Number.isInteger(Number(values.watch_sessions_per_week)) || Number(values.watch_sessions_per_week) < 0) {
      errs.watch_sessions_per_week = 'Watch sessions per week must be 0 or greater.'
    }

    if (!Number.isInteger(Number(values.binge_watch_sessions)) || Number(values.binge_watch_sessions) < 0) {
      errs.binge_watch_sessions = 'Binge watch sessions must be 0 or greater.'
    }

    if (!Number.isFinite(Number(values.completion_rate)) || Number(values.completion_rate) < 0 || Number(values.completion_rate) > 100) {
      errs.completion_rate = 'Completion rate must be between 0 and 100.'
    }

    if (!Number.isFinite(Number(values.rating_given)) || Number(values.rating_given) < 1 || Number(values.rating_given) > 5) {
      errs.rating_given = 'Rating must be between 1 and 5.'
    }

    if (!Number.isInteger(Number(values.content_interactions)) || Number(values.content_interactions) < 0) {
      errs.content_interactions = 'Content interactions must be 0 or greater.'
    }

    if (!Number.isFinite(Number(values.recommendation_click_rate)) || Number(values.recommendation_click_rate) < 0 || Number(values.recommendation_click_rate) > 100) {
      errs.recommendation_click_rate = 'Recommendation click rate must be between 0 and 100.'
    }

    if (!Number.isInteger(Number(values.days_since_last_login)) || Number(values.days_since_last_login) < 0) {
      errs.days_since_last_login = 'Days since last login must be 0 or greater.'
    }

    // Basic required checks for selects/strings
    if (!values.gender) errs.gender = 'Please select a gender.'
    if (!values.country) errs.country = 'Please select a country.'
    if (!values.subscription_type) errs.subscription_type = 'Please select a subscription type.'

    return errs
  }

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    const validation = validateForm(form)
    if (Object.keys(validation).length) {
      setErrors(validation)
      setLoading(false)
      return
    }
    try {
      const request = { ...form, threshold: 0.5 }
      const response = await fetch('/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.detail || 'Prediction request failed')
      }

      const payload = await response.json()
      setResult(payload)
    } catch (err) {
      setError(err.message || 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Northstar home"><span className="brand-mark">N</span> northstar</a>
        <div className="topbar-meta"><span className="status-dot" /> Retention workspace <span className="topbar-divider" /> <span>Updated just now</span></div>
      </header>

      <header className="hero">
        <div className="hero-kicker"><span className="kicker-line" /> Account health</div>
        <h1>Know who needs a reason to stay.</h1>
        <p className="hero-copy">Review a member’s account signals and get a clear next step before their next billing moment.</p>
      </header>

      <main className="layout">
        <form className="panel form-panel" onSubmit={submit}>
          <div className="panel-header">
            <div>
              <span className="section-number">01</span>
              <h2>Review an account</h2>
            </div>
            <p>Use the latest known member details for the most useful assessment.</p>
          </div>

          {sections.map((section, index) => (
            <fieldset className="form-section" key={section.id}>
              <legend><span>{String(index + 1).padStart(2, '0')}</span> {section.title}</legend>
              <p className="section-description">{section.description}</p>
              {section.id === 'profile' ? <PlanSelector planId={planId} onChange={updatePlan} /> : null}
              {section.id === 'engagement' ? <div className="toggle-grid"><Toggle label="Extra member slots" detail="Share the account with another viewer" checked={extras.extraMemberSlots} onChange={(value) => updateExtra('extraMemberSlots', value)} /><Toggle label="4K streaming available" detail="Premium picture quality is enabled" checked={extras.ultraHd} onChange={(value) => updateExtra('ultraHd', value)} /></div> : null}
              <div className="grid">
                {section.fields.map((key) => renderField(key, form[key], errors[key], updateField))}
              </div>
            </fieldset>
          ))}

          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? <><span className="loader" aria-hidden="true" /> Reading signals...</> : <>Assess account health <span aria-hidden="true">→</span></>}
            </button>
            <button className="text-button" type="button" onClick={() => { setForm(initialForm); setPlanId('standard'); setExtras({ extraMemberSlots: false, ultraHd: false }); setResult(null); setErrors({}); setError('') }}>Clear form</button>
          </div>

          {error ? <div className="error-box">{error}</div> : null}
        </form>

        <section className="panel result-panel">
          <div className="panel-header">
            <div>
              <span className="section-number">02</span>
              <h2>Account health</h2>
            </div>
            <p>Your review will appear here with an actionable readout.</p>
          </div>

          {result ? (
            <>
              <div className={`health-heading ${result.churn_prediction === 'Yes' ? 'danger' : 'safe'}`}>
                <span className="health-icon" aria-hidden="true">{result.churn_prediction === 'Yes' ? '!' : '✓'}</span>
                <div><span className="overline">Current readout</span><h3>{riskLevel}</h3></div>
              </div>

              <div className="probability-card">
                <div className="probability-header">
                  <span>Likelihood of cancellation</span>
                  <strong>{riskPercent}%</strong>
                </div>
                <div className="progress-track">
                  <div className={`progress-fill ${result.churn_prediction === 'Yes' ? 'danger' : 'safe'}`} style={{ width: `${riskPercent}%` }} />
                </div>
                <p className="result-summary">{result.explanation.includes('model prediction') ? 'This account’s current activity pattern is being compared with healthy member behavior.' : result.explanation}</p>
              </div>

              <div className="result-grid">
                <div className="metric-card">
                  <span>Recommended timing</span>
                  <strong>{result.churn_prediction === 'Yes' ? 'Before next renewal' : 'Keep engaged'}</strong>
                </div>
                <div className="metric-card">
                  <span>Confidence signal</span>
                  <strong>{riskPercent >= 70 || riskPercent <= 30 ? 'Clear' : 'Moderate'}</strong>
                </div>
              </div>

              <div className="list-block">
                <h3>Suggested next step</h3>
                <p>{result.churn_prediction === 'Yes' ? 'Reach out with a relevant title or a helpful plan reminder. A timely, personal nudge can bring this account back into a healthy rhythm.' : 'No intervention is needed right now. Keep this member in your regular engagement journey and watch for changes in activity.'}</p>
                {result.top_feature_labels?.length ? <div className="signal-row"><span>Signals considered</span><strong>{result.top_feature_labels.slice(0, 3).map(friendlySignal).join(' · ')}</strong></div> : null}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <span className="empty-mark">+</span>
              <span className="overline">Live preview</span>
              <strong className={previewPercent >= 55 ? 'preview-risk' : ''}>{previewPercent}% likelihood to cancel</strong>
              <div className="preview-track"><div className={previewPercent >= 55 ? 'preview-fill preview-risk-fill' : 'preview-fill'} style={{ width: `${previewPercent}%` }} /></div>
              <p>Adjust the viewing signals to explore how activity changes the account health. Run the assessment for the final readout.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function renderField(key, value, error, updateField) {
  if (selectOptions[key]) {
    return <label className={`field ${error ? 'error' : ''}`} key={key}>
      <span>{labelize(key)}</span>
      <select value={value} onChange={(e) => updateField(key, e.target.value)}>{selectOptions[key].map((option) => <option key={option} value={option}>{option}</option>)}</select>
      {error ? <small className="error-text">{error}</small> : null}
    </label>
  }
  if (sliderConfig[key]) {
    const config = sliderConfig[key]
    return <label className={`field slider-field ${error ? 'error' : ''}`} key={key}>
      <span><span>{labelize(key)}</span><strong>{value}{config.suffix}</strong></span>
      <input type="range" min={config.min} max={config.max} step={config.step} value={value} aria-label={labelize(key)} onChange={(e) => updateField(key, Number(e.target.value))} />
      {error ? <small className="error-text">{error}</small> : null}
    </label>
  }
  const isDecimal = ['monthly_fee', 'rating_given', 'completion_rate', 'avg_watch_time_minutes', 'recommendation_click_rate'].includes(key)
  return <label className={`field ${error ? 'error' : ''}`} key={key}>
    <span>{labelize(key)}</span>
    <input type="number" step={isDecimal ? '0.01' : '1'} min="0" value={value} onChange={(e) => updateField(key, isDecimal ? Number(e.target.value) : parseInt(e.target.value || '0', 10))} />
    {error ? <small className="error-text">{error}</small> : null}
  </label>
}


function PlanSelector({ planId, onChange }) {
  return <div className="plan-selector" aria-label="Netflix plan">
    <div className="plan-selector-heading"><span>Netflix plan</span><small>Price is applied automatically</small></div>
    <div className="plan-grid">{plans.map((plan) => <button className={`plan-card ${plan.id === planId ? 'selected' : ''}`} type="button" key={plan.id} onClick={() => onChange(plan.id)} aria-pressed={plan.id === planId}><span className="plan-radio" /><strong>{plan.label}</strong><b>${plan.price.toFixed(2)}<small>/mo</small></b><em>{plan.detail}</em></button>)}</div>
  </div>
}

function Toggle({ label, detail, checked, onChange }) {
  return <label className={`toggle-card ${checked ? 'active' : ''}`}><span><strong>{label}</strong><small>{detail}</small></span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span className="toggle-track"><span /></span></label>
}
function calculatePreviewRisk(values) {
  const inactivity = Math.min(Number(values.days_since_last_login) / 90, 1) * 42
  const watchTime = (1 - Math.min(Number(values.avg_watch_time_minutes) / 360, 1)) * 22
  const sessions = (1 - Math.min(Number(values.watch_sessions_per_week) / 30, 1)) * 18
  const completion = (1 - Number(values.completion_rate) / 100) * 12
  const interaction = (1 - Math.min(Number(values.recommendation_click_rate) / 100, 1)) * 6
  return Math.round(Math.min(96, Math.max(4, inactivity + watchTime + sessions + completion + interaction)))
}

function friendlySignal(value) {
  return value.replace('Avg Watch Time Minutes', 'Watch time').replace('Recommendation Click Rate', 'Recommendations').replace('Completion Rate', 'Completion')
}

function labelize(value) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

export default App