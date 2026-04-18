import { useState } from 'react';
import { postJson } from '../lib/api.js';

const STEPS = ['Company', 'ICP', 'Inboxes', 'Done'];

export default function Onboarding({ tenantId, onComplete }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    company_name: '',
    icp_description: '',
    brand_voice: 'Professional, concise, human'
  });

  async function saveAndNext() {
    if (step === 0) {
      await postJson('/api/tenant/update', { tenantId, company_name: data.company_name });
    }

    if (step === 1) {
      await postJson('/api/tenant/update', {
        tenantId,
        icp_description: data.icp_description,
        brand_voice: data.brand_voice
      });
    }

    if (step < STEPS.length - 1) {
      setStep((current) => current + 1);
    } else {
      onComplete();
    }
  }

  return (
    <div className="onboarding-shell">
      <div className="onboarding-panel panel">
        <div className="progress-row">
          {STEPS.map((label, index) => (
            <div key={label} className={`progress-segment ${index <= step ? 'active' : ''}`} />
          ))}
        </div>

        {step === 0 ? (
          <>
            <h2>Welcome to OutreachOS</h2>
            <p className="subtle">Let&apos;s set up your autonomous sales system.</p>
            <label className="field-label">Your company name</label>
            <input
              className="text-input"
              value={data.company_name}
              onChange={(event) => setData({ ...data, company_name: event.target.value })}
              placeholder="Acme Corp"
            />
          </>
        ) : null}

        {step === 1 ? (
          <>
            <h2>Define your ICP</h2>
            <p className="subtle">Who do you want to sell to? The more specific, the better.</p>
            <label className="field-label">Ideal customer in one sentence</label>
            <textarea
              className="text-area"
              value={data.icp_description}
              onChange={(event) => setData({ ...data, icp_description: event.target.value })}
              placeholder="HR directors at 50-500 person tech companies in the US"
            />
            <label className="field-label">Email tone</label>
            <select
              className="text-input"
              value={data.brand_voice}
              onChange={(event) => setData({ ...data, brand_voice: event.target.value })}
            >
              <option>Professional, concise, human</option>
              <option>Casual and direct</option>
              <option>Formal and polished</option>
              <option>Friendly and conversational</option>
            </select>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h2>Connect your inboxes</h2>
            <p className="subtle">Connect the Gmail accounts your agents will send from. Add at least one to start.</p>
            <a className="oauth-button" href={`/api/auth/gmail/connect?tenant_id=${tenantId}`}>
              + Connect Gmail inbox
            </a>
            <div className="subtle">Inbox warmup starts automatically. You can connect more inboxes later.</div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <h2>You&apos;re all set</h2>
            <p className="subtle">Your agent swarm is initializing. Jax will start briefing you as activity comes in.</p>
          </>
        ) : null}

        <button className="primary-action" type="button" onClick={saveAndNext}>
          {step < STEPS.length - 1 ? 'Continue' : 'Go to dashboard'}
        </button>
      </div>
    </div>
  );
}
