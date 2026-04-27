/* eslint-disable react/prop-types */
import { useState } from 'react'
import { supabase } from '../lib/supabase'

// ── Desktop data extracted directly from the Electron app ──────────────────
const DESKTOP_TASKS = [{"id":1769569800487,"category":"Website","text":"Fix Product page","completed":false,"files":[],"notes":"","completedAt":"2026-01-29T03:56:02.490Z","hidden":true},{"id":1769530122367,"category":"Website","text":"Make review numbers make sense","completed":false,"files":[],"notes":"","completedAt":"2026-01-29T03:56:08.164Z","hidden":true},{"id":1769569780281,"category":"Website","text":"Connect to ESL bank","completed":false,"files":[],"notes":"","completedAt":"2026-01-29T03:56:12.225Z","hidden":true},{"id":1769569807112,"category":"Website","text":"Remove Powered from Shopify footer","completed":false,"files":[],"notes":"","hidden":false,"completedAt":"2026-01-29T12:38:21.817Z"},{"id":1769888261120,"category":"Website","text":"Fix product page reviews","completed":false,"files":[],"notes":""},{"id":1769991027909,"category":"Website","text":"Connect Bank","completed":false,"files":[],"notes":""},{"id":1771275783778,"category":"Fundamental","text":"Article: Black ND Subvectors of Supremacy","completed":true,"files":[],"notes":"Host on Marcelshorter.com","completedAt":"2026-04-07T13:01:31.998Z","hidden":true},{"id":1771275797048,"category":"Fundamental","text":"Article 1","completed":true,"files":[],"notes":"","completedAt":"2026-04-07T12:59:04.353Z","hidden":true},{"id":1771275900327,"category":"Fundamental","text":"Develop Body Oil and Lip Balm","completed":true,"files":[],"notes":"","hidden":true,"completedAt":"2026-04-15T16:08:20.762Z"},{"id":1771276035521,"category":"Fundamental","text":"REFINE FORMULAS WITH GEMINI AND CLAUDE","completed":true,"files":[],"notes":"","hidden":true,"completedAt":"2026-04-07T13:01:31.367Z"},{"id":1775566814432,"category":"Fundamental","text":"Write 3 Wellness Articles","completed":false,"files":[],"notes":""},{"id":1775566879391,"category":"Fundamental","text":"Reformulate Deodorant","completed":true,"files":[],"notes":"","hidden":true,"completedAt":"2026-04-07T15:21:37.754Z"},{"id":1775575304757,"category":"Fundamental","text":"Redesign Moisturizer","completed":true,"files":[],"notes":"","completedAt":"2026-04-07T15:21:52.529Z","hidden":true},{"id":1775575310296,"category":"Fundamental","text":"Redesign body oil","completed":true,"files":[],"notes":"","completedAt":"2026-04-07T15:21:53.433Z","hidden":true}]

const DESKTOP_CATEGORY_ORDER = ["Fundamental","Website"]

const DESKTOP_NOTEPAD = `Premium-Weight Polymer

Fundamental goal : Partnership Targeting - Only Means of development, **Network Nodes** based growth - Grow like Mold

Develop Wellness Blog Attached to Marcelshorter.com, have political part be a side section

Redesign Deodorant to make it white, update body oil and moisturizer

It is the most pressing issue, the products mean nothing, the strategy means nothing, only the big moment does, stories and backgrounds can be fabricated, they don't matter. Someone could have 0 sales or 1,000, they can say whatever they want. All that matters is it looks good, is believable, products are good, and a partner with reach pushes them. There is no growth before that considering the type of product this is.

Redo Pricing:
Deodorant - 26
Moisturizer- 39
Body oil - 46
Collection - 98-100
Free Shipping over $50

Odorize the transaction. Include a small scent strip of the Madagascan vanilla in every piece of physical mail you send.

Deploy loss aversion. Instead of "get 20% off your first order," try "your $5 credit expires in 7 days."

"Make the switch" - corresponds to my original ideas for branding, completely replacing your routines

Get articles authored, get to the people who matter, use those connections to push the company.

Overdevelopment, Overdelivery

For emails Ideal is a Girl name emailing, pointing to Marcel Shorter, as the man in the Background.

Call myself Founder, Creative Director`

