// v3
import { useState, useMemo, useEffect } from "react";

const CATEGORIES = ["Flights", "Accommodation", "Food & Drink", "Transport", "Activities & Tours"];
const CURRENCIES = ["USD", "EUR", "CRC"];
const CURRENCY_SYMBOLS = { USD: "$", EUR: "€", CRC: "₡" };
const CATEGORY_ICONS = { "Flights": "✈️", "Accommodation": "🏨", "Food & Drink": "🍽️", "Transport": "🚗", "Activities & Tours": "🎭" };
const CATEGORY_COLORS = { "Flights": "#4ecdc4", "Accommodation": "#a8e6cf", "Food & Drink": "#ffd93d", "Transport": "#6bcbf5", "Activities & Tours": "#ff9a8b" };

const today = () => new Date().toISOString().split("T")[0];
const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
const fmt = (amount, currency) => `${CURRENCY_SYMBOLS[currency]}${amount.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const load = (key, fallback) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };

export default function App() {
  const [tab, setTab] = useState("add");
  const [expenses, setExpenses] = useState(() => load("cr_expenses", []));
  const [travellers, setTravellers] = useState(() => load("cr_travellers", ["Traveller 1", "Traveller 2", "Traveller 3"]));
  const [places, setPlaces] = useState(() => load("cr_places", ["San José", "Tamarindo", "Monteverde"]));
  const [editingTravellers, setEditingTravellers] = useState(false);
  const [editingPlaces, setEditingPlaces] = useState(false);
  const [travCount, setTravCount] = useState(() => load("cr_travellers", ["Traveller 1", "Traveller 2", "Traveller 3"]).length);
  const [tempTravellers, setTempTravellers] = useState(() => load("cr_travellers", ["Traveller 1", "Traveller 2", "Traveller 3"]));
  const [tempPlaces, setTempPlaces] = useState(() => load("cr_places", ["San José", "Tamarindo", "Monteverde"]));
  const [form, setForm] = useState({ description: "", amount: "", currency: "USD", category: "Food & Drink", place: "", paidBy: "", splitWith: [], date: today() });

  useEffect(() => save("cr_expenses", expenses), [expenses]);
  useEffect(() => save("cr_travellers", travellers), [travellers]);
  useEffect(() => save("cr_places", places), [places]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const toggleSplit = (name) => set("splitWith", form.splitWith.includes(name) ? form.splitWith.filter(x => x !== name) : [...form.splitWith, name]);

  const handleAdd = () => {
    if (!form.amount || !form.description || !form.paidBy || form.splitWith.length === 0) return;
    setExpenses(prev => [{ ...form, amount: parseFloat(form.amount), id: Date.now() }, ...prev]);
    setForm(f => ({ ...f, description: "", amount: "", splitWith: [], date: today() }));
  };

  const categoryTotals = useMemo(() => {
    const t = {}; CATEGORIES.forEach(c => { t[c] = {}; CURRENCIES.forEach(cur => { t[c][cur] = 0; }); });
    expenses.forEach(e => { t[e.category][e.currency] += e.amount; }); return t;
  }, [expenses]);

  const grandTotals = useMemo(() => {
    const t = {}; CURRENCIES.forEach(c => { t[c] = 0; });
    expenses.forEach(e => { t[e.currency] += e.amount; }); return t;
  }, [expenses]);

  const splitSummary = useMemo(() => {
    const b = {}; travellers.forEach(t => { b[t] = { paid: {}, owes: {} }; });
    expenses.forEach(e => {
      const share = e.amount / e.splitWith.length;
      if (b[e.paidBy]) b[e.paidBy].paid[e.currency] = (b[e.paidBy].paid[e.currency] || 0) + e.amount;
      e.splitWith.forEach(t => { if (b[t]) b[t].owes[e.currency] = (b[t].owes[e.currency] || 0) + share; });
    });
    return travellers.map(t => ({ name: t, paid: b[t]?.paid || {}, owes: b[t]?.owes || {} }));
  }, [expenses, travellers]);

  return (
    <div style={{ fontFamily: "'Sora', sans-serif", minHeight: "100vh", background: "linear-gradient(160deg, #071e2e 0%, #0a2d3d 45%, #083328 100%)", color: "#e8f8f5", position: "relative", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .orb1 { position: fixed; width: 340px; height: 340px; border-radius: 50%; background: radial-gradient(circle, rgba(78,205,196,0.13) 0%, transparent 70%); top: -80px; right: -80px; pointer-events: none; z-index: 0; }
        .orb2 { position: fixed; width: 280px; height: 280px; border-radius: 50%; background: radial-gradient(circle, rgba(107,203,245,0.09) 0%, transparent 70%); bottom: 100px; left: -80px; pointer-events: none; z-index: 0; }
        .orb3 { position: fixed; width: 200px; height: 200px; border-radius: 50%; background: radial-gradient(circle, rgba(168,230,207,0.08) 0%, transparent 70%); top: 45%; right: 10%; pointer-events: none; z-index: 0; }
        .glass { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
        .glass-strong { background: rgba(255,255,255,0.11); border: 1px solid rgba(255,255,255,0.16); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
        .card { border-radius: 18px; padding: 20px; margin-bottom: 14px; position: relative; z-index: 1; }
        .tab-bar { display: flex; position: sticky; top: 0; z-index: 20; background: rgba(7,30,46,0.75); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.08); }
        .tab-btn { flex: 1; background: none; border: none; border-bottom: 2px solid transparent; padding: 14px 6px; font-size: 10px; letter-spacing: 1.8px; text-transform: uppercase; cursor: pointer; color: rgba(232,248,245,0.35); transition: all 0.2s; font-family: 'Sora', sans-serif; font-weight: 600; }
        .tab-btn.active { color: #4ecdc4; border-bottom-color: #4ecdc4; }
        .tab-btn:hover { color: rgba(78,205,196,0.7); }
        .input-field { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 11px 14px; color: #e8f8f5; font-size: 14px; font-family: 'Sora', sans-serif; width: 100%; outline: none; transition: all 0.2s; appearance: none; }
        .input-field::placeholder { color: rgba(232,248,245,0.28); }
        .input-field:focus { border-color: #4ecdc4; background: rgba(78,205,196,0.08); box-shadow: 0 0 0 3px rgba(78,205,196,0.1); }
        .input-field option { background: #0a2d3d; color: #e8f8f5; }
        .btn-primary { background: linear-gradient(135deg, #4ecdc4, #38b5ad); color: #071e2e; border: none; border-radius: 10px; padding: 13px 24px; font-weight: 700; font-size: 14px; font-family: 'Sora', sans-serif; cursor: pointer; width: 100%; transition: all 0.2s; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(78,205,196,0.3); }
        .btn-sm { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12); color: rgba(232,248,245,0.6); border-radius: 8px; padding: 7px 13px; font-size: 12px; font-family: 'Sora', sans-serif; cursor: pointer; transition: all 0.2s; }
        .btn-sm:hover, .btn-sm.active-sm { border-color: #4ecdc4; color: #4ecdc4; background: rgba(78,205,196,0.1); }
        .chip { display: inline-flex; align-items: center; padding: 6px 14px; border-radius: 20px; font-size: 12px; cursor: pointer; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.05); color: rgba(232,248,245,0.5); transition: all 0.2s; margin: 3px; font-family: 'Sora', sans-serif; font-weight: 500; }
        .chip.selected { background: rgba(78,205,196,0.15); border-color: #4ecdc4; color: #4ecdc4; font-weight: 600; }
        .chip:hover { border-color: rgba(78,205,196,0.5); color: rgba(78,205,196,0.8); }
        .label { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(232,248,245,0.35); margin-bottom: 7px; font-weight: 600; }
        .divider { height: 1px; background: rgba(255,255,255,0.08); margin: 16px 0; }
        .expense-row { padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; gap: 14px; align-items: flex-start; }
        .expense-row:last-child { border-bottom: none; }
        .delete-btn { background: none; border: none; color: rgba(255,255,255,0.2); cursor: pointer; padding: 5px 8px; border-radius: 7px; font-size: 13px; transition: all 0.2s; line-height: 1; }
        .delete-btn:hover { color: #ff9a8b; background: rgba(255,154,139,0.1); }
        .progress-bar { height: 3px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden; margin-top: 7px; }
        .progress-fill { height: 100%; border-radius: 2px; transition: width 0.5s; }
        .net-pos { color: #a8e6cf; } .net-neg { color: #ff9a8b; } .net-zero { color: rgba(232,248,245,0.3); }
        .amt { font-size: 22px; font-weight: 800; line-height: 1; }
        .heading { font-size: 24px; font-weight: 800; }
        .scan-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 13px; border-radius: 10px; border: 1.5px dashed rgba(78,205,196,0.4); background: rgba(78,205,196,0.05); color: #4ecdc4; font-size: 14px; font-weight: 600; font-family: 'Sora', sans-serif; cursor: pointer; transition: all 0.2s; margin-bottom: 14px; }
        .scan-btn:hover { border-color: #4ecdc4; background: rgba(78,205,196,0.1); }
        .scan-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .spinner { width: 16px; height: 16px; border: 2px solid rgba(78,205,196,0.3); border-top-color: #4ecdc4; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .confidence-high { color: #a8e6cf; } .confidence-medium { color: #ffd93d; } .confidence-low { color: #ff9a8b; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); }
        ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(78,205,196,0.2); border-radius: 2px; }
      `}</style>

      <div className="orb1" /><div className="orb2" /><div className="orb3" />

      {/* Header */}
      <div style={{ padding: "32px 20px 26px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: "rgba(78,205,196,0.7)", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>🌊 Costa Rica</div>
          <h1 style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.05, marginBottom: 6, letterSpacing: "-0.5px" }}>Trip Tracker</h1>
          <p style={{ fontSize: 13, color: "rgba(232,248,245,0.4)", marginBottom: 20, fontWeight: 300 }}>
            {travellers.length} travellers · {places.length} places · {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
          </p>
          {expenses.length > 0 && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {CURRENCIES.map(cur => grandTotals[cur] > 0 && (
                <div key={cur} className="glass" style={{ borderRadius: 12, padding: "10px 16px" }}>
                  <div style={{ fontSize: 10, color: "rgba(78,205,196,0.6)", letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600, marginBottom: 2 }}>{cur}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#4ecdc4" }}>{fmt(grandTotals[cur], cur)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {[["add","Add"], ["expenses","Log"], ["summary","Summary"], ["split","Split"]].map(([key, label]) => (
          <button key={key} className={`tab-btn ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      <div style={{ padding: "20px 16px 80px", maxWidth: 500, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* ─── ADD ─── */}
        {tab === "add" && (<>
          {/* Setup */}
          <div className="card glass" style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(232,248,245,0.5)" }}>Trip Setup</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button className={`btn-sm ${editingTravellers ? "active-sm" : ""}`}
                  onClick={() => { setTempTravellers([...travellers]); setEditingTravellers(v => !v); setEditingPlaces(false); }}>Travellers</button>
                <button className={`btn-sm ${editingPlaces ? "active-sm" : ""}`}
                  onClick={() => { setTempPlaces([...places]); setEditingPlaces(v => !v); setEditingTravellers(false); }}>Places</button>
              </div>
            </div>

            {editingTravellers && (<div style={{ marginTop: 16 }}>
              <div className="label">Number of travellers</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {[2,3,4].map(n => <button key={n} className={`chip ${travCount === n ? "selected" : ""}`} onClick={() => { setTravCount(n); setTempTravellers(Array.from({ length: n }, (_, i) => tempTravellers[i] || `Traveller ${i+1}`)); }}>{n} people</button>)}
              </div>
              {Array.from({ length: travCount }).map((_, i) => (
                <input key={i} className="input-field" style={{ marginBottom: 8 }} placeholder={`Traveller ${i+1}`}
                  value={tempTravellers[i] || ""} onChange={e => { const a = [...tempTravellers]; a[i] = e.target.value; setTempTravellers(a); }} />
              ))}
              <button className="btn-primary" style={{ marginTop: 4 }} onClick={() => { const t = tempTravellers.slice(0, travCount).map(t => t || "Traveller"); setTravellers(t); setEditingTravellers(false); setForm(f => ({ ...f, paidBy: "", splitWith: [] })); }}>Save Travellers</button>
            </div>)}

            {editingPlaces && (<div style={{ marginTop: 16 }}>
              <div className="label">Places</div>
              {tempPlaces.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input className="input-field" placeholder={`Place ${i+1}`} value={p}
                    onChange={e => { const a = [...tempPlaces]; a[i] = e.target.value; setTempPlaces(a); }} />
                  {tempPlaces.length > 1 && <button className="delete-btn" onClick={() => setTempPlaces(tempPlaces.filter((_,j) => j !== i))}>✕</button>}
                </div>
              ))}
              <button className="btn-sm" onClick={() => setTempPlaces([...tempPlaces, ""])}>+ Add place</button>
              <button className="btn-primary" style={{ marginTop: 10 }} onClick={() => { setPlaces(tempPlaces.filter(p => p.trim())); setEditingPlaces(false); }}>Save Places</button>
            </div>)}
          </div>

          {/* Form */}
          <div className="card glass-strong">
            <div className="heading" style={{ marginBottom: 20 }}>New Expense</div>


            {/* Description */}
            <div className="label">Description</div>
            <input className="input-field" style={{ marginBottom: 14 }} placeholder="e.g. Surf lesson, beach dinner…"
              value={form.description} onChange={e => set("description", e.target.value)} />

            {/* Amount + Currency */}
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1.4 }}>
                <div className="label">Amount</div>
                <input type="number" className="input-field" placeholder="0.00" min="0" step="0.01"
                  value={form.amount} onChange={e => set("amount", e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="label">Currency</div>
                <select className="input-field" value={form.currency} onChange={e => set("currency", e.target.value)}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{CURRENCY_SYMBOLS[c]} {c}</option>)}
                </select>
              </div>
            </div>

            {/* Date — full width, then Place full width below */}
            <div className="label">Date</div>
            <input type="date" className="input-field" style={{ marginBottom: 14 }} value={form.date} onChange={e => set("date", e.target.value)} />

            <div className="label">Place</div>
            <select className="input-field" style={{ marginBottom: 14 }} value={form.place} onChange={e => set("place", e.target.value)}>
              <option value="">— Select place —</option>
              {places.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            {/* Category */}
            <div className="label">Category</div>
            <select className="input-field" style={{ marginBottom: 14 }} value={form.category} onChange={e => set("category", e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
            </select>

            <div className="divider" />

            {/* Paid by */}
            <div className="label">Paid by</div>
            <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 14 }}>
              {travellers.map(t => <button key={t} className={`chip ${form.paidBy === t ? "selected" : ""}`} onClick={() => set("paidBy", form.paidBy === t ? "" : t)}>{t}</button>)}
            </div>

            {/* Split with */}
            <div className="label">Split with</div>
            <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 10 }}>
              <button className="chip" onClick={() => set("splitWith", [...travellers])}>All</button>
              {travellers.map(t => <button key={t} className={`chip ${form.splitWith.includes(t) ? "selected" : ""}`} onClick={() => toggleSplit(t)}>{t}</button>)}
            </div>

            {form.amount && form.splitWith.length > 0 && (
              <div style={{ fontSize: 12, color: "rgba(78,205,196,0.7)", marginBottom: 14, padding: "9px 13px", background: "rgba(78,205,196,0.07)", borderRadius: 8, border: "1px solid rgba(78,205,196,0.15)" }}>
                {fmt(parseFloat(form.amount || 0) / form.splitWith.length, form.currency)} per person
              </div>
            )}

            <button className="btn-primary" onClick={handleAdd}>Add Expense</button>
          </div>
        </>)}

        {/* ─── LOG ─── */}
        {tab === "expenses" && (<>
          <div className="heading" style={{ marginBottom: 14 }}>{expenses.length} Expense{expenses.length !== 1 ? "s" : ""}</div>
          {expenses.length === 0 ? (
            <div className="card glass" style={{ textAlign: "center", padding: "52px 20px", color: "rgba(232,248,245,0.25)" }}>
              <div style={{ fontSize: 38, marginBottom: 12 }}>🧾</div>
              <p style={{ fontSize: 14, fontWeight: 300 }}>No expenses yet</p>
            </div>
          ) : (
            <div className="card glass" style={{ padding: "4px 20px" }}>
              {expenses.map(e => (
                <div key={e.id} className="expense-row">
                  <div style={{ fontSize: 20, paddingTop: 3, lineHeight: 1 }}>{CATEGORY_ICONS[e.category]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1, paddingRight: 10 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{e.description}</div>
                        <div style={{ fontSize: 11, color: "rgba(232,248,245,0.35)", marginTop: 3 }}>
                          {fmtDate(e.date)}{e.place ? ` · ${e.place}` : ""} · {e.paidBy}
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(232,248,245,0.25)", marginTop: 2 }}>Split: {e.splitWith.join(", ")}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ textAlign: "right" }}>
                          <div className="amt" style={{ color: "#4ecdc4" }}>{fmt(e.amount, e.currency)}</div>
                          <div style={{ fontSize: 10, color: "rgba(232,248,245,0.3)", letterSpacing: 1, textTransform: "uppercase" }}>{e.currency}</div>
                        </div>
                        <button className="delete-btn" onClick={() => setExpenses(prev => prev.filter(x => x.id !== e.id))}>✕</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>)}

        {/* ─── SUMMARY ─── */}
        {tab === "summary" && (<>
          <div className="heading" style={{ marginBottom: 14 }}>By Category</div>
          {expenses.length === 0 ? (
            <div className="card glass" style={{ textAlign: "center", padding: "52px 20px", color: "rgba(232,248,245,0.25)" }}>
              <div style={{ fontSize: 38, marginBottom: 12 }}>📊</div>
              <p style={{ fontSize: 14, fontWeight: 300 }}>Add expenses to see a summary</p>
            </div>
          ) : CATEGORIES.map(cat => {
            const totals = categoryTotals[cat];
            if (!CURRENCIES.some(c => totals[c] > 0)) return null;
            return (
              <div key={cat} className="card glass">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 20 }}>{CATEGORY_ICONS[cat]}</span>
                  <span style={{ fontWeight: 700, fontSize: 17 }}>{cat}</span>
                </div>
                {CURRENCIES.map(cur => totals[cur] > 0 && (
                  <div key={cur} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "rgba(232,248,245,0.35)" }}>{cur}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: CATEGORY_COLORS[cat] }}>{fmt(totals[cur], cur)}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: grandTotals[cur] > 0 ? `${(totals[cur] / grandTotals[cur]) * 100}%` : "0%", background: CATEGORY_COLORS[cat] }} />
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </>)}

        {/* ─── SPLIT ─── */}
        {tab === "split" && (<>
          <div className="heading" style={{ marginBottom: 4 }}>Cost Split</div>
          <p style={{ fontSize: 13, color: "rgba(232,248,245,0.35)", marginBottom: 16, fontWeight: 300 }}>Paid vs. share owed per person</p>
          {splitSummary.map(({ name, paid, owes }) => {
            const currencies = [...new Set([...Object.keys(paid), ...Object.keys(owes)])];
            return (
              <div key={name} className="card glass">
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: currencies.length ? 14 : 0 }}>{name}</div>
                {currencies.length === 0
                  ? <p style={{ fontSize: 13, color: "rgba(232,248,245,0.25)", fontWeight: 300 }}>No expenses</p>
                  : currencies.map(cur => {
                    const p = paid[cur] || 0, o = owes[cur] || 0, net = p - o;
                    return (
                      <div key={cur} style={{ marginBottom: 10, padding: "13px 15px", background: "rgba(255,255,255,0.05)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)" }}>
                        <div className="label" style={{ marginBottom: 10 }}>{cur}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 13, color: "rgba(232,248,245,0.45)" }}>Paid</span>
                          <span style={{ fontWeight: 600, fontSize: 14, color: "#a8e6cf" }}>{fmt(p, cur)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                          <span style={{ fontSize: 13, color: "rgba(232,248,245,0.45)" }}>Share owed</span>
                          <span style={{ fontWeight: 600, fontSize: 14, color: "#ff9a8b" }}>{fmt(o, cur)}</span>
                        </div>
                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                          <span style={{ fontSize: 10, color: "rgba(232,248,245,0.3)", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 }}>Net</span>
                          <div style={{ textAlign: "right" }}>
                            <span className={`amt ${net > 0 ? "net-pos" : net < 0 ? "net-neg" : "net-zero"}`}>{net > 0 ? "+" : ""}{fmt(net, cur)}</span>
                            <div style={{ fontSize: 10, color: "rgba(232,248,245,0.25)", marginTop: 2 }}>{net > 0 ? "to receive" : net < 0 ? "to pay" : "settled"}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </>)}
      </div>
    </div>
  );
}
