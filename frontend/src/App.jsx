import { useMemo, useState } from 'react'
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

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
  subscription_type: ['Basic', 'Standard', 'Premium'],
  payment_method: ['PayPal', 'Credit Card', 'Debit Card', 'UPI'],
  primary_device: ['Mobile', 'Tablet', 'Laptop', 'Smart TV'],
  favorite_genre: ['Documentary', 'Comedy', 'Action', 'Romance', 'Thriller', 'Sci-Fi', 'Drama', 'Horror'],
}

function App() {
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})

  const riskPercent = result ? Math.round(result.churn_probability * 100) : 0

  const chartData = useMemo(() => {
    if (!result?.feature_importances?.length) return []
    return result.feature_importances.slice(0, 6).map((item) => ({
      feature: item.feature.replace(/^(num__|cat__)/, '').replaceAll('_', ' '),
      importance: Number(item.importance.toFixed(4)),
    }))
  }, [result])

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((e) => {
      if (!e || !e[key]) return e
      const next = { ...e }
      delete next[key]
      return next
    })
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
      const response = await fetch('/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
      <div className="glow glow-left" />
      <div className="glow glow-right" />

      <header className="hero">
        <div>
          <p className="eyebrow">Netflix Churn Prediction</p>
          <h1>Predict churn risk with a polished analytics dashboard.</h1>
          <p className="hero-copy">
            Enter user behavior signals, get a churn probability, and see the top drivers behind the result.
          </p>
        </div>

        <div className="hero-card">
          <span className="hero-card-label">Model status</span>
          <strong>RandomForest + SMOTE</strong>
          <span>FastAPI backend, live prediction, feature importance, and threshold control.</span>
        </div>
      </header>

      <main className="layout">
        <form className="panel form-panel" onSubmit={submit}>
          <div className="panel-header">
            <h2>Input Profile</h2>
            <p>All fields are validated in the browser and again by the API.</p>
          </div>

          <div className="grid">
            {Object.entries(form).map(([key, value]) => {
              if (key === 'threshold') return null

              if (selectOptions[key]) {
                return (
                  <label className={`field ${errors[key] ? 'error' : ''}`} key={key}>
                    <span>{labelize(key)}</span>
                    <select value={value} onChange={(e) => updateField(key, e.target.value)}>
                      {selectOptions[key].map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                      {errors[key] ? <small className="error-text">{errors[key]}</small> : null}
                  </label>
                )
              }

              const isDecimal = ['monthly_fee', 'rating_given', 'completion_rate', 'avg_watch_time_minutes', 'recommendation_click_rate'].includes(key)
                return (
                <label className={`field ${errors[key] ? 'error' : ''}`} key={key}>
                  <span>{labelize(key)}</span>
                  <input
                    type="number"
                    step={isDecimal ? '0.01' : '1'}
                    min="0"
                    value={value}
                    onChange={(e) => updateField(key, isDecimal ? Number(e.target.value) : parseInt(e.target.value || '0', 10))}
                  />
                  {errors[key] ? <small className="error-text">{errors[key]}</small> : null}
                </label>
              )
            })}

            <label className="field full-width">
              <span>Threshold</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={form.threshold}
                onChange={(e) => updateField('threshold', Number(e.target.value))}
              />
              <small>{form.threshold.toFixed(2)}</small>
            </label>
          </div>

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Predicting...' : 'Predict Churn Risk'}
          </button>

          {error ? <div className="error-box">{error}</div> : null}
        </form>

        <section className="panel result-panel">
          <div className="panel-header">
            <h2>Prediction Output</h2>
            <p>Probability, risk badge, and the strongest signals.</p>
          </div>

          {result ? (
            <>
              <div className={`badge ${result.churn_prediction === 'Yes' ? 'danger' : 'safe'}`}>
                {result.churn_prediction === 'Yes' ? 'High Risk 🚨' : 'Low Risk ✅'}
              </div>

              <div className="probability-card">
                <div className="probability-header">
                  <span>Churn probability</span>
                  <strong>{riskPercent}%</strong>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${riskPercent}%` }} />
                </div>
                <p className="result-summary">{result.explanation}</p>
              </div>

              <div className="result-grid">
                <div className="metric-card">
                  <span>Prediction</span>
                  <strong>{result.churn_prediction}</strong>
                </div>
                <div className="metric-card">
                  <span>Threshold</span>
                  <strong>{Number(result.threshold).toFixed(2)}</strong>
                </div>
              </div>

              <div className="list-block">
                <h3>Prediction Explanation</h3>
                <p>
                  {result.explanation}
                </p>

                <h4 style={{ marginTop: 12 }}>What this means</h4>
                <p>
                  {result.churn_prediction === 'Yes' ? (
                    <>This result indicates the user is at high risk of churn — they are likely to cancel their subscription or stop using the service unless engagement improves.</>
                  ) : (
                    <>This result indicates the user is at low risk of churn — they are likely to retain their subscription and continue using the service.</>
                  )}
                </p>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>Run a prediction to view the churn probability and explanation here.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function labelize(value) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

export default App