const DESKTOP_OUTREACH = [{"name":"test","platform":"Instagram","handle":"icle","email":"","dateContacted":"2026-01-27","response":"No response","notes":""},{"name":"Busola","platform":"Instagram","handle":"@_beautywithb_","email":"beautywithb@gmail.com","dateContacted":"","response":"","notes":"ESTHETICIAN. #1 Pick for Trust. Her professional status validates 'clean' ingredients."},{"name":"Lindsay Gallimore","platform":"Instagram","handle":"@mamanloupsden","email":"","dateContacted":"","response":"","notes":"ECO-EXPERT. Audience specifically follows for 'toxin-free' & 'green' product reviews. Contact via DM/Blog."},{"name":"Digital Jada","platform":"Instagram","handle":"@digitaljada","email":"info@digitaljada.com","dateContacted":"","response":"","notes":"FITNESS/PERFORMANCE. Ideal for a 'sweat test' campaign. Proves natural deodorant actually works during workouts."},{"name":"Grace McGrand","platform":"Instagram","handle":"@gracemcgrand","email":"gracemcgrand@hotmail.co.uk","dateContacted":"","response":"","notes":"NATURAL LIFESTYLE. Her brand is 100% built on 'natural' (hair & body). Audience is pre-sold on non-synthetic products."},{"name":"Marissa, MD","platform":"Instagram","handle":"@_marissamd","email":"","dateContacted":"","response":"","notes":"DERMATOLOGY RESIDENT. Medical authority. A simple 'approved' Story from her kills objection handling about safety/efficacy."},{"name":"Jo Marie B","platform":"Instagram","handle":"@jomarieeb","email":"contact@jomarieeb.co.uk","dateContacted":"","response":"","notes":"MOM WELLNESS. High conversion for 'Safety'. Moms buy toxin-free body care for themselves and kids."},{"name":"Lydia Hall","platform":"Instagram","handle":"@thelydiahall","email":"","dateContacted":"","response":"","notes":"SKINCARE HACKS. Best for 'Problem/Solution' content. High save rates on her posts."},{"name":"Elise Augustin","platform":"Instagram","handle":"@lumi_lise","email":"elise@lumilise.co.uk","dateContacted":"","response":"","notes":"HOLISTIC WELLNESS. Excellent for 'Premium/Spa' positioning of the brand. Visuals are high quality."},{"name":"Kikie Omar","platform":"Instagram","handle":"@kikie_omar","email":"kikieomar@gmail.com","dateContacted":"","response":"","notes":"TEXTURE/UGC. Best for showing product consistency (creamy, non-greasy). Great for ads."},{"name":"Emerald Hill Rice","platform":"Instagram","handle":"@emmyrice","email":"","dateContacted":"","response":"","notes":"HOLISTIC MOM/DOULA. Very niche, very high trust. If she recommends a 'pure' product, her community buys immediately."},{"name":"Ashley Tolliver","platform":"Instagram","handle":"@beautybandit_ashley","email":"","dateContacted":"","response":"","notes":"ESTHETICIAN/MUA. Another expert voice. Good for differentiating Beyondpure from generic drugstore brands."},{"name":"Braid","platform":"Instagram","handle":"@braid_itsme","email":"braid.collabs@gmail.com","dateContacted":"","response":"","notes":"VLOG/ROUTINE. Best for 'Day in the Life' integration. Shows the product lasting all day."},{"name":"Aly","platform":"Instagram","handle":"@thealyf","email":"","dateContacted":"","response":"","notes":"LIFESTYLE/BEAUTY. Strong personal brand presence."}]

const DESKTOP_AFFILIATES = [{"name":"Test Man","platform":"Instagram","handle":"@testman","email":"test@gmail.com","link":"","code":"TEST20","dateJoined":"2026-01-28","totalSales":30,"commission":10,"status":"Pending","paymentMethod":"PayPal","notes":"The Goat\n"}]

