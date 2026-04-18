import { useEffect, useState } from 'react';
import JaxChat from './JaxChat.jsx';
import { postJson } from '../lib/api.js';

const STAGES = ['new', 'enriched', 'outreach_sent', 'replied', 'meeting_booked', 'proposal_sent', 'closed_won'];
const STAGE_LABELS = {
  new: 'New',
  enriched: 'Enriched',
  outreach_sent: 'Outreach Sent',
  replied: 'Replied',
  meeting_booked: 'Meeting Booked',
  proposal_sent: 'Proposal Sent',
  closed_won: 'Closed'
};
const STAGE_COLORS = {
  new: '#e2e8f0',
  enriched: '#bfdbfe',
  outreach_sent: '#fde68a',
  replied: '#bbf7d0',
  meeting_booked: '#c7d2fe',
  proposal_sent: '#fbcfe8',
  closed_won: '#6ee7b7'
};

export default function Dashboard({ tenantId }) {
  const [stats, setStats] = useState({});
  const [leads, setLeads] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [tenant, setTenant] = useState(null);
  const [view, setView] = useState('pipeline');

  useEffect(() => {
    if (!tenantId) {
      return undefined;
    }

    let active = true;

    async function loadDashboard() {
      const data = await postJson('/api/tenant/dashboard', { tenantId });

      if (!active) return;

      const stageCounts = {};
      STAGES.forEach((stage) => {
        stageCounts[stage] = 0;
      });
      (data.leads || []).forEach((lead) => {
        if (stageCounts[lead.status] !== undefined) stageCounts[lead.status] += 1;
      });

      setStats(stageCounts);
      setLeads(data.leads || []);
      setRecentActivity(data.recentActivity || []);
      setRevenue(data.revenue || 0);
      setTenant(data.tenant || null);
    }

    loadDashboard();
    const interval = setInterval(loadDashboard, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [tenantId]);

  return (
    <div className="saas-layout">
      <aside className="saas-sidebar panel">
        <div>
          <div className="eyebrow">{tenant?.platform_name || 'OutreachOS'}</div>
          <h1 className="saas-title">{tenant?.company_name || 'Pipeline Dashboard'}</h1>
          <p className="subtle">
            Autonomous sales system with tenant-isolated agents, inboxes, and revenue tracking.
          </p>
        </div>

        <nav className="nav-stack">
          {['pipeline', 'jax', 'agents', 'settings'].map((item) => (
            <button
              key={item}
              type="button"
              className={`nav-button ${view === item ? 'active' : ''}`}
              onClick={() => setView(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="mini-card">
          <div className="mini-label">Brand Voice</div>
          <div>{tenant?.brand_voice || 'Professional, concise, human'}</div>
        </div>
      </aside>

      <section className="saas-main panel">
        {view === 'jax' ? (
          <>
            <div className="section-header">
              <h2>Chief of Staff</h2>
              <p className="subtle">Jax handles updates, risks, and direction for this tenant.</p>
            </div>
            <JaxChat tenantId={tenantId} />
          </>
        ) : null}

        {view === 'pipeline' ? (
          <>
            <div className="stats-row">
              {[
                { label: 'Total leads', value: leads.length },
                { label: 'In outreach', value: (stats.outreach_sent || 0) + (stats.replied || 0) },
                { label: 'Meetings booked', value: stats.meeting_booked || 0 },
                { label: 'Deals closed', value: stats.closed_won || 0 },
                { label: 'Revenue', value: `$${revenue.toLocaleString()}` }
              ].map((item) => (
                <div key={item.label} className="metric-card">
                  <div className="metric-value">{item.value}</div>
                  <div className="metric-label">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="kanban-grid">
              {STAGES.map((stage) => (
                <div key={stage} className="kanban-column">
                  <div className="kanban-heading">
                    {STAGE_LABELS[stage]} <span>({stats[stage] || 0})</span>
                  </div>
                  {(leads || []).filter((lead) => lead.status === stage).slice(0, 5).map((lead) => (
                    <div key={lead.id} className="lead-chip" style={{ background: STAGE_COLORS[stage] }}>
                      <div className="lead-name">{lead.name || 'Unknown'}</div>
                      <div className="lead-company">{lead.company || '—'}</div>
                    </div>
                  ))}
                  {(stats[stage] || 0) > 5 ? <div className="lead-more">+{(stats[stage] || 0) - 5} more</div> : null}
                </div>
              ))}
            </div>

            <div className="activity-table">
              <div className="section-header">
                <h2>Recent Activity</h2>
              </div>
              {recentActivity.slice(0, 10).map((log, index) => (
                <div key={log.id} className={`activity-row ${index % 2 === 0 ? 'even' : ''}`}>
                  <span className="activity-agent">{log.agent_name}</span>
                  <span className="activity-action">{log.action?.replace(/_/g, ' ')}</span>
                  <span className="activity-time">{new Date(log.created_at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </>
        ) : null}

        {view === 'agents' ? <AgentStatusGrid /> : null}
        {view === 'settings' ? <SettingsPanel tenant={tenant} /> : null}
      </section>
    </div>
  );
}

function AgentStatusGrid() {
  const agents = [
    'Jax', 'Atlas', 'Halo', 'Suki', 'Nero', 'Wyla', 'Dot', 'Oryn', 'Cove',
    'Petra', 'Caden', 'Lune', 'Orla', 'Rowan', 'Hera', 'Ashe', 'Finn', 'Ova', 'Cael'
  ];

  return (
    <div className="agent-grid">
      {agents.map((name) => (
        <div key={name} className="agent-card">
          <div className="agent-name">{name}</div>
          <div className="agent-status"><span className="status-dot" />Active</div>
        </div>
      ))}
    </div>
  );
}

function SettingsPanel({ tenant }) {
  return (
    <div className="settings-panel">
      <div className="mini-card">
        <div className="mini-label">Company</div>
        <div>{tenant?.company_name || 'Not configured'}</div>
      </div>
      <div className="mini-card">
        <div className="mini-label">Owner</div>
        <div>{tenant?.owner_email || 'Not configured'}</div>
      </div>
      <div className="mini-card">
        <div className="mini-label">ICP</div>
        <div>{tenant?.icp_description || 'Not configured'}</div>
      </div>
    </div>
  );
}
