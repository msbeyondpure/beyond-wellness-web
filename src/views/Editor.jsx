import { useState, useEffect, useRef } from 'react'
import { useEditorFiles } from '../hooks/useEditorFiles'

// ── icons ─────────────────────────────────────────────────────────────────────
const FolderIcon = ({ open }) => open
  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(196,94,44,0.7)" stroke="rgba(196,94,44,0.9)" strokeWidth="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
  : <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(196,94,44,0.3)" stroke="rgba(196,94,44,0.6)" strokeWidth="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>

const FileIcon = ({ ext }) => {
  const color = ext === 'md' ? '#7dd3fc' : ext === 'html' || ext === 'htm' ? '#f97316'
    : ext === 'js' || ext === 'jsx' ? '#fbbf24' : ext === 'ts' || ext === 'tsx' ? '#60a5fa'
    : ext === 'json' ? '#a3e635' : ext === 'css' ? '#c084fc' : '#9ca3af'
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
}

const Icon = ({ d, w = 14, h = 14 }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {Array.isArray(d) ? d.map((p, i) => p.startsWith('M') || p.startsWith('L') || p.startsWith('C') || p.startsWith('A')
      ? <path key={i} d={p} /> : <polyline key={i} points={p} />)
      : <path d={d} />}
  </svg>
)

const PlusIco    = () => <Icon d="M12 5v14M5 12h14" />
const FolderPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
const ChevR      = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
const ChevD      = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
const SaveIco    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
const MenuIco    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
const FullIco    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
const ExitFull   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
const SearchIco  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const CloseIco   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const DownloadIco= () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
const UndoIco    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
const RedoIco    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>
const EmailIco   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
const PhoneIco   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
const MonitorIco = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
const CopyIco    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>

// ── file type helpers ─────────────────────────────────────────────────────────
const getExt    = (name) => { const p = name.lastIndexOf('.'); return p > 0 ? name.slice(p + 1).toLowerCase() : '' }
const isMarkdown= (name) => ['md','markdown'].includes(getExt(name))
const isHtml    = (name) => ['html','htm'].includes(getExt(name))
const isText    = (name) => ['md','markdown','txt','html','htm','js','jsx','ts','tsx','css','json','xml','csv','sh','py','rb','go','yaml','yml','toml','sql'].includes(getExt(name))

// ── persistent undo helpers ───────────────────────────────────────────────────
const UNDO_KEY = (p) => `bwUndo:${p}`
const REDO_KEY = (p) => `bwRedo:${p}`
const MAX_HIST = 100
function loadStack(key) { try { return JSON.parse(localStorage.getItem(key)) || [] } catch { return [] } }
function saveStack(key, arr) { try { localStorage.setItem(key, JSON.stringify(arr)) } catch {} }

