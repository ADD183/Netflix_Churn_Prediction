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
  }

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

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
                  <label className="field" key={key}>
                    <span>{labelize(key)}</span>
                    <select value={value} onChange={(e) => updateField(key, e.target.value)}>
                      {selectOptions[key].map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                )
              }

              const isDecimal = ['monthly_fee', 'rating_given', 'completion_rate', 'avg_watch_time_minutes', 'recommendation_click_rate'].includes(key)
              return (
                <label className="field" key={key}>
                  <span>{labelize(key)}</span>
                  <input
                    type="number"
                    step={isDecimal ? '0.01' : '1'}
                    min="0"
                    value={value}
                    onChange={(e) => updateField(key, isDecimal ? Number(e.target.value) : parseInt(e.target.value || '0', 10))}
                  />
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
                <h3>Top contributing features</h3>
                <ul>
                  {(result.top_feature_labels || result.top_features || []).map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>

              {chartData.length ? (
                <div className="chart-card">
                  <h3>Feature importance</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 20, bottom: 10, left: 90 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="feature" width={120} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="importance" fill="#e50914" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
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