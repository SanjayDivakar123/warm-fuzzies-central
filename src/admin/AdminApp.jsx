import { useCallback, useEffect, useMemo, useState } from 'react';
import { getJson, postJson } from '../lib/api.js';

const ADMIN_NAV = [
  { path: '/admin', label: 'Overview' },
  { path: '/admin/leads', label: 'Leads' },
  { path: '/admin/inboxes', label: 'Inboxes' },
  { path: '/admin/logs', label: 'Logs' },
  { path: '/admin/settings', label: 'Settings' }
];

function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export default function AdminApp() {
  const [pathname, setPathname] = useState(window.location.pathname);
  const [authChecked, setAuthChecked] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    let active = true;

    getJson('/api/admin/session')
      .then(() => {
        if (active) {
          setAuthChecked(true);
        }
      })
      .catch(() => {
        if (active) {
          navigate('/login');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const currentPath = useMemo(() => {
    if (pathname === '/admin') return '/admin';
    return ADMIN_NAV.find((item) => pathname.startsWith(item.path))?.path || '/admin';
  }, [pathname]);

  const updateTenantMeta = useCallback((nextTenants, nextSelectedTenantId) => {
    if (Array.isArray(nextTenants) && nextTenants.length > 0) {
      setTenants(nextTenants);
    }

    if (nextSelectedTenantId !== undefined && nextSelectedTenantId !== null) {
      setSelectedTenantId(nextSelectedTenantId);
    }
  }, []);

  async function handleLogout() {
    try {
      await postJson('/api/admin/logout', {});
    } finally {
      navigate('/login');
    }
  }

  if (!authChecked) {
    return <div className="empty-state">Checking admin access...</div>;
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar panel">
        <div>
          <div className="eyebrow">Private Admin</div>
          <h1 className="admin-title">Jax Control Room</h1>
          <p className="subtle">Protected operations dashboard for Sanjay only.</p>
        </div>

        <nav className="nav-stack">
          {ADMIN_NAV.map((item) => (
            <button
              key={item.path}
              type="button"
              className={`nav-button ${currentPath === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mini-card">
          <div className="mini-label">Tenant Scope</div>
          <select
            className="text-input"
            value={selectedTenantId}
            onChange={(event) => setSelectedTenantId(event.target.value)}
          >
            <option value="">All tenants</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>{tenant.company_name}</option>
            ))}
          </select>
        </div>

        <button type="button" className="secondary-action" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="admin-main panel">
        {currentPath === '/admin' ? (
          <OverviewPage selectedTenantId={selectedTenantId} onMeta={updateTenantMeta} />
        ) : null}
        {currentPath === '/admin/leads' ? (
          <LeadsPage selectedTenantId={selectedTenantId} onMeta={updateTenantMeta} />
        ) : null}
        {currentPath === '/admin/inboxes' ? (
          <InboxesPage selectedTenantId={selectedTenantId} onMeta={updateTenantMeta} />
        ) : null}
        {currentPath === '/admin/logs' ? (
          <LogsPage selectedTenantId={selectedTenantId} onMeta={updateTenantMeta} />
        ) : null}
        {currentPath === '/admin/settings' ? (
          <SettingsPage selectedTenantId={selectedTenantId} onMeta={updateTenantMeta} />
        ) : null}
      </main>
    </div>
  );
}

function OverviewPage({ selectedTenantId, onMeta }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const response = await postJson('/api/admin/overview', {
        tenantId: selectedTenantId || null
      });

      if (!active) return;
      setData(response);
      onMeta(response.tenants, selectedTenantId);
    }

    load();
    const interval = setInterval(load, 10000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [selectedTenantId, onMeta]);

  if (!data) {
    return <div className="empty-state">Loading admin overview...</div>;
  }

  const stageEntries = Object.entries(data.stageCounts || {});

  return (
    <div className="admin-page">
      <div className="section-header">
        <h2>Admin Overview</h2>
        <p className="subtle">Live pipeline, engagement, meetings, and revenue across the workspace.</p>
      </div>

      <div className="admin-overview-grid">
        <div className="metric-card">
          <div className="metric-label">Emails Today</div>
          <div className="metric-value">{data.emails?.today || 0}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Emails This Week</div>
          <div className="metric-value">{data.emails?.week || 0}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Emails This Month</div>
          <div className="metric-value">{data.emails?.month || 0}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Replies</div>
          <div className="metric-value">{data.replies?.total || 0}</div>
          <div className="metric-subtle">Reply rate {data.replies?.rate || 0}%</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Meetings Booked</div>
          <div className="metric-value">{data.meetingsBooked || 0}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Revenue Closed</div>
          <div className="metric-value">{formatCurrency(data.revenueClosed)}</div>
        </div>
      </div>

      <div className="admin-two-column">
        <section className="mini-card">
          <div className="section-header">
            <h3>Pipeline by Stage</h3>
          </div>
          <div className="stage-list">
            {stageEntries.map(([stage, count]) => (
              <div key={stage} className="stage-row">
                <span>{stage.replace(/_/g, ' ')}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="mini-card">
          <div className="section-header">
            <h3>Live Agent Activity</h3>
            <p className="subtle">Refreshes every 10 seconds.</p>
          </div>
          <div className="admin-feed">
            {(data.recentActivity || []).map((row) => (
              <div key={row.id} className={`feed-row ${row.error ? 'error' : ''}`}>
                <div className="feed-topline">
                  <strong>{row.agent_name}</strong>
                  <span>{new Date(row.created_at).toLocaleTimeString()}</span>
                </div>
                <div className="feed-detail">{row.action?.replace(/_/g, ' ')}</div>
                {row.error ? <div className="feed-error">{row.error}</div> : null}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function LeadsPage({ selectedTenantId, onMeta }) {
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [data, setData] = useState(null);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [leadDetail, setLeadDetail] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const response = await postJson('/api/admin/leads', {
        tenantId: selectedTenantId || null,
        status: statusFilter,
        source: sourceFilter
      });

      if (!active) return;
      setData(response);
      onMeta(response.tenants, response.selectedTenantId || selectedTenantId);
    }

    load();
    return () => {
      active = false;
    };
  }, [selectedTenantId, statusFilter, sourceFilter, onMeta]);

  useEffect(() => {
    let active = true;

    if (!selectedLeadId) {
      setLeadDetail(null);
      return () => {
        active = false;
      };
    }

    postJson('/api/admin/lead', { leadId: selectedLeadId })
      .then((response) => {
        if (active) {
          setLeadDetail(response);
        }
      })
      .catch(() => {
        if (active) {
          setLeadDetail(null);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedLeadId]);

  if (!data) {
    return <div className="empty-state">Loading leads...</div>;
  }

  const statuses = Array.from(new Set((data.leads || []).map((lead) => lead.status).filter(Boolean)));
  const sources = Array.from(new Set((data.leads || []).map((lead) => lead.source).filter(Boolean)));

  return (
    <div className="admin-page">
      <div className="section-header">
        <h2>Leads</h2>
        <p className="subtle">Filter and inspect lead records, status, scoring, and outreach history.</p>
      </div>

      <div className="admin-toolbar">
        <select className="text-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">All statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <select className="text-input" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
          <option value="">All sources</option>
          {sources.map((source) => (
            <option key={source} value={source}>{source}</option>
          ))}
        </select>
      </div>

      <div className="admin-two-column leads-layout">
        <div className="table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Title</th>
                <th>Status</th>
                <th>ICP</th>
                <th>Source</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {(data.leads || []).map((lead) => (
                <tr key={lead.id} onClick={() => setSelectedLeadId(lead.id)} className={selectedLeadId === lead.id ? 'selected' : ''}>
                  <td>{lead.name || '—'}</td>
                  <td>{lead.company || '—'}</td>
                  <td>{lead.title || '—'}</td>
                  <td><span className="status-pill">{lead.status || '—'}</span></td>
                  <td>{lead.icp_score ?? '—'}</td>
                  <td>{lead.source || '—'}</td>
                  <td>{lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="detail-card">
          {leadDetail?.lead ? (
            <>
              <div className="section-header">
                <h3>{leadDetail.lead.name || 'Lead detail'}</h3>
                <p className="subtle">{leadDetail.lead.company || 'Unknown company'}</p>
              </div>
              <div className="detail-grid">
                <div><strong>Title:</strong> {leadDetail.lead.title || '—'}</div>
                <div><strong>Email:</strong> {leadDetail.lead.email || '—'}</div>
                <div><strong>Status:</strong> {leadDetail.lead.status || '—'}</div>
                <div><strong>ICP Score:</strong> {leadDetail.lead.icp_score ?? '—'}</div>
                <div><strong>Source:</strong> {leadDetail.lead.source || '—'}</div>
                <div><strong>LinkedIn:</strong> {leadDetail.lead.linkedin_url || '—'}</div>
              </div>

              <div className="detail-section">
                <div className="mini-label">Outreach History</div>
                {(leadDetail.outreachHistory || []).length === 0 ? <div className="subtle">No outreach yet.</div> : null}
                {(leadDetail.outreachHistory || []).map((item) => (
                  <div key={item.id} className="timeline-item">
                    <div className="timeline-title">{item.subject || item.channel || 'Touch'}</div>
                    <div className="timeline-meta">{formatDate(item.created_at)} · {item.sent_by || 'Unknown sender'}</div>
                    <div className="timeline-body">{item.body}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-detail">Select a lead to view full detail and outreach history.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function InboxesPage({ selectedTenantId, onMeta }) {
  const [data, setData] = useState(null);
  const [pendingId, setPendingId] = useState('');

  async function load() {
    const response = await postJson('/api/admin/inboxes', {
      tenantId: selectedTenantId || null
    });
    setData(response);
    onMeta(response.tenants, response.selectedTenantId || selectedTenantId);
  }

  useEffect(() => {
    load().catch(() => {});
  }, [selectedTenantId]);

  async function toggleInbox(inbox) {
    setPendingId(inbox.id);
    try {
      await postJson('/api/admin/inbox-toggle', {
        inboxId: inbox.id,
        active: !inbox.active
      });
      await load();
    } finally {
      setPendingId('');
    }
  }

  if (!data) {
    return <div className="empty-state">Loading inboxes...</div>;
  }

  return (
    <div className="admin-page">
      <div className="section-header">
        <h2>Inbox Manager</h2>
        <p className="subtle">Monitor connected inboxes, warmup phases, limits, and active status.</p>
      </div>

      <div className="inbox-grid">
        {(data.inboxes || []).map((inbox) => (
          <div key={inbox.id} className="mini-card">
            <div className="section-header">
              <h3>{inbox.email}</h3>
              <p className="subtle">Phase {inbox.warmup_phase} · Daily cold limit {inbox.daily_cold_limit}</p>
            </div>
            <div className="detail-grid">
              <div><strong>Status:</strong> {inbox.active ? 'Active' : 'Inactive'}</div>
              <div><strong>Warmup today:</strong> {inbox.todayWarmupCount}/{inbox.warmupLimit}</div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${inbox.warmupProgressPercent || 0}%` }} />
            </div>
            <button
              type="button"
              className="secondary-action"
              disabled={pendingId === inbox.id}
              onClick={() => toggleInbox(inbox)}
            >
              {pendingId === inbox.id ? 'Saving...' : inbox.active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function LogsPage({ selectedTenantId, onMeta }) {
  const [agentFilter, setAgentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const response = await postJson('/api/admin/logs', {
        tenantId: selectedTenantId || null,
        agentName: agentFilter,
        page
      });

      if (!active) return;
      setData(response);
      onMeta(response.tenants, selectedTenantId);
    }

    load();
    return () => {
      active = false;
    };
  }, [selectedTenantId, agentFilter, page, onMeta]);

  if (!data) {
    return <div className="empty-state">Loading logs...</div>;
  }

  const totalPages = Math.max(1, Math.ceil((data.total || 0) / (data.pageSize || 50)));

  return (
    <div className="admin-page">
      <div className="section-header">
        <h2>Agent Log</h2>
        <p className="subtle">Full `agent_log` feed with pagination and per-agent filtering.</p>
      </div>

      <div className="admin-toolbar">
        <input
          className="text-input"
          value={agentFilter}
          onChange={(event) => {
            setAgentFilter(event.target.value);
            setPage(1);
          }}
          placeholder="Filter by agent name"
        />
      </div>

      <div className="table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Agent</th>
              <th>Action</th>
              <th>Result</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {(data.logs || []).map((log) => (
              <tr key={log.id} className={log.error ? 'row-error' : ''}>
                <td>{formatDate(log.created_at)}</td>
                <td>{log.agent_name || '—'}</td>
                <td>{log.action || '—'}</td>
                <td>{log.result || '—'}</td>
                <td>{log.error || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination-row">
        <button type="button" className="secondary-action" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button type="button" className="secondary-action" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

function SettingsPage({ selectedTenantId, onMeta }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    tenantId: '',
    icp_description: '',
    brand_voice: '',
    calendly_url: ''
  });
  const [tenants, setTenants] = useState([]);

  async function loadSettings(tenantId) {
    const response = await getJson('/api/admin/settings', {
      tenantId: tenantId || ''
    });

    setTenants(response.tenants || []);
    onMeta(response.tenants, response.selectedTenantId);
    setForm({
      tenantId: response.selectedTenantId || '',
      icp_description: response.tenant?.icp_description || '',
      brand_voice: response.tenant?.brand_voice || '',
      calendly_url: response.tenant?.calendly_url || ''
    });
  }

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      await loadSettings(selectedTenantId);
      if (active) {
        setLoading(false);
      }
    }

    load().catch(() => setLoading(false));
    return () => {
      active = false;
    };
  }, [selectedTenantId, onMeta]);

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await postJson('/api/admin/settings', form);
      onMeta(tenants, form.tenantId);
      setForm((current) => ({
        ...current,
        icp_description: response.tenant?.icp_description || current.icp_description,
        brand_voice: response.tenant?.brand_voice || current.brand_voice,
        calendly_url: response.tenant?.calendly_url || current.calendly_url
      }));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="empty-state">Loading settings...</div>;
  }

  return (
    <div className="admin-page">
      <div className="section-header">
        <h2>Settings</h2>
        <p className="subtle">Edit ICP, brand voice, and Calendly URL directly on the tenant record.</p>
      </div>

      <form className="settings-form" onSubmit={handleSave}>
        <label className="field-label">Tenant</label>
        <select
          className="text-input"
          value={form.tenantId}
          onChange={async (event) => {
            const nextTenantId = event.target.value;
            setLoading(true);
            try {
              await loadSettings(nextTenantId);
            } finally {
              setLoading(false);
            }
          }}
        >
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>{tenant.company_name}</option>
          ))}
        </select>

        <label className="field-label">ICP Description</label>
        <textarea
          className="text-area"
          value={form.icp_description}
          onChange={(event) => setForm((current) => ({ ...current, icp_description: event.target.value }))}
        />

        <label className="field-label">Brand Voice</label>
        <textarea
          className="text-area"
          value={form.brand_voice}
          onChange={(event) => setForm((current) => ({ ...current, brand_voice: event.target.value }))}
        />

        <label className="field-label">Calendly URL</label>
        <input
          className="text-input"
          value={form.calendly_url}
          onChange={(event) => setForm((current) => ({ ...current, calendly_url: event.target.value }))}
          placeholder="https://calendly.com/your-team/demo"
        />

        <button type="submit" className="primary-action" disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