// ── simple markdown renderer ──────────────────────────────────────────────────
function renderMd(md) {
  if (!md) return ''
  let html = md
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/```([\w]*)\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre class="md-code-block"><code class="lang-${lang}">${code.trimEnd()}</code></pre>`)
    .replace(/^#{6}\s+(.+)$/gm,'<h6>$1</h6>').replace(/^#{5}\s+(.+)$/gm,'<h5>$1</h5>')
    .replace(/^#{4}\s+(.+)$/gm,'<h4>$1</h4>').replace(/^###\s+(.+)$/gm,'<h3>$1</h3>')
    .replace(/^##\s+(.+)$/gm,'<h2>$1</h2>').replace(/^#\s+(.+)$/gm,'<h1>$1</h1>')
    .replace(/^>\s+(.+)$/gm,'<blockquote>$1</blockquote>').replace(/^---+$/gm,'<hr>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/~~(.+?)~~/g,'<del>$1</del>').replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^[-*]\s+(.+)$/gm,'<li>$1</li>').replace(/(<li>.*<\/li>\n?)+/g, s => `<ul>${s}</ul>`)
    .replace(/^\d+\.\s+(.+)$/gm,'<li>$1</li>').replace(/\n\n/g,'</p><p>')
  return `<p>${html}</p>`
}

// ── email constants ───────────────────────────────────────────────────────────
const EMAIL_COLORS = [
  '#000000','#111111','#333333','#555555','#777777','#999999','#bbbbbb','#dddddd','#ffffff',
  '#c45e2c','#d4722f','#8b9a3e','#6b7a2e','#1d4ed8','#3b82f6','#93c5fd',
  '#dc2626','#ef4444','#fca5a5','#d97706','#f59e0b','#fcd34d',
  '#059669','#10b981','#6ee7b7','#7c3aed','#8b5cf6','#c4b5fd',
  '#db2777','#ec4899','#f9a8d4','#0891b2','#06b6d4','#67e8f9',
]
const EMAIL_FONTS = [
  { label: 'Arial',        value: 'Arial, Helvetica, sans-serif' },
  { label: 'Helvetica',    value: 'Helvetica, Arial, sans-serif' },
  { label: 'Georgia',      value: 'Georgia, Times, serif' },
  { label: 'Times NR',     value: "'Times New Roman', Times, serif" },
  { label: 'Verdana',      value: 'Verdana, Geneva, sans-serif' },
  { label: 'Trebuchet',    value: "'Trebuchet MS', Helvetica, sans-serif" },
  { label: 'Courier',      value: "'Courier New', Courier, monospace" },
  { label: 'Impact',       value: 'Impact, Charcoal, sans-serif' },
]
const EMAIL_SIZES = ['10','11','12','13','14','15','16','17','18','20','22','24','26','28','32','36','40','48','60','72']

// ── email HTML snippets ───────────────────────────────────────────────────────
const SNIP = {
  fullTemplate: () => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Email</title>
  <style>
    body { margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif; }
    .wrapper { width:100%;table-layout:fixed;background:#f4f4f4;padding:40px 0; }
    .container { width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden; }
    @media only screen and (max-width:600px){
      .container{width:100%!important;}
      .col{width:100%!important;display:block!important;}
      .mobile-hide{display:none!important;}
      .mobile-center{text-align:center!important;}
    }
  </style>
</head>
<body>
<table class="wrapper" cellpadding="0" cellspacing="0"><tr><td align="center">
  <table class="container" cellpadding="0" cellspacing="0">
    <!-- HEADER -->
    <tr><td style="background:#1a1a1a;padding:28px 30px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;letter-spacing:1px;font-family:Arial,sans-serif;">YOUR BRAND</h1>
    </td></tr>
    <!-- HERO -->
    <tr><td style="padding:40px 30px 30px;text-align:center;">
      <h2 style="color:#1a1a1a;margin:0 0 12px;font-size:26px;line-height:1.3;font-family:Arial,sans-serif;">Email Heading Goes Here</h2>
      <p style="color:#666;margin:0 0 24px;font-size:15px;line-height:1.7;font-family:Arial,sans-serif;">Your opening message goes here. Keep it concise and focused on a single key point that matters to your reader.</p>
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
        <td style="border-radius:4px;background:#c45e2c;">
          <a href="https://yoursite.com" style="display:inline-block;padding:14px 36px;color:#fff;text-decoration:none;font-weight:700;font-size:15px;font-family:Arial,sans-serif;">Shop Now →</a>
        </td>
      </tr></table>
    </td></tr>
    <!-- CONTENT -->
    <tr><td style="padding:0 30px 30px;">
      <hr style="border:none;border-top:1px solid #eee;margin:0 0 30px;" />
      <h3 style="color:#1a1a1a;margin:0 0 10px;font-size:18px;font-family:Arial,sans-serif;">Section Heading</h3>
      <p style="color:#555;margin:0;font-size:14px;line-height:1.7;font-family:Arial,sans-serif;">Supporting content for this section. Duplicate this block as needed.</p>
    </td></tr>
    <!-- FOOTER -->
    <tr><td style="background:#f8f8f8;padding:20px 30px;text-align:center;border-top:1px solid #eee;">
      <p style="color:#999;font-size:12px;margin:0 0 6px;font-family:Arial,sans-serif;">© 2024 Your Company · 123 Main St, City, ST 12345</p>
      <p style="color:#999;font-size:12px;margin:0;font-family:Arial,sans-serif;">
        <a href="#" style="color:#c45e2c;text-decoration:underline;">Unsubscribe</a> &nbsp;·&nbsp;
        <a href="#" style="color:#c45e2c;text-decoration:underline;">View in browser</a> &nbsp;·&nbsp;
        <a href="#" style="color:#c45e2c;text-decoration:underline;">Privacy Policy</a>
      </p>
    </td></tr>
  </table>
</td></tr></table>
</body>
</html>`,

  newsletter: () => `<!-- NEWSLETTER LAYOUT -->
<table cellpadding="0" cellspacing="0" width="100%" style="background:#f4f4f4;">
<tr><td align="center" style="padding:30px 20px;">
  <table cellpadding="0" cellspacing="0" width="600" style="background:#fff;border-radius:8px;overflow:hidden;">
    <!-- Masthead -->
    <tr><td style="padding:24px 30px;border-bottom:2px solid #c45e2c;">
      <table width="100%"><tr>
        <td><span style="font-size:20px;font-weight:700;color:#1a1a1a;font-family:Georgia,serif;">The Weekly</span></td>
        <td align="right"><span style="font-size:12px;color:#999;font-family:Arial,sans-serif;">Issue #001 · Apr 2024</span></td>
      </tr></table>
    </td></tr>
    <!-- Feature -->
    <tr><td style="padding:30px;">
      <span style="font-size:10px;color:#c45e2c;font-weight:700;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;">Feature</span>
      <h2 style="color:#1a1a1a;margin:8px 0 12px;font-size:22px;line-height:1.3;font-family:Georgia,serif;">Newsletter Feature Story Headline</h2>
      <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 16px;font-family:Arial,sans-serif;">Your featured story intro. Hook the reader with a compelling opening that makes them want to keep reading.</p>
      <a href="#" style="color:#c45e2c;font-size:13px;font-weight:600;text-decoration:none;font-family:Arial,sans-serif;">Read more →</a>
    </td></tr>
    <!-- 2-col stories -->
    <tr><td style="padding:0 30px 30px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td width="48%" valign="top" style="padding-right:12px;border-right:1px solid #eee;">
          <span style="font-size:10px;color:#8b9a3e;font-weight:700;letter-spacing:1px;text-transform:uppercase;font-family:Arial,sans-serif;">News</span>
          <h4 style="color:#1a1a1a;margin:6px 0 8px;font-size:15px;font-family:Georgia,serif;">Second Story Headline</h4>
          <p style="color:#666;font-size:13px;line-height:1.6;margin:0 0 10px;font-family:Arial,sans-serif;">Brief description of this story here.</p>
          <a href="#" style="color:#c45e2c;font-size:12px;font-weight:600;text-decoration:none;font-family:Arial,sans-serif;">Read →</a>
        </td>
        <td width="4%"></td>
        <td width="48%" valign="top" style="padding-left:12px;">
          <span style="font-size:10px;color:#8b9a3e;font-weight:700;letter-spacing:1px;text-transform:uppercase;font-family:Arial,sans-serif;">Tips</span>
          <h4 style="color:#1a1a1a;margin:6px 0 8px;font-size:15px;font-family:Georgia,serif;">Third Story Headline</h4>
          <p style="color:#666;font-size:13px;line-height:1.6;margin:0 0 10px;font-family:Arial,sans-serif;">Brief description of this story here.</p>
          <a href="#" style="color:#c45e2c;font-size:12px;font-weight:600;text-decoration:none;font-family:Arial,sans-serif;">Read →</a>
        </td>
      </tr></table>
    </td></tr>
    <!-- Footer -->
    <tr><td style="background:#1a1a1a;padding:20px 30px;text-align:center;">
      <p style="color:#666;font-size:11px;margin:0;font-family:Arial,sans-serif;">
        You're receiving this because you subscribed at yoursite.com &nbsp;·&nbsp;
        <a href="#" style="color:#c45e2c;text-decoration:none;">Unsubscribe</a>
      </p>
    </td></tr>
  </table>
</td></tr></table>`,

  promo: () => `<!-- PROMOTIONAL EMAIL -->
<table cellpadding="0" cellspacing="0" width="100%" style="background:#1a1a1a;">
<tr><td align="center">
  <table cellpadding="0" cellspacing="0" width="600" style="background:#1a1a1a;">
    <tr><td style="padding:24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);">
      <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:2px;font-family:Arial,sans-serif;">YOUR BRAND</span>
    </td></tr>
    <!-- Banner -->
    <tr><td style="padding:60px 40px;text-align:center;">
      <p style="color:#c45e2c;font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px;font-family:Arial,sans-serif;">Limited Time Offer</p>
      <h1 style="color:#fff;font-size:56px;font-weight:900;margin:0 0 8px;font-family:Arial,sans-serif;line-height:1;">30% OFF</h1>
      <p style="color:#aaa;font-size:16px;margin:0 0 32px;font-family:Arial,sans-serif;">Everything in the store. Ends Sunday.</p>
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
        <td style="border-radius:4px;background:#c45e2c;">
          <a href="https://yoursite.com" style="display:inline-block;padding:16px 48px;color:#fff;text-decoration:none;font-weight:700;font-size:16px;font-family:Arial,sans-serif;letter-spacing:1px;">SHOP NOW →</a>
        </td>
      </tr></table>
      <p style="color:#666;font-size:12px;margin:20px 0 0;font-family:Arial,sans-serif;">Use code: <strong style="color:#c45e2c;">SAVE30</strong> at checkout</p>
    </td></tr>
    <!-- Products -->
    <tr><td style="padding:30px;background:#222;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td width="32%" style="text-align:center;padding:0 6px;">
          <div style="background:#2a2a2a;border-radius:4px;padding:20px 10px;">
            <p style="color:#fff;font-size:13px;font-weight:600;margin:0 0 4px;font-family:Arial,sans-serif;">Product One</p>
            <p style="color:#c45e2c;font-size:14px;font-weight:700;margin:0;font-family:Arial,sans-serif;">$XX.XX</p>
          </div>
        </td>
        <td width="2%"></td>
        <td width="32%" style="text-align:center;padding:0 6px;">
          <div style="background:#2a2a2a;border-radius:4px;padding:20px 10px;">
            <p style="color:#fff;font-size:13px;font-weight:600;margin:0 0 4px;font-family:Arial,sans-serif;">Product Two</p>
            <p style="color:#c45e2c;font-size:14px;font-weight:700;margin:0;font-family:Arial,sans-serif;">$XX.XX</p>
          </div>
        </td>
        <td width="2%"></td>
        <td width="32%" style="text-align:center;padding:0 6px;">
          <div style="background:#2a2a2a;border-radius:4px;padding:20px 10px;">
            <p style="color:#fff;font-size:13px;font-weight:600;margin:0 0 4px;font-family:Arial,sans-serif;">Product Three</p>
            <p style="color:#c45e2c;font-size:14px;font-weight:700;margin:0;font-family:Arial,sans-serif;">$XX.XX</p>
          </div>
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:20px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
      <p style="color:#555;font-size:11px;margin:0;font-family:Arial,sans-serif;">
        © 2024 Your Company &nbsp;·&nbsp; <a href="#" style="color:#c45e2c;text-decoration:none;">Unsubscribe</a>
      </p>
    </td></tr>
  </table>
</td></tr></table>`,

  header: () => `<!-- Email Header -->
<table cellpadding="0" cellspacing="0" width="100%" style="background:#1a1a1a;">
  <tr><td style="padding:28px 30px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;letter-spacing:2px;font-family:Arial,sans-serif;">YOUR BRAND</h1>
  </td></tr>
</table>`,

  footer: () => `<!-- Email Footer -->
<table cellpadding="0" cellspacing="0" width="100%" style="background:#f8f8f8;border-top:1px solid #eee;">
  <tr><td style="padding:24px 30px;text-align:center;">
    <p style="color:#999;font-size:12px;margin:0 0 8px;font-family:Arial,sans-serif;">© 2024 Your Company · 123 Main St, City, ST 12345</p>
    <p style="color:#999;font-size:12px;margin:0;font-family:Arial,sans-serif;">
      <a href="#" style="color:#c45e2c;text-decoration:underline;">Unsubscribe</a> &nbsp;·&nbsp;
      <a href="#" style="color:#c45e2c;text-decoration:underline;">View in browser</a> &nbsp;·&nbsp;
      <a href="#" style="color:#c45e2c;text-decoration:underline;">Privacy Policy</a>
    </p>
  </td></tr>
</table>`,

  heroSection: () => `<!-- Hero Section -->
<table cellpadding="0" cellspacing="0" width="100%" style="background:#f9f9f9;">
  <tr><td style="padding:60px 30px;text-align:center;">
    <h1 style="color:#1a1a1a;margin:0 0 16px;font-size:36px;line-height:1.2;font-family:Arial,sans-serif;font-weight:900;">Your Hero Headline</h1>
    <p style="color:#666;font-size:17px;line-height:1.7;margin:0 auto 32px;max-width:480px;font-family:Arial,sans-serif;">Hero subheadline that expands on the main message and draws the reader deeper into the email.</p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
      <td style="border-radius:4px;background:#c45e2c;">
        <a href="https://yoursite.com" style="display:inline-block;padding:14px 36px;color:#fff;text-decoration:none;font-weight:700;font-size:15px;font-family:Arial,sans-serif;">Get Started →</a>
      </td>
    </tr></table>
  </td></tr>
</table>`,

  twoCol: () => `<!-- 2-Column Layout (use table for email compatibility) -->
<table cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td width="48%" valign="top" style="padding:20px;">
      <h3 style="color:#1a1a1a;margin:0 0 10px;font-size:17px;font-family:Arial,sans-serif;">Left Heading</h3>
      <p style="color:#555;font-size:14px;line-height:1.6;margin:0;font-family:Arial,sans-serif;">Left column content goes here. Keep paragraphs short and scannable for email readers.</p>
    </td>
    <td width="4%" style="font-size:0;line-height:0;">&nbsp;</td>
    <td width="48%" valign="top" style="padding:20px;">
      <h3 style="color:#1a1a1a;margin:0 0 10px;font-size:17px;font-family:Arial,sans-serif;">Right Heading</h3>
      <p style="color:#555;font-size:14px;line-height:1.6;margin:0;font-family:Arial,sans-serif;">Right column content goes here. Keep paragraphs short and scannable for email readers.</p>
    </td>
  </tr>
</table>`,

  threeCol: () => `<!-- 3-Column Layout -->
<table cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td width="32%" valign="top" style="padding:16px;text-align:center;">
      <h4 style="color:#1a1a1a;margin:0 0 8px;font-size:15px;font-family:Arial,sans-serif;">Column 1</h4>
      <p style="color:#555;font-size:13px;line-height:1.6;margin:0;font-family:Arial,sans-serif;">First column content.</p>
    </td>
    <td width="2%" style="font-size:0;">&nbsp;</td>
    <td width="32%" valign="top" style="padding:16px;text-align:center;">
      <h4 style="color:#1a1a1a;margin:0 0 8px;font-size:15px;font-family:Arial,sans-serif;">Column 2</h4>
      <p style="color:#555;font-size:13px;line-height:1.6;margin:0;font-family:Arial,sans-serif;">Second column content.</p>
    </td>
    <td width="2%" style="font-size:0;">&nbsp;</td>
    <td width="32%" valign="top" style="padding:16px;text-align:center;">
      <h4 style="color:#1a1a1a;margin:0 0 8px;font-size:15px;font-family:Arial,sans-serif;">Column 3</h4>
      <p style="color:#555;font-size:13px;line-height:1.6;margin:0;font-family:Arial,sans-serif;">Third column content.</p>
    </td>
  </tr>
</table>`,

  ctaButton: () => `<!-- CTA Button (email-safe table method) -->
<table cellpadding="0" cellspacing="0" style="margin:24px auto;">
  <tr>
    <td style="border-radius:4px;background:#c45e2c;text-align:center;">
      <a href="https://yoursite.com" style="display:inline-block;padding:14px 36px;color:#fff;text-decoration:none;font-weight:700;font-size:15px;font-family:Arial,Helvetica,sans-serif;line-height:1;">Click Here →</a>
    </td>
  </tr>
</table>`,

  productCard: () => `<!-- Product Card -->
<table cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #eee;border-radius:6px;overflow:hidden;margin:16px 0;">
  <tr><td>
    <div style="background:#f5f5f5;height:180px;text-align:center;line-height:180px;">
      <img src="https://yoursite.com/product.jpg" alt="Product" width="200" style="max-width:100%;height:auto;vertical-align:middle;" />
    </div>
  </td></tr>
  <tr><td style="padding:20px;">
    <h3 style="color:#1a1a1a;margin:0 0 6px;font-size:18px;font-family:Arial,sans-serif;">Product Name</h3>
    <p style="color:#666;font-size:13px;line-height:1.6;margin:0 0 16px;font-family:Arial,sans-serif;">Brief product description highlighting the key benefit for the customer.</p>
    <table cellpadding="0" cellspacing="0" width="100%"><tr>
      <td><span style="font-size:22px;font-weight:700;color:#c45e2c;font-family:Arial,sans-serif;">$XX.XX</span></td>
      <td align="right">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="border-radius:4px;background:#c45e2c;">
            <a href="#" style="display:inline-block;padding:10px 24px;color:#fff;text-decoration:none;font-weight:700;font-size:13px;font-family:Arial,sans-serif;">Buy Now</a>
          </td>
        </tr></table>
      </td>
    </tr></table>
  </td></tr>
</table>`,

  socialLinks: () => `<!-- Social Media Links -->
<table cellpadding="0" cellspacing="0" style="margin:16px auto;">
  <tr>
    <td style="padding:0 5px;"><a href="https://instagram.com/yourbrand" style="display:inline-block;padding:8px 14px;background:#e1306c;border-radius:4px;color:#fff;text-decoration:none;font-size:12px;font-weight:600;font-family:Arial,sans-serif;">Instagram</a></td>
    <td style="padding:0 5px;"><a href="https://facebook.com/yourbrand" style="display:inline-block;padding:8px 14px;background:#1877f2;border-radius:4px;color:#fff;text-decoration:none;font-size:12px;font-weight:600;font-family:Arial,sans-serif;">Facebook</a></td>
    <td style="padding:0 5px;"><a href="https://twitter.com/yourbrand" style="display:inline-block;padding:8px 14px;background:#1da1f2;border-radius:4px;color:#fff;text-decoration:none;font-size:12px;font-weight:600;font-family:Arial,sans-serif;">Twitter</a></td>
    <td style="padding:0 5px;"><a href="https://tiktok.com/@yourbrand" style="display:inline-block;padding:8px 14px;background:#000;border-radius:4px;color:#fff;text-decoration:none;font-size:12px;font-weight:600;font-family:Arial,sans-serif;">TikTok</a></td>
    <td style="padding:0 5px;"><a href="https://youtube.com/@yourbrand" style="display:inline-block;padding:8px 14px;background:#ff0000;border-radius:4px;color:#fff;text-decoration:none;font-size:12px;font-weight:600;font-family:Arial,sans-serif;">YouTube</a></td>
  </tr>
</table>`,

  testimonial: () => `<!-- Testimonial Block -->
<table cellpadding="0" cellspacing="0" width="100%" style="background:#f9f9f9;border-left:4px solid #c45e2c;margin:16px 0;">
  <tr><td style="padding:24px 28px;">
    <p style="color:#333;font-size:16px;line-height:1.7;margin:0 0 16px;font-style:italic;font-family:Georgia,serif;">"This is the customer testimonial or quote. Make it authentic, specific, and focused on the transformation your product delivered."</p>
    <table cellpadding="0" cellspacing="0"><tr>
      <td style="padding-right:12px;">
        <div style="width:40px;height:40px;border-radius:50%;background:#ddd;text-align:center;line-height:40px;font-size:16px;">👤</div>
      </td>
      <td>
        <p style="color:#1a1a1a;font-size:13px;font-weight:700;margin:0;font-family:Arial,sans-serif;">Customer Name</p>
        <p style="color:#888;font-size:12px;margin:2px 0 0;font-family:Arial,sans-serif;">Title / Company</p>
      </td>
      <td style="padding-left:16px;">
        <span style="color:#f59e0b;font-size:18px;">★★★★★</span>
      </td>
    </tr></table>
  </td></tr>
</table>`,

  imageBlock: () => `<!-- Full-width Image Block -->
<table cellpadding="0" cellspacing="0" width="100%">
  <tr><td style="padding:20px;text-align:center;">
    <img src="https://yoursite.com/image.jpg" alt="Image description" width="560" style="max-width:100%;height:auto;display:block;margin:0 auto;border-radius:4px;" />
    <p style="color:#888;font-size:12px;margin:8px 0 0;font-family:Arial,sans-serif;font-style:italic;">Optional image caption text</p>
  </td></tr>
</table>`,

  divider: () => `<!-- Section Divider -->
<table cellpadding="0" cellspacing="0" width="100%">
  <tr><td style="padding:16px 0;">
    <hr style="border:none;border-top:1px solid #eeeeee;margin:0;" />
  </td></tr>
</table>`,

  emailTable: () => `<!-- Email-safe Data Table -->
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
  <tr>
    <th style="background:#1a1a1a;color:#fff;padding:10px 14px;text-align:left;font-size:12px;font-family:Arial,sans-serif;font-weight:600;">Column 1</th>
    <th style="background:#1a1a1a;color:#fff;padding:10px 14px;text-align:left;font-size:12px;font-family:Arial,sans-serif;font-weight:600;">Column 2</th>
    <th style="background:#1a1a1a;color:#fff;padding:10px 14px;text-align:left;font-size:12px;font-family:Arial,sans-serif;font-weight:600;">Column 3</th>
  </tr>
  <tr style="background:#fff;">
    <td style="padding:10px 14px;font-size:13px;color:#555;font-family:Arial,sans-serif;border-bottom:1px solid #eee;">Value 1</td>
    <td style="padding:10px 14px;font-size:13px;color:#555;font-family:Arial,sans-serif;border-bottom:1px solid #eee;">Value 2</td>
    <td style="padding:10px 14px;font-size:13px;color:#555;font-family:Arial,sans-serif;border-bottom:1px solid #eee;">Value 3</td>
  </tr>
  <tr style="background:#fafafa;">
    <td style="padding:10px 14px;font-size:13px;color:#555;font-family:Arial,sans-serif;border-bottom:1px solid #eee;">Value 4</td>
    <td style="padding:10px 14px;font-size:13px;color:#555;font-family:Arial,sans-serif;border-bottom:1px solid #eee;">Value 5</td>
    <td style="padding:10px 14px;font-size:13px;color:#555;font-family:Arial,sans-serif;border-bottom:1px solid #eee;">Value 6</td>
  </tr>
</table>`,

  preheader: () => `<!-- Preheader: invisible text shown in inbox preview before opening -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#ffffff;line-height:1px;">Your preheader preview text goes here — shown in inbox before opening.&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌</div>`,

  mediaQuery: () => `<style type="text/css">
  /* Responsive + Dark mode */
  @media only screen and (max-width: 600px) {
    .container { width: 100% !important; min-width: 100% !important; }
    .col        { display: block !important; width: 100% !important; box-sizing: border-box; }
    .mobile-hide{ display: none !important; height: 0 !important; overflow: hidden !important; }
    .mobile-center { text-align: center !important; }
    .mobile-full{ width: 100% !important; }
    .mobile-pad { padding: 20px !important; }
    img         { max-width: 100% !important; height: auto !important; }
    h1, .heading{ font-size: 28px !important; }
    h2          { font-size: 22px !important; }
  }
  @media (prefers-color-scheme: dark) {
    .dark-invert-bg { background-color: #1a1a1a !important; }
    .dark-invert-text { color: #ffffff !important; }
  }
</style>`,

  outlook: () => `<!--[if mso]>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" align="center">
  <tr><td>
<![endif]-->
<!-- Email content here -->
<!--[if mso]>
  </td></tr>
</table>
<![endif]-->`,

  gif: () => `<!-- Animated GIF (falls back to first frame in Outlook) -->
<!--[if !mso]><!-->
<img src="https://yoursite.com/animation.gif" alt="Animation" width="600" style="max-width:100%;height:auto;display:block;" />
<!--<![endif]-->
<!--[if mso]><img src="https://yoursite.com/fallback.jpg" alt="Image" width="600" /><![endif]-->`,
}

// ── context menu ─────────────────────────────────────────────────────────────
function ContextMenu({ menu, onClose }) {
  useEffect(() => {
    const fn = () => onClose()
    document.addEventListener('click', fn, { once: true })
    return () => document.removeEventListener('click', fn)
  }, [onClose])
  if (!menu) return null
  return (
    <div className="context-menu animate-scaleIn" style={{ left: menu.x, top: menu.y, zIndex: 500 }}>
      {menu.items.map((item, i) => item.sep
        ? <div key={i} className="border-t border-white/5 my-1" />
        : <div key={i} onClick={e => { e.stopPropagation(); item.action(); onClose() }}
            className={`context-menu-item ${item.danger ? 'danger' : ''}`}>{item.label}</div>
      )}
    </div>
  )
}

// ── color swatches picker ─────────────────────────────────────────────────────
function ColorSwatches({ onSelect }) {
  return (
    <div className="absolute top-full left-0 mt-1 z-[200] rounded-lg p-2 shadow-2xl border border-white/10"
      style={{ background: '#1a1a1a', width: 180 }}
      onMouseDown={e => e.stopPropagation()}
    >
      <div className="grid grid-cols-9 gap-0.5">
        {EMAIL_COLORS.map(c => (
          <button key={c} onMouseDown={e => { e.preventDefault(); onSelect(c) }}
            style={{ background: c, border: c === '#ffffff' ? '1px solid #444' : 'none' }}
            className="w-4 h-4 rounded-sm hover:scale-125 transition-transform cursor-pointer"
            title={c}
          />
        ))}
      </div>
      <div className="mt-2 pt-1.5 border-t border-white/10">
        <label className="text-[10px] text-gray-500 block mb-1">Custom</label>
        <input type="color" defaultValue="#c45e2c"
          onChange={e => onSelect(e.target.value)}
          className="w-full h-6 rounded cursor-pointer bg-transparent border-none outline-none"
        />
      </div>
    </div>
  )
}

// ── tree node ─────────────────────────────────────────────────────────────────
function TreeNode({ node, files, depth = 0, activeFile, openFolders, onSelect, onToggle, onCtx, renaming, renameValue, setRenameValue, onRenameBlur, onRenameKey }) {
  const children = files.filter(n => n.parent_path === node.path).sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  const isOpen   = openFolders.has(node.path)
  const isActive = activeFile?.path === node.path
  const ext      = node.type === 'file' ? getExt(node.name) : ''
  return (
    <div>
      <div
        className={`flex items-center gap-1.5 py-1.5 sm:py-0.5 px-2 rounded cursor-pointer group transition-all
          ${isActive ? 'bg-brand-accent/15 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 active:bg-white/10'}`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={() => node.type === 'folder' ? onToggle(node.path) : onSelect(node)}
        onContextMenu={e => { e.preventDefault(); e.stopPropagation(); onCtx(e, node) }}
      >
        {node.type === 'folder' && <span className="text-gray-600 w-3 flex-shrink-0">{isOpen ? <ChevD /> : <ChevR />}</span>}
        {node.type === 'folder' ? <FolderIcon open={isOpen} /> : <FileIcon ext={ext} />}
        {renaming?.path === node.path ? (
          <input autoFocus value={renameValue} onChange={e => setRenameValue(e.target.value)}
            onBlur={onRenameBlur} onKeyDown={onRenameKey} onClick={e => e.stopPropagation()}
            className="flex-1 bg-black/40 border border-brand-accent/40 outline-none px-1 rounded text-white text-xs" />
        ) : (
          <span className="flex-1 text-xs truncate select-none">{node.name}</span>
        )}
      </div>
      {node.type === 'folder' && isOpen && children.map(child => (
        <TreeNode key={child.id} node={child} files={files} depth={depth + 1}
          activeFile={activeFile} openFolders={openFolders}
          onSelect={onSelect} onToggle={onToggle} onCtx={onCtx}
          renaming={renaming} renameValue={renameValue}
          setRenameValue={setRenameValue} onRenameBlur={onRenameBlur} onRenameKey={onRenameKey}
        />
      ))}
    </div>
  )
}

// ── toolbar button (markdown) ─────────────────────────────────────────────────
function TB({ onClick, title, active, disabled, children }) {
  return (
    <button onMouseDown={e => { e.preventDefault(); if (!disabled) onClick() }} title={title} disabled={disabled}
      className={`px-1.5 py-1 rounded text-xs transition-all select-none
        ${disabled ? 'opacity-25 cursor-not-allowed' : active ? 'bg-brand-accent/30 text-brand-accent' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
    >{children}</button>
  )
}

// ── email toolbar button ──────────────────────────────────────────────────────
function ETB({ onClick, title, children, accent }) {
  return (
    <button onMouseDown={e => { e.preventDefault(); onClick() }} title={title}
      className={`px-1.5 py-0.5 rounded text-[11px] transition-all select-none whitespace-nowrap flex-shrink-0 leading-tight
        ${accent ? 'bg-brand-accent/20 text-brand-accent hover:bg-brand-accent/30' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
    >{children}</button>
  )
}
const Sep = () => <div className="w-px h-3.5 bg-white/10 mx-0.5 flex-shrink-0 self-center" />

// ── stat helpers ──────────────────────────────────────────────────────────────
function getWordCount(text) { return text.trim().split(/\s+/).filter(Boolean).length }
function getReadTime(text)  { return Math.max(1, Math.round(getWordCount(text) / 200)) }
function getCursorPos(text, idx) {
  const lines = text.slice(0, idx).split('\n')
  return { line: lines.length, col: lines[lines.length - 1].length + 1 }
}

// ── main component ────────────────────────────────────────────────────────────
export default function Editor({ userId }) {
  const { files, loading, createNode, saveContent, deleteNode, renameNode } = useEditorFiles(userId)

  // ── state ──────────────────────────────────────────────────────────────────
  const [activeFile, setActiveFile]       = useState(null)
  const [content, setContent]             = useState('')
  const [saveStatus, setSaveStatus]       = useState('saved')
  const [openFolders, setOpenFolders]     = useState(new Set())
  const [contextMenu, setContextMenu]     = useState(null)
  const [renaming, setRenaming]           = useState(null)
  const [renameValue, setRenameValue]     = useState('')
  const [newItemTarget, setNewItemTarget] = useState(null)
  const [newItemName, setNewItemName]     = useState('')
  const [viewMode, setViewMode]           = useState('source')
  const [leftW, setLeftW]                 = useState(() => parseInt(localStorage.getItem('bwEditorLeftW') || '240', 10))
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [fullScreen, setFullScreen]       = useState(false)
  const [showFind, setShowFind]           = useState(false)
  const [findQuery, setFindQuery]         = useState('')
  const [cursorPos, setCursorPos]         = useState({ line: 1, col: 1 })
  const [openTabs, setOpenTabs]           = useState([])
  const [historyVer, setHistoryVer]       = useState(0)

  // ── email mode state ───────────────────────────────────────────────────────
  const [emailMode, setEmailMode]               = useState(false)
  const [emailSubject, setEmailSubject]         = useState('')
  const [emailPreheader, setEmailPreheader]     = useState('')
  const [emailPreviewWidth, setEmailPreviewWidth] = useState('100%')
  const [showColorPicker, setShowColorPicker]   = useState(null) // 'text'|'bg'|null
  const [emailFontFamily, setEmailFontFamily]   = useState('Arial, Helvetica, sans-serif')
  const [emailFontSize, setEmailFontSize]       = useState('15')
  const [copyDone, setCopyDone]                 = useState(false)

  // ── refs ───────────────────────────────────────────────────────────────────
  const textareaRef        = useRef(null)
  const saveTimer          = useRef(null)
  const checkpointTimer    = useRef(null)
  const resizing           = useRef(false)
  const savedContentRef    = useRef('')
  const undoRef            = useRef([])
  const redoRef            = useRef([])
  const baselineRef        = useRef('')
  const sessionStartRef    = useRef(null)
  const isUndoingRef       = useRef(false)

  const canUndo = undoRef.current.length > 0
  const canRedo = redoRef.current.length > 0

  // ── undo helpers ───────────────────────────────────────────────────────────
  function bumpHistory() { setHistoryVer(v => v + 1) }
  function loadHistory(path) {
    undoRef.current = loadStack(UNDO_KEY(path))
    redoRef.current = loadStack(REDO_KEY(path))
    bumpHistory()
  }
  function pushToUndo(snapshot, path = activeFile?.path) {
    if (!path) return
    const next = [...undoRef.current, snapshot].slice(-MAX_HIST)
    undoRef.current = next; redoRef.current = []
    saveStack(UNDO_KEY(path), next)
    try { localStorage.removeItem(REDO_KEY(path)) } catch {}
    bumpHistory()
  }
  function performUndo() {
    if (!activeFile || undoRef.current.length === 0) return
    clearTimeout(checkpointTimer.current); sessionStartRef.current = null
    const prev    = undoRef.current[undoRef.current.length - 1]
    const curr    = content
    const newUndo = undoRef.current.slice(0, -1)
    const newRedo = [...redoRef.current, curr].slice(-MAX_HIST)
    undoRef.current = newUndo; redoRef.current = newRedo
    saveStack(UNDO_KEY(activeFile.path), newUndo); saveStack(REDO_KEY(activeFile.path), newRedo)
    baselineRef.current = prev; isUndoingRef.current = true; setContent(prev); bumpHistory()
  }
  function performRedo() {
    if (!activeFile || redoRef.current.length === 0) return
    clearTimeout(checkpointTimer.current); sessionStartRef.current = null
    const next    = redoRef.current[redoRef.current.length - 1]
    const curr    = content
    const newRedo = redoRef.current.slice(0, -1)
    const newUndo = [...undoRef.current, curr].slice(-MAX_HIST)
    undoRef.current = newUndo; redoRef.current = newRedo
    saveStack(UNDO_KEY(activeFile.path), newUndo); saveStack(REDO_KEY(activeFile.path), newRedo)
    baselineRef.current = next; isUndoingRef.current = true; setContent(next); bumpHistory()
  }

  // ── email helpers ──────────────────────────────────────────────────────────
  function insertHtml(html) {
    if (activeFile) {
      const before = sessionStartRef.current !== null ? sessionStartRef.current : content
      pushToUndo(before); sessionStartRef.current = null; baselineRef.current = content
    }
    const ta = textareaRef.current
    if (!ta) { setContent(c => c + html); return }
    const { selectionStart: ss, selectionEnd: se, value: val } = ta
    const newVal = val.slice(0, ss) + html + val.slice(se)
    setContent(newVal); baselineRef.current = newVal; isUndoingRef.current = true
    setTimeout(() => { ta.focus(); ta.setSelectionRange(ss + html.length, ss + html.length) }, 0)
  }
  function wrapHtml(open, close) {
    const ta = textareaRef.current
    if (!ta) return
    const { selectionStart: ss, selectionEnd: se, value: val } = ta
    const selText = val.slice(ss, se) || 'content'
    if (activeFile) {
      const before = sessionStartRef.current !== null ? sessionStartRef.current : content
      pushToUndo(before); sessionStartRef.current = null; baselineRef.current = content
    }
    const ins = open + selText + close
    const newVal = val.slice(0, ss) + ins + val.slice(se)
    setContent(newVal); baselineRef.current = newVal; isUndoingRef.current = true
    setTimeout(() => { ta.focus(); ta.setSelectionRange(ss + open.length, ss + open.length + selText.length) }, 0)
  }
  function applyColor(prop, color) {
    wrapHtml(`<span style="${prop}:${color};">`, '</span>')
    setShowColorPicker(null)
  }
  function applyPadding(val) { wrapHtml(`<div style="padding:${val};">`, '</div>') }
  function applyInlineProp(prop, val) { wrapHtml(`<span style="${prop}:${val};">`, '</span>') }

  // ── effects ────────────────────────────────────────────────────────────────
  useEffect(() => { localStorage.setItem('bwEditorLeftW', String(leftW)) }, [leftW])
  useEffect(() => { if (activeFile) setShowMobileSidebar(false) }, [activeFile?.path])
  useEffect(() => {
    const fn = () => { if (window.innerWidth < 640 && viewMode === 'split') setViewMode('source') }
    fn(); window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [viewMode])

  // Close color picker on outside click
  useEffect(() => {
    if (!showColorPicker) return
    const fn = () => setShowColorPicker(null)
    const t = setTimeout(() => document.addEventListener('mousedown', fn), 0)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', fn) }
  }, [showColorPicker])

  // Load file content
  useEffect(() => {
    if (!activeFile) return
    const f = files.find(f => f.path === activeFile.path)
    if (!f) return
    const c = f.content || ''
    clearTimeout(checkpointTimer.current); sessionStartRef.current = null; isUndoingRef.current = true
    setContent(c); setSaveStatus('saved'); savedContentRef.current = c
    baselineRef.current = c; loadHistory(activeFile.path)
  }, [activeFile?.path]) // eslint-disable-line

  // Realtime sync
  useEffect(() => {
    if (!activeFile) return
    const f = files.find(f => f.path === activeFile.path)
    if (!f) return
    const dbContent = f.content || ''
    if (dbContent === savedContentRef.current) return
    const prevSaved = savedContentRef.current
    savedContentRef.current = dbContent
    setContent(curr => {
      if (curr === prevSaved) { baselineRef.current = dbContent; isUndoingRef.current = true; return dbContent }
      return curr
    })
  }, [files]) // eslint-disable-line

  // Auto-save + checkpoint
  useEffect(() => {
    if (!activeFile) return
    if (isUndoingRef.current) {
      isUndoingRef.current = false
      if (content === savedContentRef.current) setSaveStatus('saved')
      else setSaveStatus('modified')
      return
    }
    if (content === savedContentRef.current) { setSaveStatus('saved'); return }
    setSaveStatus('modified')
    if (sessionStartRef.current === null) sessionStartRef.current = baselineRef.current
    clearTimeout(checkpointTimer.current)
    checkpointTimer.current = setTimeout(() => {
      const before = sessionStartRef.current; sessionStartRef.current = null
      if (before !== null && before !== content) { pushToUndo(before); baselineRef.current = content }
    }, 1000)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaveStatus('saving')
      await saveContent(activeFile.path, content)
      savedContentRef.current = content; setSaveStatus('saved')
    }, 1200)
    return () => { clearTimeout(saveTimer.current); clearTimeout(checkpointTimer.current) }
  }, [content]) // eslint-disable-line

  // Keyboard shortcuts
  useEffect(() => {
    const fn = (e) => {
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      if (e.key === 's')                                { e.preventDefault(); forceSave() }
      if (e.key === 'f')                                { e.preventDefault(); setShowFind(v => !v) }
      if (e.key === 'b' && !emailMode)                  { e.preventDefault(); applyFormat('bold') }
      if (e.key === 'i' && !emailMode)                  { e.preventDefault(); applyFormat('italic') }
      if (e.key === 'k' && !emailMode)                  { e.preventDefault(); applyFormat('link') }
      if (e.key === 'z' && !e.shiftKey)                 { e.preventDefault(); performUndo() }
      if (e.key === 'y' || (e.shiftKey && e.key === 'Z')){ e.preventDefault(); performRedo() }
      if (e.key === 'Escape') { setShowFind(false); setFullScreen(false); setEmailMode(false) }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }) // no dep array

  // ── file actions ───────────────────────────────────────────────────────────
  async function openFile(node) {
    if (!isText(node.name)) return
    setActiveFile({ path: node.path, name: node.name })
    if (isMarkdown(node.name)) setViewMode('split')
    else setViewMode('source')
    setOpenTabs(prev => {
      const filtered = prev.filter(t => t.path !== node.path)
      return [{ path: node.path, name: node.name }, ...filtered].slice(0, 6)
    })
  }
  async function forceSave() {
    if (!activeFile) return
    clearTimeout(saveTimer.current); clearTimeout(checkpointTimer.current)
    if (sessionStartRef.current !== null && sessionStartRef.current !== content) {
      pushToUndo(sessionStartRef.current); baselineRef.current = content
    }
    sessionStartRef.current = null; setSaveStatus('saving')
    await saveContent(activeFile.path, content)
    savedContentRef.current = content; setSaveStatus('saved')
  }
  async function commitNewItem() {
    if (!newItemName.trim() || !newItemTarget) { setNewItemTarget(null); return }
    const node = await createNode(newItemName.trim(), newItemTarget.type, newItemTarget.parentPath)
    if (node && node.type === 'file') openFile(node)
    setNewItemTarget(null); setNewItemName('')
  }
  async function handleDelete(path, name) {
    if (!confirm(`Delete "${name}"?`)) return
    if (activeFile?.path === path || activeFile?.path.startsWith(path + '/')) {
      setActiveFile(null)
      setOpenTabs(prev => prev.filter(t => t.path !== path && !t.path.startsWith(path + '/')))
    }
    await deleteNode(path)
  }
  async function commitRename() {
    if (!renaming) return
    const result = await renameNode(renaming.path, renameValue)
    if (result && activeFile?.path === renaming.path) {
      setActiveFile({ path: result.path, name: result.name })
      setOpenTabs(prev => prev.map(t => t.path === renaming.path ? { path: result.path, name: result.name } : t))
    }
    setRenaming(null)
  }

  // ── panel resize ───────────────────────────────────────────────────────────
  function startResize(e) {
    e.preventDefault(); resizing.current = true
    const startX = e.clientX, startW = leftW
    const onMove = e => { if (resizing.current) setLeftW(Math.max(160, Math.min(500, startW + e.clientX - startX))) }
    const onUp   = () => { resizing.current = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp)
  }

  // ── context menus ──────────────────────────────────────────────────────────
  function showCtx(e, items) {
    e.preventDefault(); e.stopPropagation()
    setContextMenu({ x: Math.min(e.clientX, window.innerWidth - 180), y: Math.min(e.clientY, window.innerHeight - 200), items })
  }
  function nodeCtx(e, node) {
    showCtx(e, node.type === 'folder' ? [
      { label: '📄 New File',   action: () => { setNewItemTarget({ parentPath: node.path, type: 'file' }); setNewItemName(''); setOpenFolders(s => new Set([...s, node.path])) } },
      { label: '📁 New Folder', action: () => { setNewItemTarget({ parentPath: node.path, type: 'folder' }); setNewItemName(''); setOpenFolders(s => new Set([...s, node.path])) } },
      { sep: true },
      { label: 'Rename', action: () => { setRenaming({ path: node.path, name: node.name }); setRenameValue(node.name) } },
      { label: 'Delete', danger: true, action: () => handleDelete(node.path, node.name) },
    ] : [
      ...(isText(node.name) ? [{ label: 'Open', action: () => openFile(node) }] : []),
      { sep: true },
      { label: 'Rename', action: () => { setRenaming({ path: node.path, name: node.name }); setRenameValue(node.name) } },
      { label: 'Delete', danger: true, action: () => handleDelete(node.path, node.name) },
    ])
  }

  // ── markdown formatting ────────────────────────────────────────────────────
  function applyFormat(fmt) {
    if (activeFile) {
      clearTimeout(checkpointTimer.current)
      const before = sessionStartRef.current !== null ? sessionStartRef.current : content
      pushToUndo(before); sessionStartRef.current = null; baselineRef.current = content
    }
    const ta = textareaRef.current
    if (!ta) return
    const { selectionStart: ss, selectionEnd: se, value } = ta
    const sel = value.slice(ss, se)
    const bef = value.slice(0, ss)
    const aft = value.slice(se)
    let insert = '', cursorAt
    switch (fmt) {
      case 'bold':   insert = `**${sel || 'bold text'}**`;       cursorAt = ss + 2 + (sel.length || 9); break
      case 'italic': insert = `*${sel || 'italic text'}*`;        cursorAt = ss + 1 + (sel.length || 11); break
      case 'strike': insert = `~~${sel || 'strikethrough'}~~`;   cursorAt = ss + 2 + (sel.length || 13); break
      case 'code':   insert = sel.includes('\n') ? `\`\`\`\n${sel || 'code'}\n\`\`\`` : `\`${sel || 'code'}\``; cursorAt = ss + insert.length; break
      case 'link': { insert = `[${sel || 'link text'}](https://)`; cursorAt = ss + insert.length - 1; break }
      case 'image':  insert = `![${sel || 'alt text'}](https://)`; cursorAt = ss + insert.length - 1; break
      case 'h1':     insert = wrapLine(bef, sel || 'Heading 1', aft, '# ');  cursorAt = ss + insert.length; break
      case 'h2':     insert = wrapLine(bef, sel || 'Heading 2', aft, '## '); cursorAt = ss + insert.length; break
      case 'h3':     insert = wrapLine(bef, sel || 'Heading 3', aft, '### ');cursorAt = ss + insert.length; break
      case 'quote':  insert = wrapLine(bef, sel || 'quote', aft, '> ');      cursorAt = ss + insert.length; break
      case 'ul':     insert = wrapLine(bef, sel || 'item', aft, '- ');       cursorAt = ss + insert.length; break
      case 'ol':     insert = wrapLine(bef, sel || 'item', aft, '1. ');      cursorAt = ss + insert.length; break
      case 'hr':     insert = '\n---\n';                                      cursorAt = ss + insert.length; break
      case 'table':  insert = `\n| Column 1 | Column 2 | Column 3 |\n|---|---|---|\n| Cell | Cell | Cell |\n`; cursorAt = ss + insert.length; break
      default: return
    }
    const newVal = bef + insert + aft
    setContent(newVal); baselineRef.current = newVal; isUndoingRef.current = true
    setTimeout(() => { ta.focus(); ta.setSelectionRange(cursorAt, cursorAt) }, 0)
  }
  function wrapLine(bef, sel, aft, prefix) {
    const lineStart = bef.lastIndexOf('\n') + 1
    return bef.slice(lineStart) === '' ? prefix + sel : '\n' + prefix + sel
  }

  // ── tab key ────────────────────────────────────────────────────────────────
  function handleKeyDown(e) {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.target
      const { selectionStart: ss, selectionEnd: se, value } = ta
      const spaces = '  '
      if (e.shiftKey) {
        const lineStart = value.lastIndexOf('\n', ss - 1) + 1
        if (value.slice(lineStart, lineStart + 2) === spaces) {
          const newVal = value.slice(0, lineStart) + value.slice(lineStart + 2)
          setContent(newVal); setTimeout(() => { ta.setSelectionRange(ss - 2, se - 2) }, 0)
        }
      } else {
        const newVal = value.slice(0, ss) + spaces + value.slice(se)
        setContent(newVal); setTimeout(() => { ta.setSelectionRange(ss + 2, ss + 2) }, 0)
      }
    }
  }

  // ── download ───────────────────────────────────────────────────────────────
  function downloadFile() {
    if (!activeFile) return
    const blob = new Blob([content], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url; a.download = activeFile.name; a.click()
    URL.revokeObjectURL(url)
  }

  // ── copy HTML ──────────────────────────────────────────────────────────────
  function copyHtml() {
    navigator.clipboard?.writeText(content).then(() => {
      setCopyDone(true); setTimeout(() => setCopyDone(false), 2000)
    })
  }

  // ── find ───────────────────────────────────────────────────────────────────
  const matchCount = findQuery && content
    ? (content.match(new RegExp(findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length : 0

  // ── tree roots ─────────────────────────────────────────────────────────────
  const roots = files.filter(n => n.parent_path === '').sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  const isMd       = activeFile && isMarkdown(activeFile.name)
  const isHtml_    = activeFile && isHtml(activeFile.name)
  const canPreview = isMd || isHtml_
  const words      = getWordCount(content)

  const statusColor = saveStatus === 'saved' ? 'text-brand-success' : saveStatus === 'saving' ? 'text-brand-accent' : 'text-gray-500'
  const statusLabel = saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'saving' ? 'Saving…' : '● Unsaved'

  // ── sidebar ────────────────────────────────────────────────────────────────
  const sidebarContent = (
    <div className="glass-card sm:rounded-lg p-3 flex flex-col overflow-hidden h-full w-full">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <span className="text-white text-sm font-semibold">Files</span>
        <div className="flex gap-0.5">
          <button onClick={() => { setNewItemTarget({ parentPath: '', type: 'file' }); setNewItemName('') }} className="nav-icon" title="New File"><PlusIco /></button>
          <button onClick={() => { setNewItemTarget({ parentPath: '', type: 'folder' }); setNewItemName('') }} className="nav-icon" title="New Folder"><FolderPlus /></button>
        </div>
      </div>
      {newItemTarget?.parentPath === '' && (
        <div className="mb-2 shrink-0">
          <input autoFocus value={newItemName} onChange={e => setNewItemName(e.target.value)}
            onBlur={commitNewItem}
            onKeyDown={e => { if (e.key === 'Enter') commitNewItem(); if (e.key === 'Escape') { setNewItemTarget(null); setNewItemName('') } }}
            placeholder={newItemTarget.type === 'folder' ? 'Folder name…' : 'filename.html'}
            className="w-full bg-black/30 border border-brand-accent/40 rounded px-2 py-1 text-white text-xs outline-none"
          />
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        {roots.length === 0 && !newItemTarget && (
          <p className="text-gray-600 text-xs text-center py-6 leading-relaxed">No files yet.<br />Use the + buttons above.</p>
        )}
        {roots.map(node => (
          <div key={node.id}>
            <TreeNode node={node} files={files} activeFile={activeFile} openFolders={openFolders}
              onSelect={openFile}
              onToggle={path => setOpenFolders(s => { const n = new Set(s); n.has(path) ? n.delete(path) : n.add(path); return n })}
              onCtx={nodeCtx} renaming={renaming} renameValue={renameValue}
              setRenameValue={setRenameValue} onRenameBlur={commitRename}
              onRenameKey={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(null) }}
            />
            {newItemTarget?.parentPath === node.path && openFolders.has(node.path) && (
              <div style={{ paddingLeft: '22px' }}>
                <input autoFocus value={newItemName} onChange={e => setNewItemName(e.target.value)}
                  onBlur={commitNewItem}
                  onKeyDown={e => { if (e.key === 'Enter') commitNewItem(); if (e.key === 'Escape') { setNewItemTarget(null); setNewItemName('') } }}
                  placeholder={newItemTarget.type === 'folder' ? 'folder name' : 'file.html'}
                  className="w-full bg-black/30 border border-brand-accent/40 rounded px-2 py-0.5 text-white text-xs outline-none my-0.5"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  if (loading) return (
    <div className="p-4 pt-6 flex items-center justify-center h-[calc(100vh-136px)] sm:h-[calc(100vh-40px)]">
      <span className="text-gray-600 text-sm">Loading files…</span>
    </div>
  )

  return (
    <div
      className={`${fullScreen || emailMode ? 'fixed inset-0 z-[60] bg-brand-bg' : 'p-3 pt-4 sm:p-4 sm:pt-6 h-[calc(100vh-136px)] sm:h-[calc(100vh-40px)]'} animate-fadeIn flex gap-3`}
      onContextMenu={e => {
        if (e.target === e.currentTarget)
          showCtx(e, [
            { label: '📄 New File',   action: () => { setNewItemTarget({ parentPath: '', type: 'file' }); setNewItemName('') } },
            { label: '📁 New Folder', action: () => { setNewItemTarget({ parentPath: '', type: 'folder' }); setNewItemName('') } },
          ])
      }}
    >
      <ContextMenu menu={contextMenu} onClose={() => setContextMenu(null)} />

      {showMobileSidebar && <div className="drawer-backdrop sm:hidden" onClick={() => setShowMobileSidebar(false)} />}

      {/* LEFT SIDEBAR */}
      <div
        className={`${showMobileSidebar ? 'drawer-panel' : 'hidden'} sm:flex sm:relative sm:flex-shrink-0 sm:flex-col sm:overflow-hidden`}
        style={typeof window !== 'undefined' && window.innerWidth >= 640 ? { width: (emailMode ? Math.min(leftW, 200) : leftW) + 'px' } : {}}
      >
        {sidebarContent}
      </div>

      <div onMouseDown={startResize}
        className="hidden sm:block w-1 flex-shrink-0 cursor-col-resize rounded-full hover:bg-brand-accent/30 transition-colors"
        style={{ background: 'rgba(255,255,255,0.04)' }}
      />

      {/* RIGHT PANEL */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {!activeFile ? (
          <div className="glass-card rounded-lg h-full flex flex-col items-center justify-center text-center p-6 sm:p-8"
            onContextMenu={e => showCtx(e, [
              { label: '📄 New File',   action: () => { setNewItemTarget({ parentPath: '', type: 'file' }); setNewItemName('') } },
              { label: '📁 New Folder', action: () => { setNewItemTarget({ parentPath: '', type: 'folder' }); setNewItemName('') } },
            ])}
          >
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <p className="text-gray-400 text-sm font-medium">No file open</p>
            <p className="text-gray-600 text-xs mt-1 mb-6">Select a file from the sidebar or create one</p>
            <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
              <button onClick={() => setShowMobileSidebar(true)}
                className="sm:hidden btn-primary flex items-center justify-center gap-1.5 px-4 py-2.5 text-white rounded text-sm"
              ><MenuIco /> Browse Files</button>
              <button onClick={() => { setNewItemTarget({ parentPath: '', type: 'file' }); setNewItemName(''); setShowMobileSidebar(true) }}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded text-sm transition-all"
              ><PlusIco /> New File</button>
              <button onClick={() => { setNewItemTarget({ parentPath: '', type: 'folder' }); setNewItemName(''); setShowMobileSidebar(true) }}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded text-sm transition-all"
              ><FolderPlus /> New Folder</button>
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-lg flex flex-col overflow-hidden h-full">

            {/* Tabs */}
            {openTabs.length > 1 && (
              <div className="flex overflow-x-auto shrink-0 border-b border-white/5 px-2 pt-1 gap-1 scrollbar-hide">
                {openTabs.map(t => (
                  <button key={t.path}
                    onClick={() => openFile(files.find(f => f.path === t.path) || t)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-t text-xs whitespace-nowrap flex-shrink-0 border-b-2 transition-all
                      ${t.path === activeFile.path ? 'text-white border-brand-accent bg-white/5' : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'}`}
                  >
                    <FileIcon ext={getExt(t.name)} />
                    {t.name}
                    <span
                      onClick={e => { e.stopPropagation(); setOpenTabs(prev => prev.filter(x => x.path !== t.path)); if (t.path === activeFile.path) setActiveFile(openTabs.find(x => x.path !== t.path) || null) }}
                      className="text-gray-600 hover:text-white ml-0.5 leading-none"
                    >×</span>
                  </button>
                ))}
              </div>
            )}

            {/* ── Normal Toolbar ── */}
            <div className="flex items-center gap-1 px-2 sm:px-3 py-1.5 border-b border-white/5 shrink-0 flex-wrap">
              <button onClick={() => setShowMobileSidebar(true)} className="sm:hidden nav-icon mr-1" title="Files"><MenuIco /></button>
              <div className="flex items-center gap-1.5 flex-1 min-w-0 mr-2">
                <FileIcon ext={getExt(activeFile.name)} />
                <span className="text-white text-xs font-medium truncate">{activeFile.name}</span>
              </div>
              <TB onClick={performUndo} title="Undo (Ctrl+Z)" disabled={!canUndo}><UndoIco /></TB>
              <TB onClick={performRedo} title="Redo (Ctrl+Y)" disabled={!canRedo}><RedoIco /></TB>
              <div className="w-px h-4 bg-white/10 mx-0.5" />

              {/* Markdown toolbar (only in non-email mode) */}
              {isMd && !emailMode && (
                <div className="flex items-center gap-0.5 flex-wrap">
                  <TB onClick={() => applyFormat('bold')}   title="Bold (Ctrl+B)"><strong>B</strong></TB>
                  <TB onClick={() => applyFormat('italic')} title="Italic (Ctrl+I)"><em>I</em></TB>
                  <TB onClick={() => applyFormat('strike')} title="Strikethrough"><del>S</del></TB>
                  <div className="w-px h-4 bg-white/10 mx-0.5" />
                  <TB onClick={() => applyFormat('h1')} title="Heading 1">H1</TB>
                  <TB onClick={() => applyFormat('h2')} title="Heading 2">H2</TB>
                  <TB onClick={() => applyFormat('h3')} title="Heading 3">H3</TB>
                  <div className="w-px h-4 bg-white/10 mx-0.5" />
                  <TB onClick={() => applyFormat('code')}  title="Code">&lt;/&gt;</TB>
                  <TB onClick={() => applyFormat('link')}  title="Link (Ctrl+K)">🔗</TB>
                  <TB onClick={() => applyFormat('quote')} title="Blockquote">"</TB>
                  <TB onClick={() => applyFormat('ul')}    title="Bullet list">•</TB>
                  <TB onClick={() => applyFormat('ol')}    title="Numbered list">1.</TB>
                  <TB onClick={() => applyFormat('table')} title="Table">⊞</TB>
                  <TB onClick={() => applyFormat('hr')}    title="Divider">—</TB>
                </div>
              )}

              {/* Right controls */}
              <div className="flex items-center gap-0.5 ml-auto">
                {/* Email Mode toggle — desktop only */}
                <button
                  onClick={() => setEmailMode(v => !v)}
                  className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-all select-none
                    ${emailMode ? 'bg-brand-accent/30 text-brand-accent border border-brand-accent/40' : 'text-gray-500 hover:text-gray-200 hover:bg-white/10'}`}
                  title="Email Studio — massive toolbar for HTML email development"
                >
                  <EmailIco />
                  <span className="hidden lg:inline">{emailMode ? 'Email Studio' : 'Email'}</span>
                </button>

                {!emailMode && canPreview && (
                  <div className="flex gap-0.5 bg-white/5 rounded p-0.5">
                    {[{ v: 'source', l: 'Src' }, { v: 'preview', l: 'View' }, { v: 'split', l: 'Split' }].map(({ v, l }) => (
                      <button key={v}
                        onClick={() => setViewMode(v)}
                        className={`${v === 'split' ? 'hidden sm:inline' : ''} px-2 py-0.5 rounded text-xs transition-all
                          ${viewMode === v ? 'bg-brand-accent/80 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                      >{l}</button>
                    ))}
                  </div>
                )}
                <button onClick={() => setShowFind(v => !v)} className={`nav-icon ${showFind ? 'text-brand-accent' : ''}`} title="Find (Ctrl+F)"><SearchIco /></button>
                <button onClick={downloadFile} className="nav-icon" title="Download"><DownloadIco /></button>
                {!emailMode && (
                  <button onClick={() => setFullScreen(v => !v)} className="nav-icon hidden sm:flex" title="Full screen">
                    {fullScreen ? <ExitFull /> : <FullIco />}
                  </button>
                )}
                {emailMode && (
                  <button onClick={() => setEmailMode(false)} className="nav-icon hidden sm:flex text-brand-accent" title="Exit Email Studio (Esc)">
                    <ExitFull />
                  </button>
                )}
                <button onClick={forceSave} className={`nav-icon ${statusColor}`} title="Save (Ctrl+S)"><SaveIco /></button>
              </div>
            </div>

            {/* ── Email Studio Toolbar (desktop only, 4 rows) ── */}
            {emailMode && (
              <div className="hidden sm:block border-b border-white/5 bg-black/20 shrink-0">

                {/* ROW 1 — Text & Structure */}
                <div className="flex items-center gap-0.5 px-2 py-1 border-b border-white/[0.04] flex-wrap">
                  <span className="text-[9px] text-gray-600 font-mono uppercase tracking-wider mr-1 select-none">Format</span>
                  <ETB onClick={() => wrapHtml('<strong>', '</strong>')} title="Bold"><strong>B</strong></ETB>
                  <ETB onClick={() => wrapHtml('<em>', '</em>')} title="Italic"><em>I</em></ETB>
                  <ETB onClick={() => wrapHtml('<u>', '</u>')} title="Underline"><u>U</u></ETB>
                  <ETB onClick={() => wrapHtml('<s>', '</s>')} title="Strikethrough"><s>S</s></ETB>
                  <Sep />
                  <ETB onClick={() => wrapHtml('<h1 style="font-family:Arial,sans-serif;font-size:32px;color:#1a1a1a;margin:0 0 16px;font-weight:700;">', '</h1>')} title="H1 — email heading">H1</ETB>
                  <ETB onClick={() => wrapHtml('<h2 style="font-family:Arial,sans-serif;font-size:24px;color:#1a1a1a;margin:0 0 12px;font-weight:700;">', '</h2>')} title="H2">H2</ETB>
                  <ETB onClick={() => wrapHtml('<h3 style="font-family:Arial,sans-serif;font-size:20px;color:#1a1a1a;margin:0 0 10px;font-weight:600;">', '</h3>')} title="H3">H3</ETB>
                  <ETB onClick={() => wrapHtml('<h4 style="font-family:Arial,sans-serif;font-size:16px;color:#1a1a1a;margin:0 0 8px;font-weight:600;">', '</h4>')} title="H4">H4</ETB>
                  <Sep />
                  <ETB onClick={() => wrapHtml('<p style="font-family:Arial,sans-serif;font-size:15px;color:#555555;line-height:1.7;margin:0 0 16px;">', '</p>')} title="Paragraph tag">&lt;p&gt;</ETB>
                  <ETB onClick={() => wrapHtml('<div style="', '">')} title="Div wrapper">div</ETB>
                  <ETB onClick={() => wrapHtml('<span style="', '">')} title="Inline span">span</ETB>
                  <Sep />
                  <ETB onClick={() => wrapHtml('<ul style="margin:0 0 16px;padding-left:24px;color:#555;font-family:Arial,sans-serif;font-size:14px;">\n  <li>', '</li>\n</ul>')} title="Unordered list">• List</ETB>
                  <ETB onClick={() => wrapHtml('<ol style="margin:0 0 16px;padding-left:24px;color:#555;font-family:Arial,sans-serif;font-size:14px;">\n  <li>', '</li>\n</ol>')} title="Ordered list">1. List</ETB>
                  <ETB onClick={() => wrapHtml('<li style="margin-bottom:6px;">', '</li>')} title="List item">li</ETB>
                  <Sep />
                  <ETB onClick={() => wrapHtml('<div style="text-align:left;">', '</div>')} title="Align left">⬅L</ETB>
                  <ETB onClick={() => wrapHtml('<div style="text-align:center;">', '</div>')} title="Align center">≡C</ETB>
                  <ETB onClick={() => wrapHtml('<div style="text-align:right;">', '</div>')} title="Align right">➡R</ETB>
                  <Sep />
                  <ETB onClick={() => wrapHtml('<a href="https://" style="color:#c45e2c;text-decoration:underline;font-family:Arial,sans-serif;">', '</a>')} title="Hyperlink">🔗 Link</ETB>
                  <ETB onClick={() => insertHtml('<img src="https://" alt="" width="600" style="max-width:100%;height:auto;display:block;margin:0 auto;" />')} title="Image tag">🖼 Img</ETB>
                </div>

                {/* ROW 2 — Inline Style Tools */}
                <div className="flex items-center gap-1.5 px-2 py-1 border-b border-white/[0.04] flex-wrap">
                  <span className="text-[9px] text-gray-600 font-mono uppercase tracking-wider mr-0.5 select-none">Style</span>

                  {/* Font family */}
                  <select value={emailFontFamily}
                    onChange={e => { setEmailFontFamily(e.target.value); wrapHtml(`<span style="font-family:${e.target.value};">`, '</span>') }}
                    className="bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-gray-300 text-[11px] outline-none cursor-pointer hover:border-white/20"
                  >
                    {EMAIL_FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>

                  {/* Font size */}
                  <select value={emailFontSize}
                    onChange={e => { setEmailFontSize(e.target.value); wrapHtml(`<span style="font-size:${e.target.value}px;">`, '</span>') }}
                    className="bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-gray-300 text-[11px] outline-none cursor-pointer hover:border-white/20 w-20"
                  >
                    {EMAIL_SIZES.map(s => <option key={s} value={s}>{s}px</option>)}
                  </select>

                  <Sep />

                  {/* Text color */}
                  <div className="relative">
                    <button
                      onMouseDown={e => { e.preventDefault(); setShowColorPicker(v => v === 'text' ? null : 'text') }}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                      title="Text color"
                    >
                      <span className="inline-block w-3 h-3 rounded-sm border border-white/20" style={{ background: '#c45e2c' }} />
                      A
                    </button>
                    {showColorPicker === 'text' && <ColorSwatches onSelect={c => applyColor('color', c)} />}
                  </div>

                  {/* BG color */}
                  <div className="relative">
                    <button
                      onMouseDown={e => { e.preventDefault(); setShowColorPicker(v => v === 'bg' ? null : 'bg') }}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                      title="Background color"
                    >
                      <span className="inline-block w-3 h-3 rounded-sm border border-white/20" style={{ background: '#1a1a1a' }} />
                      BG
                    </button>
                    {showColorPicker === 'bg' && <ColorSwatches onSelect={c => applyColor('background-color', c)} />}
                  </div>

                  <Sep />
                  <span className="text-[9px] text-gray-600 select-none">Pad:</span>
                  {['4px','8px','12px','16px','20px','24px','32px','40px'].map(p => (
                    <ETB key={p} onClick={() => applyPadding(p)} title={`padding: ${p}`}>{p}</ETB>
                  ))}
                  <Sep />
                  <span className="text-[9px] text-gray-600 select-none">Radius:</span>
                  {['0','2px','4px','6px','8px','12px','16px','50%'].map(r => (
                    <ETB key={r} onClick={() => applyInlineProp('border-radius', r)} title={`border-radius: ${r}`}>{r}</ETB>
                  ))}
                  <Sep />
                  <span className="text-[9px] text-gray-600 select-none">Weight:</span>
                  {['400','500','600','700','800','900'].map(w => (
                    <ETB key={w} onClick={() => applyInlineProp('font-weight', w)} title={`font-weight: ${w}`}>{w}</ETB>
                  ))}
                  <Sep />
                  <span className="text-[9px] text-gray-600 select-none">Line-h:</span>
                  {['1','1.2','1.4','1.6','1.7','1.8','2'].map(l => (
                    <ETB key={l} onClick={() => applyInlineProp('line-height', l)} title={`line-height: ${l}`}>{l}</ETB>
                  ))}
                </div>

                {/* ROW 3 — Email Blocks & Templates */}
                <div className="flex items-center gap-0.5 px-2 py-1 border-b border-white/[0.04] flex-wrap">
                  <span className="text-[9px] text-gray-600 font-mono uppercase tracking-wider mr-1 select-none">Blocks</span>
                  <ETB onClick={() => insertHtml(SNIP.fullTemplate())} title="Full HTML email template — complete boilerplate" accent>📧 Full Email</ETB>
                  <ETB onClick={() => insertHtml(SNIP.newsletter())} title="Newsletter multi-story layout" accent>📰 Newsletter</ETB>
                  <ETB onClick={() => insertHtml(SNIP.promo())} title="Dark promotional email" accent>🎯 Promo</ETB>
                  <Sep />
                  <ETB onClick={() => insertHtml(SNIP.header())} title="Email header block">Header</ETB>
                  <ETB onClick={() => insertHtml(SNIP.footer())} title="Email footer with links">Footer</ETB>
                  <ETB onClick={() => insertHtml(SNIP.heroSection())} title="Hero banner section">Hero</ETB>
                  <ETB onClick={() => insertHtml(SNIP.twoCol())} title="Two-column table layout">2-Col</ETB>
                  <ETB onClick={() => insertHtml(SNIP.threeCol())} title="Three-column table layout">3-Col</ETB>
                  <ETB onClick={() => insertHtml(SNIP.ctaButton())} title="Email-safe CTA button (table method)">CTA Btn</ETB>
                  <ETB onClick={() => insertHtml(SNIP.productCard())} title="Product showcase card">Product</ETB>
                  <ETB onClick={() => insertHtml(SNIP.socialLinks())} title="Social media link buttons">Social</ETB>
                  <ETB onClick={() => insertHtml(SNIP.testimonial())} title="Customer testimonial block">Testimonial</ETB>
                  <ETB onClick={() => insertHtml(SNIP.imageBlock())} title="Full-width image block">Image Block</ETB>
                  <ETB onClick={() => insertHtml(SNIP.divider())} title="Section divider / horizontal rule">Divider</ETB>
                  <ETB onClick={() => insertHtml(SNIP.emailTable())} title="Email-safe data table">Table</ETB>
                  <Sep />
                  <ETB onClick={() => insertHtml(SNIP.outlook())} title="Outlook conditional comments">Outlook</ETB>
                  <ETB onClick={() => insertHtml(SNIP.gif())} title="Animated GIF with Outlook fallback">GIF</ETB>
                </div>

                {/* ROW 4 — Spacing, Code & Dev Tools */}
                <div className="flex items-center gap-0.5 px-2 py-1 flex-wrap">
                  <span className="text-[9px] text-gray-600 font-mono uppercase tracking-wider mr-1 select-none">Space / Dev</span>
                  <ETB onClick={() => insertHtml('<br />')} title="Line break">&lt;br&gt;</ETB>
                  <ETB onClick={() => insertHtml('<hr style="border:none;border-top:1px solid #eeeeee;margin:24px 0;" />')} title="Horizontal rule">&lt;hr&gt;</ETB>
                  <Sep />
                  <span className="text-[9px] text-gray-600 select-none">Spacer:</span>
                  {['8','10','16','20','24','32','40','48','60'].map(n => (
                    <ETB key={n} onClick={() => insertHtml(`<div style="height:${n}px;line-height:${n}px;font-size:1px;mso-line-height-rule:exactly;">&nbsp;</div>`)} title={`${n}px email spacer`}>{n}</ETB>
                  ))}
                  <Sep />
                  <ETB onClick={() => insertHtml(SNIP.preheader())} title="Hidden preheader preview text">Preheader</ETB>
                  <ETB onClick={() => insertHtml(SNIP.mediaQuery())} title="Responsive + dark mode CSS">@media</ETB>
                  <ETB onClick={() => wrapHtml('<!--[if mso]><![endif]-->\n<!--[if !mso]><!-->', '\n<!--<![endif]-->')} title="Hide from Outlook">!Outlook</ETB>
                  <ETB onClick={() => wrapHtml('<!-- ', ' -->')} title="HTML comment">Comment</ETB>
                  <Sep />
                  <ETB onClick={() => wrapHtml('<div style="display:none;">', '</div>')} title="Hide element">Hide</ETB>
                  <ETB onClick={() => wrapHtml('<div style="display:block;">', '</div>')} title="Show element">Show</ETB>
                  <ETB onClick={() => wrapHtml('<div class="mobile-hide" style="">', '</div>')} title="Hide on mobile (with @media)">📱 Hide</ETB>
                  <Sep />
                  <ETB onClick={copyHtml} title="Copy all HTML to clipboard" accent>
                    <span className="flex items-center gap-1"><CopyIco />{copyDone ? '✓ Copied' : 'Copy HTML'}</span>
                  </ETB>
                  <ETB
                    onClick={() => {
                      // Basic HTML format / pretty-print (indent tags)
                      try {
                        const formatted = content
                          .replace(/>\s*</g, '>\n<')
                          .split('\n').map((l, i) => {
                            const depth = (l.match(/<[^/!][^>]*>/g) || []).length - (l.match(/<\/[^>]*>/g) || []).length
                            return l.trim()
                          }).join('\n')
                        if (activeFile) { pushToUndo(content); baselineRef.current = content; isUndoingRef.current = true }
                        setContent(formatted)
                      } catch {}
                    }}
                    title="Basic HTML format (split tags to separate lines)"
                  >Format</ETB>
                </div>
              </div>
            )}

            {/* Find bar */}
            {showFind && (
              <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/5 bg-black/20 shrink-0">
                <SearchIco />
                <input autoFocus value={findQuery} onChange={e => setFindQuery(e.target.value)}
                  placeholder="Find in file…"
                  className="flex-1 bg-transparent text-white text-xs outline-none placeholder-gray-600"
                />
                {findQuery && <span className="text-xs text-gray-500">{matchCount} match{matchCount !== 1 ? 'es' : ''}</span>}
                <button onClick={() => { setShowFind(false); setFindQuery('') }} className="nav-icon"><CloseIco /></button>
              </div>
            )}

            {/* ── Editor area ── */}
            <div className="flex-1 overflow-hidden flex min-h-0">

              {/* Source editor — always shown, narrower in email split */}
              {(emailMode || viewMode === 'source' || viewMode === 'split') && (
                <div className={`flex flex-col overflow-hidden ${emailMode ? 'w-[55%] border-r border-white/5' : viewMode === 'split' ? 'w-1/2 border-r border-white/5' : 'w-full'}`}>
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onKeyUp={e => { const { selectionStart: ss, value } = e.target; setCursorPos(getCursorPos(value, ss)) }}
                    onClick={e => { const { selectionStart: ss, value } = e.target; setCursorPos(getCursorPos(value, ss)) }}
                    spellCheck={false}
                    className="source-editor flex-1 w-full resize-none"
                    style={{ maxHeight: 'none', height: '100%', minHeight: 'unset', borderRadius: 0, border: 'none' }}
                    placeholder={
                      emailMode
                        ? '<!-- Start with a template: hit "📧 Full Email" above to get a complete boilerplate -->'
                        : isMd ? '# Heading\n\nStart writing…\n\nTip: Ctrl+Z undo, Ctrl+Y redo. History persists across sessions.'
                        : 'Start typing…'
                    }
                  />
                </div>
              )}

              {/* Preview / email preview right panel */}
              {((!emailMode && (viewMode === 'preview' || viewMode === 'split')) || emailMode) && (
                <div className={`overflow-hidden flex flex-col ${emailMode ? 'w-[45%]' : 'w-full sm:w-1/2'}`}>

                  {/* Email mode: preview width toggle + metadata panel */}
                  {emailMode ? (
                    <>
                      {/* Preview controls */}
                      <div className="flex items-center gap-1 px-2 py-1 border-b border-white/5 bg-black/20 shrink-0">
                        <span className="text-[10px] text-gray-600 mr-1">Preview:</span>
                        {[['Full','100%',<MonitorIco key="m"/>],['600px','600px',null],['Mobile','375px',<PhoneIco key="p"/>]].map(([l,v,ico]) => (
                          <button key={v} onMouseDown={e => { e.preventDefault(); setEmailPreviewWidth(v) }}
                            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] transition-all ${emailPreviewWidth === v ? 'bg-brand-accent/30 text-brand-accent' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}
                          >{ico}{l}</button>
                        ))}
                        <span className="ml-auto text-[10px] text-gray-600">{content.length.toLocaleString()} chars</span>
                      </div>

                      {/* iframe email preview */}
                      <div className="flex-1 overflow-auto bg-[#e8e8e8] flex justify-center min-h-0">
                        <div style={{ width: emailPreviewWidth, maxWidth: '100%', minHeight: '100%' }}>
                          <iframe
                            srcDoc={content}
                            className="border-0"
                            style={{ width: '100%', minHeight: '500px', display: 'block' }}
                            sandbox="allow-scripts"
                            title="Email preview"
                          />
                        </div>
                      </div>

                      {/* Email metadata panel */}
                      <div className="border-t border-white/5 bg-black/30 p-2.5 space-y-2 shrink-0">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[9px] text-gray-500 font-mono uppercase tracking-wider">Subject Line</label>
                            <span className={`text-[10px] font-mono tabular-nums ${emailSubject.length > 60 ? 'text-red-400' : emailSubject.length > 40 ? 'text-yellow-400' : 'text-gray-600'}`}>
                              {emailSubject.length}/60
                            </span>
                          </div>
                          <input
                            value={emailSubject}
                            onChange={e => setEmailSubject(e.target.value)}
                            placeholder="Email subject line…"
                            className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-xs outline-none focus:border-brand-accent/50 placeholder-gray-600"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[9px] text-gray-500 font-mono uppercase tracking-wider">Preheader Text</label>
                            <span className={`text-[10px] font-mono tabular-nums ${emailPreheader.length > 100 ? 'text-red-400' : 'text-gray-600'}`}>
                              {emailPreheader.length}/100
                            </span>
                          </div>
                          <input
                            value={emailPreheader}
                            onChange={e => setEmailPreheader(e.target.value)}
                            placeholder="Preview text shown in inbox before opening…"
                            className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-xs outline-none focus:border-brand-accent/50 placeholder-gray-600"
                          />
                        </div>
                        <div className="flex items-center justify-between pt-0.5">
                          <div className="flex gap-3 text-[10px] text-gray-600 tabular-nums">
                            <span>{content.split('\n').length} lines</span>
                            <span>{words} words</span>
                            <span>{(new Blob([content]).size / 1024).toFixed(1)} KB</span>
                          </div>
                          <button
                            onMouseDown={e => { e.preventDefault(); copyHtml() }}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-all ${copyDone ? 'bg-brand-success/20 text-brand-success' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'}`}
                          >
                            <CopyIco />{copyDone ? 'Copied!' : 'Copy HTML'}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    // Normal preview (markdown or HTML)
                    <div className={`overflow-auto p-5 ${viewMode === 'split' ? 'h-full' : 'w-full h-full'}`}>
                      {isMd ? (
                        <div className="markdown-preview text-sm text-gray-300 max-w-none"
                          dangerouslySetInnerHTML={{ __html: renderMd(content) }} />
                      ) : (
                        <iframe srcDoc={content} className="w-full h-full rounded border-0" sandbox="allow-scripts" title="preview" />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Status bar */}
            <div className="flex items-center gap-3 sm:gap-4 px-3 py-1 border-t border-white/5 shrink-0 text-xs select-none">
              <span className={`font-medium ${statusColor}`}>{statusLabel}</span>
              {canUndo && <span className="text-gray-700">{undoRef.current.length} undo</span>}
              <span className="text-gray-600">Ln {cursorPos.line}, Col {cursorPos.col}</span>
              <span className="text-gray-600">{content.split('\n').length} lines</span>
              {isMd && !emailMode && <>
                <span className="text-gray-600">{words} words</span>
                <span className="text-gray-600">{getReadTime(content)} min read</span>
              </>}
              {emailMode && (
                <span className="text-brand-accent text-[10px] font-medium">✉ Email Studio</span>
              )}
              <span className="ml-auto text-gray-700">{(new Blob([content]).size / 1024).toFixed(1)} KB</span>
              <span className="text-gray-700">{getExt(activeFile.name).toUpperCase() || 'TXT'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