const DESKTOP_FORMULAS = [{"id":1769661540471,"name":"Deodorant","ingredients":[{"id":1769699852950.6865,"name":"Beeswax","quantity":"15","unit":"g","costPerUnit":"0.08","link":"","notes":"Organic","cost":"1","amount":"10g"},{"id":1769699852950.3843,"name":"Coconut Oil","quantity":"39","unit":"g","costPerUnit":"0.04","link":"https://kirkland.com","notes":"Refined"},{"id":1769699852950.8728,"name":"Arrowroot Powder","quantity":"60","unit":"g","costPerUnit":"0.02","link":"","notes":"or Tapioca"},{"id":1769699852950.8677,"name":"Magnesium Hydroxide","quantity":"12","unit":"g","costPerUnit":"0.06","link":"https://amazon.com","notes":"1lb bag"},{"id":1769699852950.502,"name":"Baking Soda","quantity":"12","unit":"g","costPerUnit":"0.02","link":"https://bobsredmill.com","notes":"Fine grain"},{"id":1769699852950.6982,"name":"Lemongrass EO","quantity":"12","unit":"g","costPerUnit":"0.15","link":"https://edenbotanicals.com","notes":""},{"id":1769699852950.558,"name":"Bergamot EO","quantity":"6","unit":"g","costPerUnit":"0.18","link":"https://edenbotanicals.com","notes":""},{"id":1769702780900,"name":"Jojoba Oil","cost":""}],"targetCost":"","targetMargin":"","notes":"- Beeswax: 15g (9.3%)\n- Jojoba Oil (Golden or Clear): 22.5g (14.0%)\n- Coconut Oil (Refined): 39g (24.2%)\n- Arrowroot/Tapioca: 60g (37.3%)\n- Magnesium Hydroxide: 12g (7.5%)\n- Baking Soda: 12g (7.5%)\n- Lemongrass: 12 drops\n- Bergamot: 6 drops\n- Vanilla bean: .5","createdAt":"2026-01-29T04:39:00.471Z"},{"id":1769700657083,"name":"Moisturizer","ingredients":[],"targetCost":"","targetMargin":"","notes":"","createdAt":"2026-01-29T15:30:57.083Z"},{"id":1769700685615,"name":"Body Oil","ingredients":[],"targetCost":"","targetMargin":"","notes":"","createdAt":"2026-01-29T15:31:25.615Z"}]

// ── transform helpers ───────────────────────────────────────────────────────
function transformTasks(userId) {
  return DESKTOP_TASKS.map((t, i) => ({
    user_id: userId,
    category: t.category || 'General',
    text: t.text,
    completed: t.completed || false,
    hidden: t.hidden || false,
    completed_at: t.completedAt || null,
    notes: t.notes || '',
    files: t.files || [],
    sort_order: i,
  }))
}

function transformOutreach(userId) {
  return DESKTOP_OUTREACH.map(o => ({
    user_id: userId,
    name: o.name,
    platform: o.platform || '',
    handle: o.handle || '',
    email: o.email || '',
    date_contacted: o.dateContacted || null,
    response: o.response || 'No response',
    contacted: false,
    notes: o.notes || '',
  }))
}

function transformAffiliates(userId) {
  return DESKTOP_AFFILIATES.map(a => ({
    user_id: userId,
    name: a.name,
    platform: a.platform || '',
    handle: a.handle || '',
    email: a.email || '',
    link: a.link || '',
    code: a.code || '',
    date_joined: a.dateJoined || null,
    total_sales: a.totalSales || 0,
    commission: a.commission || 0,
    status: a.status || 'Active',
    payment_method: a.paymentMethod || '',
    notes: a.notes || '',
  }))
}

function transformFormulas(userId) {
  return DESKTOP_FORMULAS.map(f => ({
    user_id: userId,
    name: f.name,
    ingredients: (f.ingredients || []).map(ing => ({
      id: crypto.randomUUID(),
      name: ing.name || '',
      amount: ing.amount || (ing.quantity && ing.unit ? `${ing.quantity}${ing.unit}` : ing.quantity || ''),
      cost: ing.cost || (ing.quantity && ing.costPerUnit ? (parseFloat(ing.quantity) * parseFloat(ing.costPerUnit)).toFixed(2) : ''),
      ratio: '',
      includeInRatio: true,
    })),
    target_cost: f.targetCost || '',
    target_margin: f.targetMargin || '',
    notes: f.notes || '',
  }))
}

