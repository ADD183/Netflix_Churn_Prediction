const form = document.getElementById('predict-form');
const submitBtn = document.getElementById('submit-btn');

form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = 'Predicting...';
  const payload = {
    age: parseInt(document.getElementById('age').value,10),
    gender: document.getElementById('gender').value,
    country: document.getElementById('country').value,
    account_age_months: parseInt(document.getElementById('account_age_months').value,10),
    subscription_type: document.getElementById('subscription_type').value,
    monthly_fee: parseFloat(document.getElementById('monthly_fee').value),
    payment_method: document.getElementById('payment_method').value,
    primary_device: document.getElementById('primary_device').value,
    devices_used: parseInt(document.getElementById('devices_used').value,10),
    favorite_genre: document.getElementById('favorite_genre').value,
    avg_watch_time_minutes: parseFloat(document.getElementById('avg_watch_time_minutes').value),
    watch_sessions_per_week: parseInt(document.getElementById('watch_sessions_per_week').value,10),
    binge_watch_sessions: parseInt(document.getElementById('binge_watch_sessions').value,10),
    completion_rate: parseFloat(document.getElementById('completion_rate').value),
    rating_given: parseFloat(document.getElementById('rating_given').value),
    content_interactions: parseInt(document.getElementById('content_interactions').value,10),
    recommendation_click_rate: parseFloat(document.getElementById('recommendation_click_rate').value),
    days_since_last_login: parseInt(document.getElementById('days_since_last_login').value,10),
    threshold: parseFloat(document.getElementById('threshold').value)
  };

  const resultSection = document.getElementById('result');
  resultSection.classList.add('hidden');

  try{
    const res = await fetch('/predict', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
    });
    if(!res.ok){
      const err = await res.json();
      alert('Prediction error: '+(err.detail||res.statusText));
      return;
    }
    const data = await res.json();

    const prob = Math.round(data.churn_probability*100);
    const bar = document.getElementById('prob-bar');
    bar.style.width = prob + '%';
    document.getElementById('prob-text').textContent = `Churn probability: ${prob}%`;
    document.getElementById('pred-text').textContent = `Prediction: ${data.churn_prediction}`;
    document.getElementById('risk-badge').textContent = data.churn_prediction === 'Yes' ? 'High Risk 🚨' : 'Low Risk ✅';
    document.getElementById('explanation').textContent = data.explanation || '';

    const top = document.getElementById('top-features');
    top.innerHTML = '';
    if(data.top_features && data.top_features.length){
      const h = document.createElement('div'); h.textContent = 'Top features:'; top.appendChild(h);
      const ul = document.createElement('ul');
      const labels = data.top_feature_labels || data.top_features;
      labels.forEach(f=>{ const li=document.createElement('li'); li.textContent=f; ul.appendChild(li); });
      top.appendChild(ul);
    }

    resultSection.classList.remove('hidden');
  }catch(err){
    alert('Network or server error: '+err.message);
  }finally{
    submitBtn.disabled = false;
    submitBtn.textContent = 'Predict';
  }
});

