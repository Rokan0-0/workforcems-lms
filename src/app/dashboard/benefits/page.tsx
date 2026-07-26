'use client';

import { useState, useEffect } from 'react';
import { useSession } from '../session-provider';
import { Shield, Users, Plus, CheckCircle, Heart, Hospital, ChevronDown, ChevronUp, FileSpreadsheet, AlertCircle, DollarSign, Download, ExternalLink, Activity, User, Trash2 } from 'lucide-react';

export default function BenefitsPage() {
  const { user, triggerRefresh } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active Tab: 'directory' | 'claims' | 'plans'
  const [activeTab, setActiveTab] = useState<'directory' | 'claims' | 'plans'>('directory');

  // Search & Filter (HR Admin)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProviderFilter, setSelectedProviderFilter] = useState('All');

  // Expandable Accordion state for enrollees (HR Admin)
  const [expandedEnrolleeId, setExpandedEnrolleeId] = useState<string | null>(null);

  // Form state for enrollment (Employee View)
  const [selectedPlanId, setSelectedPlanId] = useState('plan-2'); // Default Hygeia Silver
  const [dependants, setDependants] = useState<{ name: string; relationship: 'Spouse' | 'Child'; dob: string }[]>([]);
  const [depName, setDepName] = useState('');
  const [depRel, setDepRel] = useState<'Spouse' | 'Child'>('Spouse');
  const [depDob, setDepDob] = useState('');
  const [enrollMsg, setEnrollMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state for Out-of-Pocket Claims
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [hospitalName, setHospitalName] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [claimAmount, setClaimAmount] = useState('');
  const [claimMsg, setClaimMsg] = useState<string | null>(null);

  // HR Review Claim state
  const [reviewClaim, setReviewClaim] = useState<any>(null);
  const [claimOutcomeNote, setClaimOutcomeNote] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        setLoading(true);
        const [empRes, benRes] = await Promise.all([
          fetch('/api/employees'),
          fetch('/api/benefits')
        ]);
        const emps = await empRes.json();
        const ben = await benRes.json();

        setData({
          employees: emps.employees || [],
          departments: emps.departments || [],
          plans: ben.hmoPlans || [],
          enrollments: ben.hmoEnrollments || [],
          claims: ben.hmoClaims || []
        });

        // Pre-fill user's existing enrollment
        const myEn = ben.hmoEnrollments?.find((e: any) => e.employeeId === user.id);
        if (myEn) {
          setSelectedPlanId(myEn.planId);
          setDependants(myEn.dependants || []);
        }
      } catch (err) {
        console.error('Failed to load HMO benefits data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const handleAddDependant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depName || !depDob) return;
    setDependants([...dependants, { name: depName, relationship: depRel, dob: depDob }]);
    setDepName('');
    setDepDob('');
  };

  const handleRemoveDependant = (index: number) => {
    setDependants(dependants.filter((_, i) => i !== index));
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setEnrollMsg(null);

    try {
      const res = await fetch('/api/benefits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enrollHmo',
          employeeId: user.id,
          planId: selectedPlanId,
          dependants
        })
      });
      const result = await res.json();
      if (result.success) {
        setEnrollMsg('HMO Plan & Dependant records saved successfully!');
        triggerRefresh();
      } else {
        setEnrollMsg(result.error || 'Failed to update HMO enrollment.');
      }
    } catch (err) {
      setEnrollMsg('Network error, please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !hospitalName || !claimAmount || !diagnosis) return;
    setClaimMsg(null);

    try {
      const res = await fetch('/api/benefits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submitClaim',
          employeeId: user.id,
          hospitalName,
          diagnosis,
          amount: claimAmount
        })
      });
      const result = await res.json();
      if (result.success) {
        setClaimMsg('Emergency refund claim submitted to HR successfully!');
        setHospitalName('');
        setDiagnosis('');
        setClaimAmount('');
        setShowClaimModal(false);
        triggerRefresh();
      } else {
        setClaimMsg(result.error || 'Failed to submit claim.');
      }
    } catch (err) {
      setClaimMsg('Network error.');
    }
  };

  const handleReviewClaimStatus = async (status: 'Approved & Refunded' | 'Rejected') => {
    if (!reviewClaim) return;
    try {
      const res = await fetch('/api/benefits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateClaimStatus',
          claimId: reviewClaim.id,
          status,
          outcomeNote: claimOutcomeNote
        })
      });
      const result = await res.json();
      if (result.success) {
        setReviewClaim(null);
        setClaimOutcomeNote('');
        triggerRefresh();
      }
    } catch (err) {
      console.error('Failed to update claim status', err);
    }
  };

  const exportHmoRemittanceCsv = () => {
    if (!data) return;
    const headers = ['Employee ID', 'Employee Name', 'Department', 'HMO Provider', 'Tier', 'Monthly Cost (₦)', 'Spouse Name', 'Children Count'];
    const rows = data.enrollments.map((en: any) => {
      const emp = data.employees.find((e: any) => e.id === en.employeeId);
      const plan = data.plans.find((p: any) => p.id === en.planId);
      const dept = data.departments.find((d: any) => d.id === emp?.departmentId);
      const spouse = en.dependants.find((d: any) => d.relationship === 'Spouse')?.name || 'N/A';
      const childrenCount = en.dependants.filter((d: any) => d.relationship === 'Child').length;

      return [
        emp?.id || en.employeeId,
        `"${emp?.name || 'Unknown'}"`,
        `"${dept?.name || 'General'}"`,
        plan?.provider || 'Unknown',
        plan?.tier || 'Custom',
        plan?.monthlyCost || 0,
        `"${spouse}"`,
        childrenCount
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `HMO_Remittance_Schedule_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !data) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', fontSize: '15px', color: 'var(--text-muted)' }}>
        Loading HMO Benefits & Healthcare Portal...
      </div>
    );
  }

  const { employees, departments, plans, enrollments, claims } = data;
  const isAdmin = user?.role === 'HR Admin';

  // Scoped Data Rules
  const myEnrollment = enrollments.find((e: any) => e.employeeId === user?.id);
  const myPlan = plans.find((p: any) => p.id === myEnrollment?.planId);
  const visibleClaims = isAdmin ? claims : claims.filter((c: any) => c.employeeId === user?.id);

  // Admin Metrics Calculations
  const totalEmployeesEnrolled = enrollments.length;
  const totalDependants = enrollments.reduce((sum: number, en: any) => sum + (en.dependants?.length || 0), 0);
  const totalCoveredLives = totalEmployeesEnrolled + totalDependants;
  const totalMonthlySpend = enrollments.reduce((sum: number, en: any) => {
    const plan = plans.find((p: any) => p.id === en.planId);
    return sum + (plan?.monthlyCost || 0);
  }, 0);

  // HR Filtered Enrollees Directory
  const filteredEnrollments = enrollments.filter((en: any) => {
    const emp = employees.find((e: any) => e.id === en.employeeId);
    const plan = plans.find((p: any) => p.id === en.planId);
    const matchesSearch = emp?.name.toLowerCase().includes(searchQuery.toLowerCase()) || emp?.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvider = selectedProviderFilter === 'All' || plan?.provider === selectedProviderFilter;
    return matchesSearch && matchesProvider;
  });

  return (
    <div className="page-container">
      {/* Top Header */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={22} color="var(--accent)" />
            {isAdmin ? 'HMO Health Insurance & Staff Benefits Hub' : 'My Healthcare Benefits & Family Dependant Portal'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {isAdmin 
              ? 'Corporate health insurance administration, enrollee directory, out-of-pocket claims queue, and provider remittance schedules.' 
              : 'Select your health insurance plan, register spouse & children dependants, and file out-of-pocket medical refund claims.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={() => setShowClaimModal(true)}>
            <Plus size={16} /> File Emergency Refund Claim
          </button>
          {isAdmin && (
            <button className="btn-primary" onClick={exportHmoRemittanceCsv}>
              <Download size={16} /> Export Provider Schedule (CSV)
            </button>
          )}
        </div>
      </div>

      {/* Metrics Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {isAdmin ? (
          <>
            <div className="metric-card" style={{ borderLeft: '4px solid var(--primary)', padding: '16px 20px' }}>
              <strong style={{ fontSize: '24px' }}>{totalCoveredLives}</strong>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Covered Lives ({totalEmployeesEnrolled} Staff + {totalDependants} Dependants)</p>
            </div>
            <div className="metric-card" style={{ borderLeft: '4px solid var(--accent)', padding: '16px 20px' }}>
              <strong style={{ fontSize: '24px', color: 'var(--accent)' }}>₦{totalMonthlySpend.toLocaleString()}</strong>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Monthly Corporate HMO Spend</p>
            </div>
            <div className="metric-card" style={{ borderLeft: '4px solid var(--success)', padding: '16px 20px' }}>
              <strong style={{ fontSize: '24px', color: 'var(--success)' }}>Hygeia & AXA</strong>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Top Enrolled HMO Providers</p>
            </div>
            <div className="metric-card" style={{ borderLeft: '4px solid var(--warning)', padding: '16px 20px' }}>
              <strong style={{ fontSize: '24px' }}>{claims.filter((c: any) => c.status === 'Pending HR Review').length}</strong>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pending HR Refund Claims</p>
            </div>
          </>
        ) : (
          <>
            <div className="metric-card" style={{ borderLeft: '4px solid var(--primary)', padding: '16px 20px' }}>
              <strong style={{ fontSize: '18px' }}>{myPlan ? `${myPlan.provider} (${myPlan.tier})` : 'Not Enrolled'}</strong>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>My Active HMO Plan</p>
            </div>
            <div className="metric-card" style={{ borderLeft: '4px solid var(--accent)', padding: '16px 20px' }}>
              <strong style={{ fontSize: '18px', color: 'var(--accent)' }}>{myPlan ? myPlan.coveredLimit : '₦0'}</strong>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Annual Hospital Limit</p>
            </div>
            <div className="metric-card" style={{ borderLeft: '4px solid var(--success)', padding: '16px 20px' }}>
              <strong style={{ fontSize: '24px', color: 'var(--success)' }}>{dependants.length}</strong>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Registered Family Dependants</p>
            </div>
            <div className="metric-card" style={{ borderLeft: '4px solid var(--warning)', padding: '16px 20px' }}>
              <strong style={{ fontSize: '24px' }}>{visibleClaims.length}</strong>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>My Submitted Claims</p>
            </div>
          </>
        )}
      </div>

      {/* Tabs Switcher */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button
          className={`btn-secondary ${activeTab === 'directory' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('directory')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {isAdmin ? <Users size={16} /> : <User size={16} />}
          {isAdmin ? 'Enrollee Directory & Dependants' : 'My HMO & Family Dependants'}
        </button>
        <button
          className={`btn-secondary ${activeTab === 'claims' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('claims')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Activity size={16} />
          {isAdmin ? `All Staff Emergency Claims (${claims.length})` : `My Refund Claims (${visibleClaims.length})`}
        </button>
        <button
          className={`btn-secondary ${activeTab === 'plans' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('plans')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Hospital size={16} />
          HMO Plan Catalog & Benefits
        </button>
      </div>

      {/* TAB 1: ENROLLEE DIRECTORY (HR) vs MY FAMILY DEPENDANTS (EMPLOYEE) */}
      {activeTab === 'directory' && (
        <>
          {isAdmin ? (
            /* HR ADMIN VIEW: FULL COMPANY ENROLLEE DIRECTORY */
            <div className="table-card">
              <div className="table-header-area" style={{ flexWrap: 'wrap', gap: '12px' }}>
                <h3 className="chart-title">Company Staff & Family Enrollee Directory ({filteredEnrollments.length})</h3>
                <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '400px' }}>
                  <input
                    type="text"
                    placeholder="Search staff name..."
                    className="filter-select"
                    style={{ flex: 1 }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <select
                    className="filter-select"
                    value={selectedProviderFilter}
                    onChange={(e) => setSelectedProviderFilter(e.target.value)}
                  >
                    <option value="All">All Providers</option>
                    <option value="Reliance HMO">Reliance HMO</option>
                    <option value="Hygeia HMO">Hygeia HMO</option>
                    <option value="AXA Mansard">AXA Mansard</option>
                    <option value="Leadway Health">Leadway Health</option>
                  </select>
                </div>
              </div>
              <div className="table-responsive">
                <table className="custom-table" style={{ fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>HMO Provider</th>
                      <th>Tier</th>
                      <th>Hospital Network</th>
                      <th>Dependants Count</th>
                      <th>Enrolled Date</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEnrollments.map((en: any) => {
                      const emp = employees.find((e: any) => e.id === en.employeeId);
                      const plan = plans.find((p: any) => p.id === en.planId);
                      const isExpanded = expandedEnrolleeId === en.id;

                      return (
                        <>
                          <tr key={en.id}>
                            <td>
                              <strong>{emp?.name || en.employeeId}</strong>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp?.email}</div>
                            </td>
                            <td><strong>{plan?.provider || 'Custom'}</strong></td>
                            <td><span className="badge badge-applied">{plan?.tier} Tier</span></td>
                            <td>{plan?.hospitalCount}+ Hospitals</td>
                            <td>
                              <span className="badge badge-inprogress" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Users size={12} /> {en.dependants?.length || 0} Dependants
                              </span>
                            </td>
                            <td>{en.enrolledDate}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className="btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '11px' }}
                                onClick={() => setExpandedEnrolleeId(isExpanded ? null : en.id)}
                              >
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Details
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${en.id}-dep`} style={{ backgroundColor: 'var(--bg-secondary)' }}>
                              <td colSpan={7} style={{ padding: '16px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: 'var(--primary)' }}>
                                  Registered Family Dependants ({en.dependants?.length || 0})
                                </div>
                                {(!en.dependants || en.dependants.length === 0) ? (
                                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No dependants registered under this plan.</div>
                                ) : (
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                                    {en.dependants.map((d: any, idx: number) => (
                                      <div key={idx} style={{ backgroundColor: 'var(--bg-primary)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                                        <div style={{ fontWeight: 600 }}>{d.name}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                          Relationship: <strong>{d.relationship}</strong> • DOB: {d.dob}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* EMPLOYEE VIEW: PRIVATE HMO COVERAGE & FAMILY DEPENDANTS MANAGEMENT */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
              {/* Active Plan & Dependants Cards */}
              <div style={{ display: 'grid', gap: '20px' }}>
                <div className="card">
                  <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Shield size={20} color="var(--primary)" /> My Active Healthcare Coverage
                  </h3>
                  {myPlan ? (
                    <div style={{ backgroundColor: 'var(--bg-primary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <strong style={{ fontSize: '16px' }}>{myPlan.provider}</strong>
                        <span className="badge badge-applied">{myPlan.tier} Tier</span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        Hospital Network: <strong>{myPlan.hospitalCount}+ Hospitals Nationwide</strong> • Limit: <strong>{myPlan.coveredLimit}</strong>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>You have not selected an HMO plan yet. Use the form on the right to enroll.</div>
                  )}
                </div>

                <div className="card">
                  <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Users size={18} color="var(--accent)" /> My Registered Family Dependants ({dependants.length})
                  </h3>
                  {dependants.length === 0 ? (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                      No family dependants registered under your health plan. Add your Spouse or Children using the form.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                      {dependants.map((d, i) => (
                        <div key={i} style={{ backgroundColor: 'var(--bg-primary)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', position: 'relative' }}>
                          <div style={{ fontWeight: 700, fontSize: '14px' }}>{d.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Relationship: <strong>{d.relationship}</strong> • DOB: {d.dob}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDependant(i)}
                            style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}
                            title="Remove Dependant"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Employee Dependant Registration Form */}
              <div className="card">
                <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Heart size={18} color="var(--accent)" /> Update HMO Plan & Dependants
                </h3>

                {enrollMsg && <div style={{ fontSize: '12px', backgroundColor: 'var(--bg-tertiary)', padding: '10px', borderRadius: 'var(--radius-md)', marginBottom: '12px' }}>{enrollMsg}</div>}

                <form onSubmit={handleEnroll} style={{ display: 'grid', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Select HMO Tier</label>
                    <select className="form-control" value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)}>
                      {plans.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.provider} ({p.tier} Tier - ₦{p.monthlyCost.toLocaleString()}/mo)</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    <label className="form-label">Add Spouse / Child</label>
                    <div style={{ display: 'grid', gap: '10px' }}>
                      <input className="form-control" placeholder="Full Legal Name" value={depName} onChange={(e) => setDepName(e.target.value)} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <select className="form-control" value={depRel} onChange={(e) => setDepRel(e.target.value as any)}>
                          <option value="Spouse">Spouse</option>
                          <option value="Child">Child</option>
                        </select>
                        <input type="date" className="form-control" value={depDob} onChange={(e) => setDepDob(e.target.value)} />
                      </div>
                      <button type="button" className="btn-secondary" onClick={handleAddDependant} style={{ justifyContent: 'center' }}>
                        + Add Dependant to List
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={submitting} className="btn-primary" style={{ justifyContent: 'center' }}>
                    {submitting ? 'Saving Enrollment...' : 'Save Health Enrollment'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: MEDICAL EMERGENCY CLAIMS & REFUNDS (SCOPED FOR EMPLOYEE VS HR) */}
      {activeTab === 'claims' && (
        <div className="table-card">
          <div className="table-header-area">
            <h3 className="chart-title">
              {isAdmin ? `All Staff Out-of-Pocket Emergency Claims (${visibleClaims.length})` : `My Emergency Medical Claims (${visibleClaims.length})`}
            </h3>
          </div>
          <div className="table-responsive">
            <table className="custom-table" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Claim ID</th>
                  {isAdmin && <th>Employee</th>}
                  <th>Hospital Name</th>
                  <th>Diagnosis / Emergency</th>
                  <th>Claim Amount</th>
                  <th>Status</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {visibleClaims.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No emergency medical refund claims found.
                    </td>
                  </tr>
                ) : (
                  visibleClaims.map((c: any) => {
                    const emp = employees.find((e: any) => e.id === c.employeeId);
                    return (
                      <tr key={c.id}>
                        <td><strong>{c.id}</strong></td>
                        {isAdmin && <td><strong>{emp?.name || c.employeeId}</strong></td>}
                        <td>{c.hospitalName}</td>
                        <td>{c.diagnosis}</td>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>₦{c.amount.toLocaleString()}</td>
                        <td><span className={`badge ${c.status === 'Approved & Refunded' ? 'badge-completed' : 'badge-pending'}`}>{c.status}</span></td>
                        {isAdmin && (
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => setReviewClaim(c)}>
                              Review / Refund
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: HMO TIERS & SUBSIDY RULES */}
      {activeTab === 'plans' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          {plans.map((p: any) => (
            <div key={p.id} className="card" style={{ borderTop: '4px solid var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="badge badge-applied">{p.tier} Tier</span>
                <strong style={{ fontSize: '18px', color: 'var(--primary)' }}>₦{p.monthlyCost.toLocaleString()}/mo</strong>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0' }}>{p.provider}</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Coverage Limit: <strong>{p.coveredLimit}</strong>
              </div>

              <div style={{ display: 'grid', gap: '8px', fontSize: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <div>✓ {p.hospitalCount}+ Verified Hospitals Nationwide</div>
                <div>✓ In-Patient & Out-Patient Care</div>
                <div>✓ Maternity & Emergency Surgery Coverage</div>
                <div>✓ Company Subsidy: <strong>100% Employee Covered</strong></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File Emergency Claim Modal */}
      {showClaimModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">File Emergency Medical Refund Claim</h3>
              <button className="close-btn" onClick={() => setShowClaimModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmitClaim}>
              <div className="modal-body" style={{ display: 'grid', gap: '16px' }}>
                {claimMsg && <div style={{ fontSize: '12px', backgroundColor: 'var(--bg-tertiary)', padding: '10px', borderRadius: 'var(--radius-md)' }}>{claimMsg}</div>}

                <div className="form-group">
                  <label className="form-label">Hospital / Clinic Name *</label>
                  <input className="form-control" placeholder="e.g. St. Nicholas Hospital, Lagos" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Emergency Diagnosis / Treatment *</label>
                  <input className="form-control" placeholder="e.g. Out-of-pocket Malaria Treatment" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Out-of-Pocket Expense Amount (₦) *</label>
                  <input className="form-control" type="number" placeholder="e.g. 35000" value={claimAmount} onChange={(e) => setClaimAmount(e.target.value)} />
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  📄 Attach medical bill/receipt receipt scan for HR verification.
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowClaimModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Submit Claim to HR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HR Review Claim Modal */}
      {reviewClaim && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">HR Claim Refund Review</h3>
              <button className="close-btn" onClick={() => setReviewClaim(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gap: '12px' }}>
              <div>
                <strong>Claim ID: {reviewClaim.id}</strong>
                <p style={{ fontSize: '13px', margin: '4px 0' }}>Hospital: {reviewClaim.hospitalName}</p>
                <p style={{ fontSize: '13px', margin: '4px 0' }}>Diagnosis: {reviewClaim.diagnosis}</p>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', marginTop: '8px' }}>
                  Amount Claimed: ₦{reviewClaim.amount.toLocaleString()}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">HR Review Note / Outcome</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Verified out-of-network receipt. Approved for payroll refund..."
                  value={claimOutcomeNote}
                  onChange={(e) => setClaimOutcomeNote(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => handleReviewClaimStatus('Rejected')}>Reject Claim</button>
              <button type="button" className="btn-primary" onClick={() => handleReviewClaimStatus('Approved & Refunded')}>Approve & Refund (₦{reviewClaim.amount.toLocaleString()})</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
