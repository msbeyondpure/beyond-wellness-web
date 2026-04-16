import { useState, useMemo } from 'react'
import { useAffiliates } from '../hooks/useAffiliates'
import { useOutreach } from '../hooks/useOutreach'

const Plus = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const Trash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
const Edit2 = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const Mail = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
const X = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const ChevronUp = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
const ChevronDown = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Twitter/X', 'Facebook', 'Pinterest', 'Podcast', 'Blog', 'Email', 'Other']
const RESPONSES = ['No response', 'Interested', 'Not interested', 'Follow-up needed', 'Accepted', 'Contracted']
const STATUSES = ['Active', 'Inactive', 'Pending']

const emptyOutreach = { name: '', platform: 'Instagram', handle: '', email: '', date_contacted: '', response: 'No response', notes: '' }
const emptyAffiliate = { name: '', platform: 'Instagram', handle: '', email: '', link: '', code: '', date_joined: '', total_sales: 0, commission: 0, status: 'Active', payment_method: 'PayPal', notes: '' }

function SortHeader({ label, field, sort, setSort }) {
  const active = sort.field === field
  return (
    <th
      className="text-left py-2 px-3 text-gray-400 font-medium text-sm sortable-header"
      onClick={() => setSort(s => ({ field, direction: s.field === field && s.direction === 'asc' ? 'desc' : 'asc' }))}
    >
      <span className="flex items-center gap-1">
        {label}
        <span className={active ? 'text-brand-accent' : 'text-gray-600'}>
          {active && sort.direction === 'asc' ? <ChevronUp /> : <ChevronDown />}
        </span>
      </span>
    </th>
  )
}