// ── component ───────────────────────────────────────────────────────────────
export default function Migrate({ userId }) {
  const [status, setStatus] = useState({})
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)

  function log(key, msg, ok = true) {
    setStatus(s => ({ ...s, [key]: { msg, ok } }))
  }

  async function runMigration() {
    setRunning(true)
    setStatus({})

    try {
      // 1. Tasks
      log('tasks', 'Importing tasks...')
      const tasks = transformTasks(userId)
      const { error: tErr } = await supabase.from('tasks').insert(tasks)
      if (tErr) log('tasks', `Tasks: ❌ ${tErr.message}`, false)
      else log('tasks', `✅ ${tasks.length} tasks imported`)

      // 2. Category order
      log('cats', 'Importing category order...')
      const { error: cErr } = await supabase.from('category_order').upsert({
        user_id: userId,
        order_list: DESKTOP_CATEGORY_ORDER,
      }, { onConflict: 'user_id' })
      if (cErr) log('cats', `Category order: ❌ ${cErr.message}`, false)
      else log('cats', '✅ Category order imported')

      // 3. Notepad
      log('notepad', 'Importing notepad...')
      const { error: nErr } = await supabase.from('notepad').upsert({
        user_id: userId,
        content: DESKTOP_NOTEPAD,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      if (nErr) log('notepad', `Notepad: ❌ ${nErr.message}`, false)
      else log('notepad', '✅ Notepad imported')

      // 4. Outreach
      log('outreach', 'Importing outreach...')
      const outreach = transformOutreach(userId)
      const { error: oErr } = await supabase.from('outreach').insert(outreach)
      if (oErr) log('outreach', `Outreach: ❌ ${oErr.message}`, false)
      else log('outreach', `✅ ${outreach.length} contacts imported`)

      // 5. Affiliates
      log('affiliates', 'Importing affiliates...')
      const affiliates = transformAffiliates(userId)
      const { error: aErr } = await supabase.from('affiliates').insert(affiliates)
      if (aErr) log('affiliates', `Affiliates: ❌ ${aErr.message}`, false)
      else log('affiliates', `✅ ${affiliates.length} affiliates imported`)

      // 6. Formulas
      log('formulas', 'Importing formulas...')
      const formulas = transformFormulas(userId)
      const { error: fErr } = await supabase.from('formulas').insert(formulas)
      if (fErr) log('formulas', `Formulas: ❌ ${fErr.message}`, false)
      else log('formulas', `✅ ${formulas.length} formulas imported`)

      setDone(true)
    } catch (e) {
      log('error', `Unexpected error: ${e.message}`, false)
    }

    setRunning(false)
  }

  return (
    <div className="p-4 pt-6 animate-fadeIn">
      <div className="max-w-lg mx-auto">
        <div className="glass-card rounded p-6">
          <h2 className="text-white font-semibold text-lg mb-1">Desktop → Cloud Migration</h2>
          <p className="text-gray-500 text-sm mb-6">
            Imports all your desktop data into Supabase. Only run this once.
          </p>

          <div className="space-y-1 mb-6 text-sm">
            <div className="flex justify-between text-gray-400 py-1 border-b border-white/5">
              <span>Tasks</span><span className="text-gray-600">{DESKTOP_TASKS.length} items</span>
            </div>
            <div className="flex justify-between text-gray-400 py-1 border-b border-white/5">
              <span>Outreach contacts</span><span className="text-gray-600">{DESKTOP_OUTREACH.length} items</span>
            </div>
            <div className="flex justify-between text-gray-400 py-1 border-b border-white/5">
              <span>Affiliates</span><span className="text-gray-600">{DESKTOP_AFFILIATES.length} items</span>
            </div>
            <div className="flex justify-between text-gray-400 py-1 border-b border-white/5">
              <span>Formulas</span><span className="text-gray-600">{DESKTOP_FORMULAS.length} items</span>
            </div>
            <div className="flex justify-between text-gray-400 py-1 border-b border-white/5">
              <span>Notepad</span><span className="text-gray-600">1 item</span>
            </div>
            <div className="flex justify-between text-gray-400 py-1">
              <span>Category order</span><span className="text-gray-600">{DESKTOP_CATEGORY_ORDER.length} categories</span>
            </div>
          </div>

          {/* Results */}
          {Object.keys(status).length > 0 && (
            <div className="bg-black/30 rounded p-3 mb-4 space-y-1">
              {Object.values(status).map((s, i) => (
                <p key={i} className={`text-sm ${s.ok ? 'text-brand-success' : 'text-red-400'}`}>{s.msg}</p>
              ))}
            </div>
          )}

          {done ? (
            <div className="text-center py-2">
              <p className="text-brand-success font-medium mb-1">Migration complete!</p>
              <p className="text-gray-500 text-xs">Reload the app to see your data. You can remove the migrate tab now.</p>
            </div>
          ) : (
            <button
              onClick={runMigration}
              disabled={running}
              className="btn-primary w-full py-2 rounded font-medium text-sm disabled:opacity-50"
            >
              {running ? 'Importing...' : 'Import All Desktop Data'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