function sortData(data, { field, direction }) {
  return [...data].sort((a, b) => {
    const av = a[field] ?? ''
    const bv = b[field] ?? ''
    const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
    return direction === 'asc' ? cmp : -cmp
  })
}

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-card rounded-lg w-full max-w-lg animate-scaleIn" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg leading-none transition-colors">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function Affiliates({ userId }) {
  const [tab, setTab] = useState('outreach')
  const { affiliates, loading: aLoading, addAffiliate, updateAffiliate, deleteAffiliate } = useAffiliates(userId)
  const { contacts, loading: oLoading, addContact, updateContact, deleteContact } = useOutreach(userId)

  // Outreach state
  const [outreachSort, setOutreachSort] = useState({ field: 'date_contacted', direction: 'desc' })
  const [showOutreachForm, setShowOutreachForm] = useState(false)
  const [outreachForm, setOutreachForm] = useState(emptyOutreach)
  const [editingOutreachId, setEditingOutreachId] = useState(null)

  // Affiliates state
  const [affiliateSort, setAffiliateSort] = useState({ field: 'date_joined', direction: 'desc' })
  const [showAffiliateForm, setShowAffiliateForm] = useState(false)
  const [affiliateForm, setAffiliateForm] = useState(emptyAffiliate)
  const [editingAffiliateId, setEditingAffiliateId] = useState(null)
  const [selectedAffiliate, setSelectedAffiliate] = useState(null)
  const [inlineEdit, setInlineEdit] = useState(null) // { id, field, value }

  const sortedOutreach = useMemo(() => sortData(contacts, outreachSort), [contacts, outreachSort])
  const sortedAffiliates = useMemo(() => sortData(affiliates, affiliateSort), [affiliates, affiliateSort])

  const totalSales = affiliates.reduce((s, a) => s + (parseFloat(a.total_sales) || 0), 0)
  const totalCommission = affiliates.reduce((s, a) => s + (parseFloat(a.commission) || 0), 0)

  function openAddOutreach() { setOutreachForm(emptyOutreach); setEditingOutreachId(null); setShowOutreachForm(true) }
  function openEditOutreach(item) { setOutreachForm({ ...item }); setEditingOutreachId(item.id); setShowOutreachForm(true) }

  async function submitOutreach() {
    if (!outreachForm.name.trim()) return
    if (editingOutreachId) {
      await updateContact(editingOutreachId, outreachForm)
    } else {
      await addContact(outreachForm)
    }
    setShowOutreachForm(false); setEditingOutreachId(null)
  }

  function openAddAffiliate() { setAffiliateForm(emptyAffiliate); setEditingAffiliateId(null); setShowAffiliateForm(true) }
  function openEditAffiliate(item) { setAffiliateForm({ ...item }); setEditingAffiliateId(item.id); setShowAffiliateForm(true); setSelectedAffiliate(null) }

  async function submitAffiliate() {
    if (!affiliateForm.name.trim()) return
    if (editingAffiliateId) {
      await updateAffiliate(editingAffiliateId, affiliateForm)
    } else {
      await addAffiliate(affiliateForm)
    }
    setShowAffiliateForm(false); setEditingAffiliateId(null)
  }

  function saveInlineEdit() {
    if (!inlineEdit) return
    updateAffiliate(inlineEdit.id, { [inlineEdit.field]: parseFloat(inlineEdit.value) || 0 })
    setInlineEdit(null)
  }

  function toggleContacted(id) {
    const today = new Date().toISOString().split('T')[0]
    const item = contacts.find(c => c.id === id)
    updateContact(id, { contacted: !item?.contacted, date_contacted: !item?.contacted ? today : item.date_contacted })
  }

  const responseColor = (r) => {
    if (r === 'Accepted' || r === 'Contracted') return 'bg-brand-success/20 text-brand-success'
    if (r === 'Interested') return 'bg-blue-500/20 text-blue-400'
    if (r === 'Not interested') return 'bg-red-500/20 text-red-400'
    return 'bg-gray-500/20 text-gray-400'
  }
  const statusColor = (s) => {
    if (s === 'Active') return 'bg-brand-success/20 text-brand-success'
    if (s === 'Pending') return 'bg-yellow-500/20 text-yellow-400'
    return 'bg-gray-500/20 text-gray-400'
  }

  return (
    <div className="p-4 pt-6 animate-fadeIn">
      <div className="max-w-6xl mx-auto">
        <div className="affiliates-section glass-card rounded p-5">

          {/* Tabs */}
          <div className="flex gap-2 mb-5 border-b border-white/10">
            {['outreach', 'affiliates'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 font-medium text-sm transition-all border-b-2 -mb-px capitalize ${
                  tab === t ? 'text-brand-accent border-brand-accent' : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                {t === 'outreach' ? `Outreach (${contacts.length})` : `Affiliates (${affiliates.length})`}
              </button>
            ))}
          </div>

          {/* ── Outreach Tab ── */}
          {tab === 'outreach' && (
            <div>
              <div className="flex gap-2 mb-4">
                <button onClick={openAddOutreach} className="btn-primary px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1">
                  <Plus /> Add
                </button>
              </div>

              {/* Add/Edit modal */}
              <Modal isOpen={showOutreachForm} onClose={() => { setShowOutreachForm(false); setEditingOutreachId(null) }} title={editingOutreachId ? 'Edit Outreach' : 'New Outreach'}>
                <div className="p-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-400 text-xs">Name</label>
                    <input value={outreachForm.name} onChange={e => setOutreachForm(p => ({ ...p, name: e.target.value }))} className="w-full mt-1 px-2 py-1.5 bg-brand-dark border border-white/10 rounded text-white text-sm outline-none focus:border-brand-accent/40" autoFocus />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs">Platform</label>
                    <select value={outreachForm.platform} onChange={e => setOutreachForm(p => ({ ...p, platform: e.target.value }))} className="w-full mt-1 px-2 py-1.5 bg-brand-dark border border-white/10 rounded text-white text-sm outline-none">
                      {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs">Handle</label>
                    <input value={outreachForm.handle} onChange={e => setOutreachForm(p => ({ ...p, handle: e.target.value }))} placeholder="@username" className="w-full mt-1 px-2 py-1.5 bg-brand-dark border border-white/10 rounded text-white text-sm outline-none focus:border-brand-accent/40" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs">Email</label>
                    <input type="email" value={outreachForm.email} onChange={e => setOutreachForm(p => ({ ...p, email: e.target.value }))} className="w-full mt-1 px-2 py-1.5 bg-brand-dark border border-white/10 rounded text-white text-sm outline-none focus:border-brand-accent/40" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs">Date Contacted</label>
                    <input type="date" value={outreachForm.date_contacted} onChange={e => setOutreachForm(p => ({ ...p, date_contacted: e.target.value }))} className="w-full mt-1 px-2 py-1.5 bg-brand-dark border border-white/10 rounded text-white text-sm outline-none" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs">Response</label>
                    <select value={outreachForm.response} onChange={e => setOutreachForm(p => ({ ...p, response: e.target.value }))} className="w-full mt-1 px-2 py-1.5 bg-brand-dark border border-white/10 rounded text-white text-sm outline-none">
                      {RESPONSES.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-gray-400 text-xs">Notes</label>
                    <textarea value={outreachForm.notes} onChange={e => setOutreachForm(p => ({ ...p, notes: e.target.value }))} rows={3} className="w-full mt-1 px-2 py-1.5 bg-brand-dark border border-white/10 rounded text-white text-sm outline-none resize-none focus:border-brand-accent/40" />
                  </div>
                  <div className="col-span-2 flex gap-2 mt-1">
                    <button onClick={submitOutreach} className="btn-primary px-4 py-1.5 rounded text-sm">{editingOutreachId ? 'Update' : 'Add'}</button>
                    <button onClick={() => { setShowOutreachForm(false); setEditingOutreachId(null) }} className="px-4 py-1.5 bg-white/10 text-gray-300 rounded text-sm hover:bg-white/20">Cancel</button>
                  </div>
                </div>
              </Modal>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <SortHeader label="Name" field="name" sort={outreachSort} setSort={setOutreachSort} />
                      <SortHeader label="Platform" field="platform" sort={outreachSort} setSort={setOutreachSort} />
                      <SortHeader label="Handle" field="handle" sort={outreachSort} setSort={setOutreachSort} />
                      <SortHeader label="Date" field="date_contacted" sort={outreachSort} setSort={setOutreachSort} />
                      <SortHeader label="Response" field="response" sort={outreachSort} setSort={setOutreachSort} />
                      <th className="text-left py-2 px-3 text-gray-400 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {oLoading ? (
                      <tr><td colSpan="6" className="text-center py-8 text-gray-600 text-sm">Loading...</td></tr>
                    ) : sortedOutreach.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-8 text-gray-500 text-sm">No outreach yet — click Add to get started</td></tr>
                    ) : sortedOutreach.map(item => (
                      <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-all" onClick={() => openEditOutreach(item)}>
                        <td className="py-2 px-3 text-white text-sm">
                          <span className="flex items-center">
                            {item.name}
                            {item.contacted && <span className="contacted-dot" title={`Contacted ${item.date_contacted}`} />}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-400 text-sm">{item.platform}</td>
                        <td className="py-2 px-3 text-sm">
                          <span className="text-brand-accent">{item.handle || item.email || '-'}</span>
                        </td>
                        <td className="py-2 px-3 text-gray-500 text-sm">{item.date_contacted}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-xs ${responseColor(item.response)}`}>{item.response || 'No response'}</span>
                        </td>
                        <td className="py-2 px-3" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1 items-center">
                            <button
                              onClick={() => toggleContacted(item.id)}
                              className={`p-1 rounded transition-all ${item.contacted ? 'text-orange-400 bg-orange-400/10' : 'text-gray-500 hover:bg-white/10'}`}
                              title="Mark contacted"
                            >
                              <Mail />
                            </button>
                            <button onClick={() => deleteContact(item.id)} className="p-1 text-gray-600 hover:text-red-400 hover:bg-white/10 rounded transition-all">
                              <X />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Affiliates Tab ── */}
          {tab === 'affiliates' && (
            <div>
              <div className="flex gap-2 mb-4">
                <button onClick={openAddAffiliate} className="btn-primary px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1">
                  <Plus /> Add
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white/5 p-3 rounded border border-white/10">
                  <div className="text-gray-500 text-xs">Affiliates</div>
                  <div className="text-xl font-bold text-brand-success">{affiliates.length}</div>
                </div>
                <div className="bg-white/5 p-3 rounded border border-white/10">
                  <div className="text-gray-500 text-xs">Total Sales</div>
                  <div className="text-xl font-bold text-brand-success">${totalSales.toFixed(2)}</div>
                </div>
                <div className="bg-white/5 p-3 rounded border border-white/10">
                  <div className="text-gray-500 text-xs">Commission</div>
                  <div className="text-xl font-bold text-brand-accent">${totalCommission.toFixed(2)}</div>
                </div>
              </div>

              {/* Add/Edit modal */}
              <Modal isOpen={showAffiliateForm} onClose={() => { setShowAffiliateForm(false); setEditingAffiliateId(null) }} title={editingAffiliateId ? 'Edit Affiliate' : 'New Affiliate'}>
                <div className="p-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-400 text-xs">Name</label>
                    <input value={affiliateForm.name} onChange={e => setAffiliateForm(p => ({ ...p, name: e.target.value }))} className="w-full mt-1 px-2 py-1.5 bg-brand-dark border border-white/10 rounded text-white text-sm outline-none focus:border-brand-accent/40" autoFocus />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs">Platform</label>
                    <select value={affiliateForm.platform} onChange={e => setAffiliateForm(p => ({ ...p, platform: e.target.value }))} className="w-full mt-1 px-2 py-1.5 bg-brand-dark border border-white/10 rounded text-white text-sm outline-none">
                      {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs">Handle</label>
                    <input value={affiliateForm.handle} onChange={e => setAffiliateForm(p => ({ ...p, handle: e.target.value }))} placeholder="@username" className="w-full mt-1 px-2 py-1.5 bg-brand-dark border border-white/10 rounded text-white text-sm outline-none focus:border-brand-accent/40" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs">Email</label>
                    <input type="email" value={affiliateForm.email} onChange={e => setAffiliateForm(p => ({ ...p, email: e.target.value }))} className="w-full mt-1 px-2 py-1.5 bg-brand-dark border border-white/10 rounded text-white text-sm outline-none focus:border-brand-accent/40" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs">Profile Link</label>
                    <input value={affiliateForm.link} onChange={e => setAffiliateForm(p => ({ ...p, link: e.target.value }))} placeholder="https://..." className="w-full mt-1 px-2 py-1.5 bg-brand-dark border border-white/10 rounded text-white text-sm outline-none focus:border-brand-accent/40" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs">Creator Code</label>
                    <input value={affiliateForm.code} onChange={e => setAffiliateForm(p => ({ ...p, code: e.target.value }))} className="w-full mt-1 px-2 py-1.5 bg-brand-dark border border-white/10 rounded text-white text-sm outline-none focus:border-brand-accent/40" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs">Date Joined</label>
                    <input type="date" value={affiliateForm.date_joined} onChange={e => setAffiliateForm(p => ({ ...p, date_joined: e.target.value }))} className="w-full mt-1 px-2 py-1.5 bg-brand-dark border border-white/10 rounded text-white text-sm outline-none" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs">Status</label>
                    <select value={affiliateForm.status} onChange={e => setAffiliateForm(p => ({ ...p, status: e.target.value }))} className="w-full mt-1 px-2 py-1.5 bg-brand-dark border border-white/10 rounded text-white text-sm outline-none">
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="bg-brand-success/10 border border-brand-success/30 rounded p-2">
                    <label className="text-brand-success text-xs font-medium">Total Sales ($)</label>
                    <input type="number" value={affiliateForm.total_sales} onChange={e => setAffiliateForm(p => ({ ...p, total_sales: e.target.value }))} className="w-full mt-1 px-2 py-1.5 bg-brand-dark border border-white/10 rounded text-white text-sm outline-none" />
                  </div>
                  <div className="bg-brand-accent/10 border border-brand-accent/30 rounded p-2">
                    <label className="text-brand-accent text-xs font-medium">Commission ($)</label>
                    <input type="number" value={affiliateForm.commission} onChange={e => setAffiliateForm(p => ({ ...p, commission: e.target.value }))} className="w-full mt-1 px-2 py-1.5 bg-brand-dark border border-white/10 rounded text-white text-sm outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-gray-400 text-xs">Payment Method</label>
                    <select value={affiliateForm.payment_method} onChange={e => setAffiliateForm(p => ({ ...p, payment_method: e.target.value }))} className="w-full mt-1 px-2 py-1.5 bg-brand-dark border border-white/10 rounded text-white text-sm outline-none">
                      {['PayPal', 'Venmo', 'CashApp', 'Bank Transfer', 'Check'].map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-gray-400 text-xs">Notes</label>
                    <textarea value={affiliateForm.notes} onChange={e => setAffiliateForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full mt-1 px-2 py-1.5 bg-brand-dark border border-white/10 rounded text-white text-sm outline-none resize-none" />
                  </div>
                  <div className="col-span-2 flex gap-2 mt-1">
                    <button onClick={submitAffiliate} className="btn-primary px-4 py-1.5 rounded text-sm">{editingAffiliateId ? 'Update' : 'Add'}</button>
                    <button onClick={() => { setShowAffiliateForm(false); setEditingAffiliateId(null) }} className="px-4 py-1.5 bg-white/10 text-gray-300 rounded text-sm hover:bg-white/20">Cancel</button>
                  </div>
                </div>
              </Modal>

              {/* Detail modal */}
              <Modal isOpen={!!selectedAffiliate} onClose={() => setSelectedAffiliate(null)} title="Affiliate Details">
                {selectedAffiliate && (
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div><span className="text-gray-500 text-xs">Name</span><p className="text-white text-sm mt-0.5">{selectedAffiliate.name}</p></div>
                      <div><span className="text-gray-500 text-xs">Platform</span><p className="text-white text-sm mt-0.5">{selectedAffiliate.platform}</p></div>
                      <div><span className="text-gray-500 text-xs">Handle</span><p className="text-white text-sm mt-0.5">{selectedAffiliate.handle || '-'}</p></div>
                      <div><span className="text-gray-500 text-xs">Email</span><p className="text-brand-accent text-sm mt-0.5">{selectedAffiliate.email || '-'}</p></div>
                      <div><span className="text-gray-500 text-xs">Code</span><p className="text-brand-success font-mono text-sm mt-0.5">{selectedAffiliate.code || '-'}</p></div>
                      <div><span className="text-gray-500 text-xs">Joined</span><p className="text-white text-sm mt-0.5">{selectedAffiliate.date_joined || '-'}</p></div>
                      <div><span className="text-gray-500 text-xs">Total Sales</span><p className="text-brand-success font-bold text-sm mt-0.5">${(parseFloat(selectedAffiliate.total_sales) || 0).toFixed(2)}</p></div>
                      <div><span className="text-gray-500 text-xs">Commission</span><p className="text-brand-accent font-bold text-sm mt-0.5">${(parseFloat(selectedAffiliate.commission) || 0).toFixed(2)}</p></div>
                      <div><span className="text-gray-500 text-xs">Status</span><div className="mt-0.5"><span className={`px-2 py-0.5 rounded text-xs ${statusColor(selectedAffiliate.status)}`}>{selectedAffiliate.status}</span></div></div>
                      <div><span className="text-gray-500 text-xs">Payment</span><p className="text-white text-sm mt-0.5">{selectedAffiliate.payment_method}</p></div>
                    </div>
                    {selectedAffiliate.notes && (
                      <div className="mb-4"><span className="text-gray-500 text-xs">Notes</span><p className="text-gray-300 bg-white/5 p-2 rounded mt-1 text-sm">{selectedAffiliate.notes}</p></div>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => openEditAffiliate(selectedAffiliate)} className="btn-primary px-3 py-1.5 rounded text-sm flex items-center gap-1"><Edit2 /> Edit</button>
                      <button onClick={() => { deleteAffiliate(selectedAffiliate.id); setSelectedAffiliate(null) }} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded text-sm flex items-center gap-1 hover:bg-red-500/30"><Trash /> Delete</button>
                    </div>
                  </div>
                )}
              </Modal>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <SortHeader label="Name" field="name" sort={affiliateSort} setSort={setAffiliateSort} />
                      <SortHeader label="Platform" field="platform" sort={affiliateSort} setSort={setAffiliateSort} />
                      <SortHeader label="Code" field="code" sort={affiliateSort} setSort={setAffiliateSort} />
                      <SortHeader label="Joined" field="date_joined" sort={affiliateSort} setSort={setAffiliateSort} />
                      <SortHeader label="Sales" field="total_sales" sort={affiliateSort} setSort={setAffiliateSort} />
                      <SortHeader label="Commission" field="commission" sort={affiliateSort} setSort={setAffiliateSort} />
                      <SortHeader label="Status" field="status" sort={affiliateSort} setSort={setAffiliateSort} />
                      <th className="text-left py-2 px-3 text-gray-400 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aLoading ? (
                      <tr><td colSpan="8" className="text-center py-8 text-gray-600 text-sm">Loading...</td></tr>
                    ) : sortedAffiliates.length === 0 ? (
                      <tr><td colSpan="8" className="text-center py-8 text-gray-500 text-sm">No affiliates yet — click Add to get started</td></tr>
                    ) : sortedAffiliates.map(item => (
                      <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-all" onClick={() => setSelectedAffiliate(item)}>
                        <td className="py-2 px-3 text-white text-sm">{item.name}</td>
                        <td className="py-2 px-3 text-gray-400 text-sm">{item.platform}</td>
                        <td className="py-2 px-3 text-brand-success font-mono text-sm">{item.code || '-'}</td>
                        <td className="py-2 px-3 text-gray-500 text-sm">{item.date_joined}</td>
                        {/* Inline-edit Total Sales */}
                        <td className="py-2 px-3 text-brand-success text-sm" onClick={e => { e.stopPropagation(); setInlineEdit({ id: item.id, field: 'total_sales', value: item.total_sales || 0 }) }}>
                          {inlineEdit?.id === item.id && inlineEdit?.field === 'total_sales' ? (
                            <input
                              type="number"
                              className="inline-edit-input text-brand-success"
                              value={inlineEdit.value}
                              autoFocus
                              onChange={e => setInlineEdit(p => ({ ...p, value: e.target.value }))}
                              onBlur={saveInlineEdit}
                              onKeyDown={e => { if (e.key === 'Enter') saveInlineEdit(); if (e.key === 'Escape') setInlineEdit(null) }}
                              onClick={e => e.stopPropagation()}
                            />
                          ) : (
                            <span className="clickable-number">${(parseFloat(item.total_sales) || 0).toFixed(2)}</span>
                          )}
                        </td>
                        {/* Inline-edit Commission */}
                        <td className="py-2 px-3 text-brand-accent text-sm" onClick={e => { e.stopPropagation(); setInlineEdit({ id: item.id, field: 'commission', value: item.commission || 0 }) }}>
                          {inlineEdit?.id === item.id && inlineEdit?.field === 'commission' ? (
                            <input
                              type="number"
                              className="inline-edit-input text-brand-accent"
                              value={inlineEdit.value}
                              autoFocus
                              onChange={e => setInlineEdit(p => ({ ...p, value: e.target.value }))}
                              onBlur={saveInlineEdit}
                              onKeyDown={e => { if (e.key === 'Enter') saveInlineEdit(); if (e.key === 'Escape') setInlineEdit(null) }}
                              onClick={e => e.stopPropagation()}
                            />
                          ) : (
                            <span className="clickable-number">${(parseFloat(item.commission) || 0).toFixed(2)}</span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-xs ${statusColor(item.status)}`}>{item.status}</span>
                        </td>
                        <td className="py-2 px-3" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1">
                            <button onClick={() => openEditAffiliate(item)} className="p-1 text-brand-accent hover:bg-white/10 rounded transition-all"><Edit2 /></button>
                            <button onClick={() => deleteAffiliate(item.id)} className="p-1 text-gray-600 hover:text-red-400 hover:bg-white/10 rounded transition-all"><X /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
