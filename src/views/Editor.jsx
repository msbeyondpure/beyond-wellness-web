/* eslint-disable react/prop-types */
import { useState, useEffect, useMemo, useRef } from 'react'
import { useEditorFiles } from '../hooks/useEditorFiles'
import SelectionBar from '../components/SelectionBar'
import { copyToClipboard, isEditingTarget, useMultiSelection } from '../hooks/useMultiSelection'

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

const PlusIco    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
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
const CopyIco    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
const ChevDownIco= () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>

// ── file type helpers ─────────────────────────────────────────────────────────
const getExt    = (name) => { const p = name.lastIndexOf('.'); return p > 0 ? name.slice(p + 1).toLowerCase() : '' }
const isMarkdown= (name) => ['md','markdown'].includes(getExt(name))
const isHtml    = (name) => ['html','htm'].includes(getExt(name))
const isText    = (name) => ['md','markdown','txt','html','htm','js','jsx','ts','tsx','css','json','xml','csv','sh','py','rb','go','yaml','yml','toml','sql'].includes(getExt(name))

// ── persistent undo helpers ───────────────────────────────────────────────────
const UNDO_KEY = (p) => `bwUndo:${p}`
const REDO_KEY = (p) => `bwRedo:${p}`
const MAX_HIST = 100
const getFileSelectionId = node => node.path
function loadStack(key) { try { return JSON.parse(localStorage.getItem(key)) || [] } catch { return [] } }
function saveStack(key, arr) { try { localStorage.setItem(key, JSON.stringify(arr)) } catch { /* ignore storage failures */ } }

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function normalizeSafeUrl(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  if (/^(https?:|mailto:|tel:|cid:|#|\/(?!\/)|\.{1,2}\/)/i.test(text)) return text
  return ''
}

function safeUrl(value, fallback = '#') {
  return escapeAttr(normalizeSafeUrl(value) || fallback)
}

function sanitizeHtml(html) {
  if (typeof DOMParser === 'undefined') return escapeHtml(html)
  const doc = new DOMParser().parseFromString(String(html || ''), 'text/html')
  doc.querySelectorAll('script,iframe,object,embed,link,meta,base,form,input,button,textarea,select,style').forEach(node => node.remove())
  doc.body.querySelectorAll('*').forEach(node => {
    Array.from(node.attributes).forEach(attr => {
      const name = attr.name.toLowerCase()
      if (name.startsWith('on') || name === 'srcdoc') {
        node.removeAttribute(attr.name)
      } else if (name === 'href' || name === 'src' || name === 'xlink:href') {
        const normalized = normalizeSafeUrl(attr.value)
        if (normalized) node.setAttribute(attr.name, normalized)
        else node.removeAttribute(attr.name)
      }
    })
  })
  return doc.body.innerHTML
}

// ── markdown renderer ─────────────────────────────────────────────────────────
function renderMd(md) {
  if (!md) return ''
  let html = escapeHtml(md)
    .replace(/```([\w]*)\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre class="md-code-block"><code class="lang-${escapeAttr(lang)}">${code.trimEnd()}</code></pre>`)
    .replace(/^#{6}\s+(.+)$/gm,'<h6>$1</h6>').replace(/^#{5}\s+(.+)$/gm,'<h5>$1</h5>')
    .replace(/^#{4}\s+(.+)$/gm,'<h4>$1</h4>').replace(/^###\s+(.+)$/gm,'<h3>$1</h3>')
    .replace(/^##\s+(.+)$/gm,'<h2>$1</h2>').replace(/^#\s+(.+)$/gm,'<h1>$1</h1>')
    .replace(/^>\s+(.+)$/gm,'<blockquote>$1</blockquote>').replace(/^---+$/gm,'<hr>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/~~(.+?)~~/g,'<del>$1</del>').replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, (_, label, url) =>
      `<a href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`)
    .replace(/^[-*]\s+(.+)$/gm,'<li>$1</li>').replace(/(<li>.*<\/li>\n?)+/g, s => `<ul>${s}</ul>`)
    .replace(/^\d+\.\s+(.+)$/gm,'<li>$1</li>').replace(/\n\n/g,'</p><p>')
  return `<p>${html}</p>`
}

// ── html toolkit constants ────────────────────────────────────────────────────
const HTML_COLORS = [
  '#000000','#111111','#333333','#555555','#777777','#999999','#bbbbbb','#dddddd','#ffffff',
  '#c45e2c','#d4722f','#8b9a3e','#6b7a2e','#1d4ed8','#3b82f6','#93c5fd',
  '#dc2626','#ef4444','#fca5a5','#d97706','#f59e0b','#fcd34d',
  '#059669','#10b981','#6ee7b7','#7c3aed','#8b5cf6','#c4b5fd',
  '#db2777','#ec4899','#f9a8d4','#0891b2','#06b6d4','#67e8f9',
]
const HTML_FONTS = [
  { label: 'Albert Sans',  value: "'Albert Sans', Arial, sans-serif" },
  { label: 'Arial',        value: 'Arial, Helvetica, sans-serif' },
  { label: 'Helvetica',    value: 'Helvetica, Arial, sans-serif' },
  { label: 'Georgia',      value: 'Georgia, Times, serif' },
  { label: 'Times NR',     value: "'Times New Roman', Times, serif" },
  { label: 'Verdana',      value: 'Verdana, Geneva, sans-serif' },
  { label: 'Trebuchet',    value: "'Trebuchet MS', Helvetica, sans-serif" },
  { label: 'Courier',      value: "'Courier New', Courier, monospace" },
  { label: 'Impact',       value: 'Impact, Charcoal, sans-serif' },
]
const HTML_SIZES = ['10','11','12','13','14','15','16','17','18','20','22','24','26','28','32','36','40','48','60','72']
// weights each font actually ships — drives the adaptive weight dropdown
const FONT_WEIGHT_MAP = {
  "'Albert Sans', Arial, sans-serif":          ['300','400','500','600','700'],
  'Arial, Helvetica, sans-serif':              ['400','700'],
  'Helvetica, Arial, sans-serif':              ['400','700'],
  'Georgia, Times, serif':                     ['400','700'],
  "'Times New Roman', Times, serif":           ['400','700'],
  'Verdana, Geneva, sans-serif':               ['400','700'],
  "'Trebuchet MS', Helvetica, sans-serif":     ['400','700'],
  "'Courier New', Courier, monospace":         ['400','700'],
  'Impact, Charcoal, sans-serif':              ['400'],        // Impact is inherently heavy
}
const WEIGHT_LABELS = { '300':'Light','400':'Regular','500':'Medium','600':'SemiBold','700':'Bold','800':'ExtraBold','900':'Black' }

// ── snippet library ───────────────────────────────────────────────────────────
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
    <tr><td style="background:#1a1a1a;padding:28px 30px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;letter-spacing:1px;font-family:Arial,sans-serif;">YOUR BRAND</h1>
    </td></tr>
    <tr><td style="padding:40px 30px 30px;text-align:center;">
      <h2 style="color:#1a1a1a;margin:0 0 12px;font-size:26px;line-height:1.3;font-family:Arial,sans-serif;">Email Heading Goes Here</h2>
      <p style="color:#666;margin:0 0 24px;font-size:15px;line-height:1.7;font-family:Arial,sans-serif;">Your opening message goes here.</p>
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
        <td style="border-radius:4px;background:#c45e2c;">
          <a href="https://yoursite.com" style="display:inline-block;padding:14px 36px;color:#fff;text-decoration:none;font-weight:700;font-size:15px;font-family:Arial,sans-serif;">Shop Now →</a>
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:0 30px 30px;">
      <hr style="border:none;border-top:1px solid #eee;margin:0 0 30px;" />
      <h3 style="color:#1a1a1a;margin:0 0 10px;font-size:18px;font-family:Arial,sans-serif;">Section Heading</h3>
      <p style="color:#555;margin:0;font-size:14px;line-height:1.7;font-family:Arial,sans-serif;">Supporting content here.</p>
    </td></tr>
    <tr><td style="background:#f8f8f8;padding:20px 30px;text-align:center;border-top:1px solid #eee;">
      <p style="color:#999;font-size:12px;margin:0 0 6px;font-family:Arial,sans-serif;">© 2024 Your Company · 123 Main St, City, ST 12345</p>
      <p style="color:#999;font-size:12px;margin:0;font-family:Arial,sans-serif;">
        <a href="#" style="color:#c45e2c;text-decoration:underline;">Unsubscribe</a> &nbsp;·&nbsp;
        <a href="#" style="color:#c45e2c;text-decoration:underline;">View in browser</a>
      </p>
    </td></tr>
  </table>
</td></tr></table>
</body>
</html>`,

  newsletter: () => `<table cellpadding="0" cellspacing="0" width="100%" style="background:#f4f4f4;">
<tr><td align="center" style="padding:30px 20px;">
  <table cellpadding="0" cellspacing="0" width="600" style="background:#fff;border-radius:8px;overflow:hidden;">
    <tr><td style="padding:24px 30px;border-bottom:2px solid #c45e2c;">
      <table width="100%"><tr>
        <td><span style="font-size:20px;font-weight:700;color:#1a1a1a;font-family:Georgia,serif;">The Weekly</span></td>
        <td align="right"><span style="font-size:12px;color:#999;font-family:Arial,sans-serif;">Issue #001</span></td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:30px;">
      <h2 style="color:#1a1a1a;margin:8px 0 12px;font-size:22px;font-family:Georgia,serif;">Newsletter Headline</h2>
      <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 16px;font-family:Arial,sans-serif;">Feature story intro text here.</p>
      <a href="#" style="color:#c45e2c;font-size:13px;font-weight:600;text-decoration:none;font-family:Arial,sans-serif;">Read more →</a>
    </td></tr>
    <tr><td style="background:#1a1a1a;padding:20px 30px;text-align:center;">
      <p style="color:#666;font-size:11px;margin:0;font-family:Arial,sans-serif;">
        <a href="#" style="color:#c45e2c;text-decoration:none;">Unsubscribe</a>
      </p>
    </td></tr>
  </table>
</td></tr></table>`,

  promo: () => `<table cellpadding="0" cellspacing="0" width="100%" style="background:#1a1a1a;">
<tr><td align="center">
  <table cellpadding="0" cellspacing="0" width="600" style="background:#1a1a1a;">
    <tr><td style="padding:60px 40px;text-align:center;">
      <p style="color:#c45e2c;font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px;font-family:Arial,sans-serif;">Limited Time</p>
      <h1 style="color:#fff;font-size:56px;font-weight:900;margin:0 0 8px;font-family:Arial,sans-serif;line-height:1;">30% OFF</h1>
      <p style="color:#aaa;font-size:16px;margin:0 0 32px;font-family:Arial,sans-serif;">Ends Sunday.</p>
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
        <td style="border-radius:4px;background:#c45e2c;">
          <a href="https://yoursite.com" style="display:inline-block;padding:16px 48px;color:#fff;text-decoration:none;font-weight:700;font-size:16px;font-family:Arial,sans-serif;">SHOP NOW →</a>
        </td>
      </tr></table>
      <p style="color:#666;font-size:12px;margin:20px 0 0;font-family:Arial,sans-serif;">Code: <strong style="color:#c45e2c;">SAVE30</strong></p>
    </td></tr>
    <tr><td style="padding:16px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
      <p style="color:#555;font-size:11px;margin:0;font-family:Arial,sans-serif;"><a href="#" style="color:#c45e2c;text-decoration:none;">Unsubscribe</a></p>
    </td></tr>
  </table>
</td></tr></table>`,

  header: () => `<table cellpadding="0" cellspacing="0" width="100%" style="background:#1a1a1a;">
  <tr><td style="padding:28px 30px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;letter-spacing:2px;font-family:Arial,sans-serif;">YOUR BRAND</h1>
  </td></tr>
</table>`,

  footer: () => `<table cellpadding="0" cellspacing="0" width="100%" style="background:#f8f8f8;border-top:1px solid #eee;">
  <tr><td style="padding:24px 30px;text-align:center;">
    <p style="color:#999;font-size:12px;margin:0 0 8px;font-family:Arial,sans-serif;">© 2024 Your Company · 123 Main St, City, ST 12345</p>
    <p style="color:#999;font-size:12px;margin:0;font-family:Arial,sans-serif;">
      <a href="#" style="color:#c45e2c;text-decoration:underline;">Unsubscribe</a> &nbsp;·&nbsp;
      <a href="#" style="color:#c45e2c;text-decoration:underline;">View in browser</a> &nbsp;·&nbsp;
      <a href="#" style="color:#c45e2c;text-decoration:underline;">Privacy Policy</a>
    </p>
  </td></tr>
</table>`,

  heroSection: () => `<table cellpadding="0" cellspacing="0" width="100%" style="background:#f9f9f9;">
  <tr><td style="padding:60px 30px;text-align:center;">
    <h1 style="color:#1a1a1a;margin:0 0 16px;font-size:36px;line-height:1.2;font-family:Arial,sans-serif;font-weight:900;">Hero Headline</h1>
    <p style="color:#666;font-size:17px;line-height:1.7;margin:0 auto 32px;max-width:480px;font-family:Arial,sans-serif;">Subheadline that draws the reader deeper.</p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
      <td style="border-radius:4px;background:#c45e2c;">
        <a href="https://yoursite.com" style="display:inline-block;padding:14px 36px;color:#fff;text-decoration:none;font-weight:700;font-size:15px;font-family:Arial,sans-serif;">Get Started →</a>
      </td>
    </tr></table>
  </td></tr>
</table>`,

  twoCol: () => `<table cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td width="48%" valign="top" style="padding:20px;">
      <h3 style="color:#1a1a1a;margin:0 0 10px;font-size:17px;font-family:Arial,sans-serif;">Left Heading</h3>
      <p style="color:#555;font-size:14px;line-height:1.6;margin:0;font-family:Arial,sans-serif;">Left column content.</p>
    </td>
    <td width="4%" style="font-size:0;">&nbsp;</td>
    <td width="48%" valign="top" style="padding:20px;">
      <h3 style="color:#1a1a1a;margin:0 0 10px;font-size:17px;font-family:Arial,sans-serif;">Right Heading</h3>
      <p style="color:#555;font-size:14px;line-height:1.6;margin:0;font-family:Arial,sans-serif;">Right column content.</p>
    </td>
  </tr>
</table>`,

  threeCol: () => `<table cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td width="32%" valign="top" style="padding:16px;text-align:center;">
      <h4 style="color:#1a1a1a;margin:0 0 8px;font-size:15px;font-family:Arial,sans-serif;">Col 1</h4>
      <p style="color:#555;font-size:13px;line-height:1.6;margin:0;font-family:Arial,sans-serif;">Content.</p>
    </td>
    <td width="2%" style="font-size:0;">&nbsp;</td>
    <td width="32%" valign="top" style="padding:16px;text-align:center;">
      <h4 style="color:#1a1a1a;margin:0 0 8px;font-size:15px;font-family:Arial,sans-serif;">Col 2</h4>
      <p style="color:#555;font-size:13px;line-height:1.6;margin:0;font-family:Arial,sans-serif;">Content.</p>
    </td>
    <td width="2%" style="font-size:0;">&nbsp;</td>
    <td width="32%" valign="top" style="padding:16px;text-align:center;">
      <h4 style="color:#1a1a1a;margin:0 0 8px;font-size:15px;font-family:Arial,sans-serif;">Col 3</h4>
      <p style="color:#555;font-size:13px;line-height:1.6;margin:0;font-family:Arial,sans-serif;">Content.</p>
    </td>
  </tr>
</table>`,

  ctaButton: () => `<table cellpadding="0" cellspacing="0" style="margin:24px auto;">
  <tr>
    <td style="border-radius:4px;background:#c45e2c;text-align:center;">
      <a href="https://yoursite.com" style="display:inline-block;padding:14px 36px;color:#fff;text-decoration:none;font-weight:700;font-size:15px;font-family:Arial,Helvetica,sans-serif;line-height:1;">Click Here →</a>
    </td>
  </tr>
</table>`,

  productCard: () => `<table cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #eee;border-radius:6px;overflow:hidden;margin:16px 0;">
  <tr><td>
    <div style="background:#f5f5f5;height:180px;text-align:center;line-height:180px;">
      <img src="https://yoursite.com/product.jpg" alt="Product" width="200" style="max-width:100%;height:auto;vertical-align:middle;" />
    </div>
  </td></tr>
  <tr><td style="padding:20px;">
    <h3 style="color:#1a1a1a;margin:0 0 6px;font-size:18px;font-family:Arial,sans-serif;">Product Name</h3>
    <p style="color:#666;font-size:13px;line-height:1.6;margin:0 0 16px;font-family:Arial,sans-serif;">Brief product description.</p>
    <table cellpadding="0" cellspacing="0" width="100%"><tr>
      <td><span style="font-size:22px;font-weight:700;color:#c45e2c;font-family:Arial,sans-serif;">$XX.XX</span></td>
      <td align="right"><table cellpadding="0" cellspacing="0"><tr>
        <td style="border-radius:4px;background:#c45e2c;">
          <a href="#" style="display:inline-block;padding:10px 24px;color:#fff;text-decoration:none;font-weight:700;font-size:13px;font-family:Arial,sans-serif;">Buy Now</a>
        </td>
      </tr></table></td>
    </tr></table>
  </td></tr>
</table>`,

  socialLinks: () => `<table cellpadding="0" cellspacing="0" style="margin:16px auto;">
  <tr>
    <td style="padding:0 5px;"><a href="#" style="display:inline-block;padding:8px 14px;background:#e1306c;border-radius:4px;color:#fff;text-decoration:none;font-size:12px;font-weight:600;font-family:Arial,sans-serif;">Instagram</a></td>
    <td style="padding:0 5px;"><a href="#" style="display:inline-block;padding:8px 14px;background:#1877f2;border-radius:4px;color:#fff;text-decoration:none;font-size:12px;font-weight:600;font-family:Arial,sans-serif;">Facebook</a></td>
    <td style="padding:0 5px;"><a href="#" style="display:inline-block;padding:8px 14px;background:#1da1f2;border-radius:4px;color:#fff;text-decoration:none;font-size:12px;font-weight:600;font-family:Arial,sans-serif;">Twitter</a></td>
    <td style="padding:0 5px;"><a href="#" style="display:inline-block;padding:8px 14px;background:#000;border-radius:4px;color:#fff;text-decoration:none;font-size:12px;font-weight:600;font-family:Arial,sans-serif;">TikTok</a></td>
  </tr>
</table>`,

  testimonial: () => `<table cellpadding="0" cellspacing="0" width="100%" style="background:#f9f9f9;border-left:4px solid #c45e2c;margin:16px 0;">
  <tr><td style="padding:24px 28px;">
    <p style="color:#333;font-size:16px;line-height:1.7;margin:0 0 16px;font-style:italic;font-family:Georgia,serif;">"This is the customer testimonial. Make it authentic and specific."</p>
    <table cellpadding="0" cellspacing="0"><tr>
      <td style="padding-right:12px;"><div style="width:40px;height:40px;border-radius:50%;background:#ddd;text-align:center;line-height:40px;font-size:16px;">👤</div></td>
      <td><p style="color:#1a1a1a;font-size:13px;font-weight:700;margin:0;font-family:Arial,sans-serif;">Customer Name</p>
        <p style="color:#888;font-size:12px;margin:2px 0 0;font-family:Arial,sans-serif;">Title / Company</p></td>
      <td style="padding-left:16px;"><span style="color:#f59e0b;font-size:18px;">★★★★★</span></td>
    </tr></table>
  </td></tr>
</table>`,

  imageBlock: () => `<table cellpadding="0" cellspacing="0" width="100%">
  <tr><td style="padding:20px;text-align:center;">
    <img src="https://yoursite.com/image.jpg" alt="Image" width="560" style="max-width:100%;height:auto;display:block;margin:0 auto;border-radius:4px;" />
    <p style="color:#888;font-size:12px;margin:8px 0 0;font-family:Arial,sans-serif;font-style:italic;">Caption text</p>
  </td></tr>
</table>`,

  divider: () => `<table cellpadding="0" cellspacing="0" width="100%">
  <tr><td style="padding:16px 0;"><hr style="border:none;border-top:1px solid #eee;margin:0;" /></td></tr>
</table>`,

  emailTable: () => `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
  <tr>
    <th style="background:#1a1a1a;color:#fff;padding:10px 14px;text-align:left;font-size:12px;font-family:Arial,sans-serif;">Col 1</th>
    <th style="background:#1a1a1a;color:#fff;padding:10px 14px;text-align:left;font-size:12px;font-family:Arial,sans-serif;">Col 2</th>
    <th style="background:#1a1a1a;color:#fff;padding:10px 14px;text-align:left;font-size:12px;font-family:Arial,sans-serif;">Col 3</th>
  </tr>
  <tr><td style="padding:10px 14px;font-size:13px;color:#555;font-family:Arial,sans-serif;border-bottom:1px solid #eee;">A</td>
    <td style="padding:10px 14px;font-size:13px;color:#555;font-family:Arial,sans-serif;border-bottom:1px solid #eee;">B</td>
    <td style="padding:10px 14px;font-size:13px;color:#555;font-family:Arial,sans-serif;border-bottom:1px solid #eee;">C</td></tr>
</table>`,

  preheader: () => `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#fff;line-height:1px;">Preview text shown in inbox before opening.&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌</div>`,

  mediaQuery: () => `<style type="text/css">
  @media only screen and (max-width: 600px) {
    .container { width: 100% !important; }
    .col        { display: block !important; width: 100% !important; box-sizing: border-box; }
    .mobile-hide{ display: none !important; }
    .mobile-center { text-align: center !important; }
    img         { max-width: 100% !important; height: auto !important; }
  }
  @media (prefers-color-scheme: dark) {
    .dark-bg   { background-color: #1a1a1a !important; }
    .dark-text { color: #ffffff !important; }
  }
</style>`,

  outlook: () => `<!--[if mso]><table role="presentation" width="600" align="center"><tr><td><![endif]-->
<!-- content -->
<!--[if mso]></td></tr></table><![endif]-->`,

  gif: () => `<!--[if !mso]><!--><img src="https://yoursite.com/animation.gif" alt="" width="600" style="max-width:100%;display:block;" /><!--<![endif]-->
<!--[if mso]><img src="https://yoursite.com/fallback.jpg" alt="" width="600" /><![endif]-->`,
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

// ── color swatches ────────────────────────────────────────────────────────────
function ColorSwatches({ onSelect }) {
  return (
    <div className="absolute top-full left-0 mt-1 z-[200] rounded-lg p-2 shadow-2xl border border-white/10"
      style={{ background: '#1a1a1a', width: 184 }}
      onMouseDown={e => e.stopPropagation()}
    >
      <div className="grid grid-cols-9 gap-0.5">
        {HTML_COLORS.map(c => (
          <button key={c} onMouseDown={e => { e.preventDefault(); onSelect(c) }}
            style={{ background: c, border: c === '#ffffff' ? '1px solid #444' : 'none' }}
            className="w-4 h-4 rounded-sm hover:scale-125 transition-transform cursor-pointer"
            title={c}
          />
        ))}
      </div>
      <div className="mt-1.5 pt-1.5 border-t border-white/10">
        <label className="text-[10px] text-gray-500 block mb-1">Custom hex</label>
        <input type="color" defaultValue="#c45e2c"
          onChange={e => onSelect(e.target.value)}
          className="w-full h-6 rounded cursor-pointer bg-transparent border-none outline-none"
        />
      </div>
    </div>
  )
}

// ── blocks dropdown ───────────────────────────────────────────────────────────
function BlocksMenu({ onInsert, onClose }) {
  useEffect(() => {
    const fn = () => onClose()
    const t = setTimeout(() => document.addEventListener('mousedown', fn), 0)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', fn) }
  }, [onClose])

  const Sect = ({ title, children }) => (
    <div className="mb-3">
      <p className="text-[9px] text-gray-500 font-mono uppercase tracking-wider mb-1.5 px-1">{title}</p>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  )
  const Btn = ({ label, fn, accent }) => (
    <button onMouseDown={e => { e.preventDefault(); onInsert(fn()); onClose() }}
      className={`px-2 py-1 rounded text-xs transition-all ${accent ? 'bg-brand-accent/20 text-brand-accent hover:bg-brand-accent/30' : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'}`}
    >{label}</button>
  )

  return (
    <div className="absolute top-full left-0 mt-1 z-[200] rounded-lg p-3 shadow-2xl border border-white/10 overflow-y-auto"
      style={{ background: '#141414', width: 380, maxHeight: '70vh' }}
      onMouseDown={e => e.stopPropagation()}
    >
      <Sect title="Full Templates">
        <Btn label="📧 Full Email" fn={SNIP.fullTemplate} accent />
        <Btn label="📰 Newsletter" fn={SNIP.newsletter} accent />
        <Btn label="🎯 Promo" fn={SNIP.promo} accent />
      </Sect>
      <Sect title="Layout Blocks">
        <Btn label="Header" fn={SNIP.header} />
        <Btn label="Footer" fn={SNIP.footer} />
        <Btn label="Hero" fn={SNIP.heroSection} />
        <Btn label="2-Col" fn={SNIP.twoCol} />
        <Btn label="3-Col" fn={SNIP.threeCol} />
        <Btn label="CTA Button" fn={SNIP.ctaButton} />
        <Btn label="Product Card" fn={SNIP.productCard} />
        <Btn label="Social Links" fn={SNIP.socialLinks} />
        <Btn label="Testimonial" fn={SNIP.testimonial} />
        <Btn label="Image Block" fn={SNIP.imageBlock} />
        <Btn label="Divider" fn={SNIP.divider} />
        <Btn label="Data Table" fn={SNIP.emailTable} />
      </Sect>
      <Sect title="Spacers">
        {['8','10','16','20','24','32','40','48','60'].map(n => (
          <Btn key={n} label={`${n}px`}
            fn={() => `<div style="height:${n}px;line-height:${n}px;font-size:1px;mso-line-height-rule:exactly;">&nbsp;</div>`}
          />
        ))}
      </Sect>
      <Sect title="Dev / Code">
        <Btn label="&lt;br&gt;" fn={() => '<br />'} />
        <Btn label="&lt;hr&gt;" fn={() => '<hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />'} />
        <Btn label="Preheader" fn={SNIP.preheader} />
        <Btn label="@media" fn={SNIP.mediaQuery} />
        <Btn label="Outlook" fn={SNIP.outlook} />
        <Btn label="GIF fallback" fn={SNIP.gif} />
        <Btn label="Comment" fn={() => '<!-- comment -->'} />
        <Btn label="Hide el" fn={() => '<div style="display:none;">hidden</div>'} />
      </Sect>
    </div>
  )
}

// ── tree node ─────────────────────────────────────────────────────────────────
function TreeNode({ node, files, depth = 0, activeFile, openFolders, dragPath, dropPath, onSelect, onToggle, onCtx, onDragStart, onDragOverNode, onDropNode, onDragEnd, renaming, renameValue, setRenameValue, onRenameBlur, onRenameKey, selection }) {
  const children = files.filter(n => n.parent_path === node.path).sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  const isOpen   = openFolders.has(node.path)
  const isActive = activeFile?.path === node.path
  const isDragging = dragPath === node.path
  const isDropTarget = dropPath === node.path
  const ext      = node.type === 'file' ? getExt(node.name) : ''
  return (
    <div>
      <div
        className={`flex items-center gap-1.5 py-1.5 sm:py-0.5 px-2 rounded cursor-pointer group transition-all
          ${isDragging ? 'opacity-45' : ''}
          ${isDropTarget ? 'bg-brand-accent/25 text-white ring-1 ring-brand-accent/70' : selection?.isSelected(node.path) ? 'bg-brand-accent/20 text-white ring-1 ring-brand-accent/55' : isActive ? 'bg-brand-accent/15 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 active:bg-white/10'}`}
        ref={selection?.itemRef(node.path)}
        draggable={!renaming}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onDragStart={e => onDragStart(e, node)}
        onDragOver={e => onDragOverNode(e, node)}
        onDrop={e => onDropNode(e, node)}
        onDragEnd={onDragEnd}
        onClick={e => selection
          ? selection.handleItemClick(e, node, () => node.type === 'folder' ? onToggle(node.path) : onSelect(node))
          : (node.type === 'folder' ? onToggle(node.path) : onSelect(node))}
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
          activeFile={activeFile} openFolders={openFolders} dragPath={dragPath} dropPath={dropPath}
          onSelect={onSelect} onToggle={onToggle} onCtx={onCtx}
          onDragStart={onDragStart} onDragOverNode={onDragOverNode} onDropNode={onDropNode} onDragEnd={onDragEnd}
          renaming={renaming} renameValue={renameValue}
          setRenameValue={setRenameValue} onRenameBlur={onRenameBlur} onRenameKey={onRenameKey}
          selection={selection}
        />
      ))}
    </div>
  )
}

// ── toolbar buttons ───────────────────────────────────────────────────────────
function sortedTreeChildren(files, parentPath = '') {
  return files
    .filter(n => n.parent_path === parentPath)
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
}

function visibleTreeNodes(files, openFolders, parentPath = '') {
  const children = sortedTreeChildren(files, parentPath)
  return children.flatMap(node => (
    node.type === 'folder' && openFolders.has(node.path)
      ? [node, ...visibleTreeNodes(files, openFolders, node.path)]
      : [node]
  ))
}

function isPathWithin(path, parentPath) {
  return path === parentPath || path.startsWith(parentPath + '/')
}

function TB({ onClick, title, active, disabled, children }) {
  return (
    <button onMouseDown={e => { e.preventDefault(); if (!disabled) onClick() }} title={title} disabled={disabled}
      className={`px-1.5 py-1 rounded text-xs transition-all select-none
        ${disabled ? 'opacity-25 cursor-not-allowed' : active ? 'bg-brand-accent/30 text-brand-accent' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
    >{children}</button>
  )
}
function HTB({ onClick, title, children }) {
  return (
    <button onMouseDown={e => { e.preventDefault(); onClick() }} title={title}
      className="px-1.5 py-0.5 rounded text-[11px] transition-all select-none whitespace-nowrap flex-shrink-0 leading-tight text-gray-400 hover:text-white hover:bg-white/10"
    >{children}</button>
  )
}
const HSep = () => <div className="w-px h-3.5 bg-white/10 mx-0.5 flex-shrink-0 self-center" />

// ── stat helpers ──────────────────────────────────────────────────────────────
function getWordCount(text) { return text.trim().split(/\s+/).filter(Boolean).length }
function getReadTime(text)  { return Math.max(1, Math.round(getWordCount(text) / 200)) }
function getCursorPos(text, idx) {
  const lines = text.slice(0, idx).split('\n')
  return { line: lines.length, col: lines[lines.length - 1].length + 1 }
}

// ── main component ────────────────────────────────────────────────────────────
export default function Editor({ userId, resetKey, registerUndo, embedded = false }) {
  const { files, loading, createNode, saveContent, deleteNode, renameNode, moveNode } = useEditorFiles(userId)

  const [activeFile, setActiveFile]       = useState(null)
  const [content, setContent]             = useState('')
  const [saveStatus, setSaveStatus]       = useState('saved')
  const [openFolders, setOpenFolders]     = useState(new Set())
  const [contextMenu, setContextMenu]     = useState(null)
  const [renaming, setRenaming]           = useState(null)
  const [renameValue, setRenameValue]     = useState('')
  const [newItemTarget, setNewItemTarget] = useState(null)
  const [newItemName, setNewItemName]     = useState('')
  const [viewMode, setViewMode]           = useState(() => localStorage.getItem('bwEditorViewMode') || 'source')
  const [leftW, setLeftW]                 = useState(() => parseInt(localStorage.getItem('bwEditorLeftW') || '240', 10))
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [fullScreen, setFullScreen]       = useState(false)
  const [showFind, setShowFind]           = useState(false)
  const [findQuery, setFindQuery]         = useState('')
  const [cursorPos, setCursorPos]         = useState({ line: 1, col: 1 })
  const [openTabs, setOpenTabs]           = useState([])
  const [dragPath, setDragPath]           = useState(null)
  const [dropPath, setDropPath]           = useState(null)
  const [, setHistoryVer]                 = useState(0)

  // html toolkit state
  const [showColorPicker, setShowColorPicker] = useState(null) // 'text'|'bg'|null
  const [showBlocksMenu, setShowBlocksMenu]   = useState(false)
  const [htmlFont, setHtmlFont]               = useState("'Albert Sans', Arial, sans-serif")
  const [htmlSize, setHtmlSize]               = useState('15')
  const [htmlWeight, setHtmlWeight]           = useState('400')
  const [htmlLineH, setHtmlLineH]             = useState('1.7')
  const [copyDone, setCopyDone]               = useState(false)

  const textareaRef     = useRef(null)
  const editRef         = useRef(null)       // contenteditable edit mode
  const saveTimer       = useRef(null)
  const checkpointTimer = useRef(null)
  const resizing        = useRef(false)
  const savedContentRef = useRef('')
  const undoRef         = useRef([])
  const redoRef         = useRef([])
  const baselineRef     = useRef('')
  const sessionStartRef = useRef(null)
  const isUndoingRef    = useRef(false)
  const blocksRef       = useRef(null)       // blocks button ref for positioning

  const canUndo = undoRef.current.length > 0
  const canRedo = redoRef.current.length > 0

  // ── undo helpers ───────────────────────────────────────────────────────────
  function bumpHistory() { setHistoryVer(v => v + 1) }
  function loadHistory(path) {
    undoRef.current = loadStack(UNDO_KEY(path)); redoRef.current = loadStack(REDO_KEY(path)); bumpHistory()
  }
  function pushToUndo(snapshot, path = activeFile?.path) {
    if (!path) return
    const next = [...undoRef.current, snapshot].slice(-MAX_HIST)
    undoRef.current = next; redoRef.current = []
    saveStack(UNDO_KEY(path), next)
    try { localStorage.removeItem(REDO_KEY(path)) } catch { /* ignore storage failures */ }
    bumpHistory()
  }
  function performUndo() {
    if (!activeFile || undoRef.current.length === 0) return
    clearTimeout(checkpointTimer.current); sessionStartRef.current = null
    const prev = undoRef.current[undoRef.current.length - 1], curr = content
    const newUndo = undoRef.current.slice(0, -1), newRedo = [...redoRef.current, curr].slice(-MAX_HIST)
    undoRef.current = newUndo; redoRef.current = newRedo
    saveStack(UNDO_KEY(activeFile.path), newUndo); saveStack(REDO_KEY(activeFile.path), newRedo)
    baselineRef.current = prev; isUndoingRef.current = true; setContent(prev); bumpHistory()
  }
  function performRedo() {
    if (!activeFile || redoRef.current.length === 0) return
    clearTimeout(checkpointTimer.current); sessionStartRef.current = null
    const next = redoRef.current[redoRef.current.length - 1], curr = content
    const newRedo = redoRef.current.slice(0, -1), newUndo = [...undoRef.current, curr].slice(-MAX_HIST)
    undoRef.current = newUndo; redoRef.current = newRedo
    saveStack(UNDO_KEY(activeFile.path), newUndo); saveStack(REDO_KEY(activeFile.path), newRedo)
    baselineRef.current = next; isUndoingRef.current = true; setContent(next); bumpHistory()
  }

  // Register with global undo system (refs always point to latest, avoid stale closures)
  const editorUndoRef = useRef(null); editorUndoRef.current = performUndo
  const editorRedoRef = useRef(null); editorRedoRef.current = performRedo
  useEffect(() => {
    registerUndo?.(
      () => editorUndoRef.current?.(),
      () => editorRedoRef.current?.()
    )
  }, [registerUndo])

  // ── html toolkit helpers ───────────────────────────────────────────────────
  function insertHtml(html) {
    if (viewMode === 'edit' && editRef.current) {
      // push undo before mutation
      if (activeFile) { pushToUndo(content); sessionStartRef.current = null }
      editRef.current.focus()
      document.execCommand('insertHTML', false, html)
      const next = editRef.current.innerHTML
      setContent(next); baselineRef.current = next; savedContentRef.current !== next && setSaveStatus('modified')
      return
    }
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
    if (viewMode === 'edit' && editRef.current) {
      if (activeFile) { pushToUndo(content); sessionStartRef.current = null }
      editRef.current.focus()
      const sel = window.getSelection()
      const selText = sel?.toString() || 'content'
      document.execCommand('insertHTML', false, open + selText + close)
      const next = editRef.current.innerHTML
      setContent(next); baselineRef.current = next; savedContentRef.current !== next && setSaveStatus('modified')
      return
    }
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
  function applyColor(prop, color) { wrapHtml(`<span style="${prop}:${color};">`, '</span>'); setShowColorPicker(null) }
  function copyHtml() { navigator.clipboard?.writeText(content).then(() => { setCopyDone(true); setTimeout(() => setCopyDone(false), 2000) }) }

  // ── link / image helpers (prompt-based) ──────────────────────────────────
  function insertLink() {
    const ta = textareaRef.current
    const selText = viewMode === 'edit'
      ? (window.getSelection()?.toString() || '')
      : (ta ? ta.value.slice(ta.selectionStart, ta.selectionEnd) : '')
    const url  = window.prompt('URL:', 'https://')
    if (!url) return
    const href = normalizeSafeUrl(url)
    if (!href) return
    const label = selText || window.prompt('Link text:', 'Click here') || 'Click here'
    if (selText) wrapHtml(`<a href="${escapeAttr(href)}" style="color:#c45e2c;text-decoration:underline;font-family:Arial,sans-serif;">`, '</a>')
    else insertHtml(`<a href="${escapeAttr(href)}" style="color:#c45e2c;text-decoration:underline;font-family:Arial,sans-serif;">${escapeHtml(label)}</a>`)
    // If no selection, the wrapHtml used 'content' — replace that with actual label
  }
  function insertImage() {
    const src = window.prompt('Image URL:', 'https://')
    if (!src) return
    const safeSrc = normalizeSafeUrl(src)
    if (!safeSrc) return
    const alt = window.prompt('Alt text (optional):', '') || ''
    insertHtml(`<img src="${escapeAttr(safeSrc)}" alt="${escapeAttr(alt)}" width="600" style="max-width:100%;height:auto;display:block;" />`)
  }

  // ── clipboard paste in edit mode (allow rich HTML paste) ─────────────────
  function handleEditPaste(e) {
    e.preventDefault()
    const html = e.clipboardData.getData('text/html')
    const text = e.clipboardData.getData('text/plain')
    const toInsert = html || text
    if (toInsert) {
      document.execCommand('insertHTML', false, html ? sanitizeHtml(toInsert) : escapeHtml(toInsert).replace(/\n/g,'<br>'))
      const next = editRef.current?.innerHTML || content
      setContent(next); baselineRef.current = next; setSaveStatus('modified')
    }
  }

  // ── close dropdowns on outside click ──────────────────────────────────────
  useEffect(() => {
    if (!showColorPicker) return
    const fn = () => setShowColorPicker(null)
    const t = setTimeout(() => document.addEventListener('mousedown', fn), 0)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', fn) }
  }, [showColorPicker])

  // ── reset when tab icon re-tapped ────────────────────────────────────────
  useEffect(() => {
    if (resetKey) {
      setActiveFile(null); setOpenTabs([]); setContent('')
      setShowFind(false); setFindQuery(''); setFullScreen(false)
      setContextMenu(null); setRenaming(null); setNewItemTarget(null)
    }
  }, [resetKey])

  // ── persist panel width ───────────────────────────────────────────────────
  useEffect(() => { localStorage.setItem('bwEditorLeftW', String(leftW)) }, [leftW])
  useEffect(() => { localStorage.setItem('bwEditorViewMode', viewMode) }, [viewMode])
  useEffect(() => { if (activeFile) setShowMobileSidebar(false) }, [activeFile])
  useEffect(() => {
    if (!activeFile) return
    const supportsPreview = isMarkdown(activeFile.name) || isHtml(activeFile.name)
    if (!supportsPreview && (viewMode === 'preview' || viewMode === 'split')) setViewMode('source')
  }, [activeFile, viewMode])
  useEffect(() => {
    const fn = () => { if (window.innerWidth < 640 && (viewMode === 'split' || viewMode === 'edit')) setViewMode('source') }
    fn(); window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [viewMode])

  // ── init contenteditable edit div ─────────────────────────────────────────
  useEffect(() => {
    if (viewMode !== 'edit' || !editRef.current) return
    const isMd_ = activeFile && isMarkdown(activeFile.name)
    editRef.current.innerHTML = isMd_ ? renderMd(content) : content
  }, [viewMode, activeFile?.path]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── load file ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeFile) return
    const f = files.find(f => f.path === activeFile.path)
    if (!f) return
    const c = f.content || ''
    clearTimeout(checkpointTimer.current); sessionStartRef.current = null; isUndoingRef.current = true
    setContent(c); setSaveStatus('saved'); savedContentRef.current = c
    baselineRef.current = c; loadHistory(activeFile.path)
  }, [activeFile?.path]) // eslint-disable-line

  // ── realtime sync ─────────────────────────────────────────────────────────
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

  // ── auto-save + checkpoint ────────────────────────────────────────────────
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
      setSaveStatus('saving'); await saveContent(activeFile.path, content)
      savedContentRef.current = content; setSaveStatus('saved')
    }, 1200)
    return () => { clearTimeout(saveTimer.current); clearTimeout(checkpointTimer.current) }
  }, [content]) // eslint-disable-line

  // ── keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const fn = (e) => {
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      const isMd_ = activeFile && isMarkdown(activeFile.name)
      if (e.key === 's')                                { e.preventDefault(); forceSave() }
      if (e.key === 'f')                                { e.preventDefault(); setShowFind(v => !v) }
      if (e.key === 'b' && isMd_)                       { e.preventDefault(); applyFormat('bold') }
      if (e.key === 'i' && isMd_)                       { e.preventDefault(); applyFormat('italic') }
      if (e.key === 'k' && isMd_)                       { e.preventDefault(); applyFormat('link') }
      if (e.key === 'z' && !e.shiftKey)                 { e.preventDefault(); performUndo() }
      if (e.key === 'y' || (e.shiftKey && e.key === 'Z')){ e.preventDefault(); performRedo() }
      if (e.key === 'Escape') { setShowFind(false); setFullScreen(false); setShowBlocksMenu(false) }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  })

  // ── file actions ──────────────────────────────────────────────────────────
  async function openFile(node) {
    if (!isText(node.name)) return
    setActiveFile({ path: node.path, name: node.name })
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
  function applyMovedPaths(remap) {
    if (!remap) return
    if (activeFile && remap[activeFile.path]) {
      const nextPath = remap[activeFile.path]
      const moved = files.find(f => f.path === activeFile.path)
      setActiveFile({ path: nextPath, name: moved?.name || activeFile.name })
    }
    setOpenTabs(prev => prev.map(tab => remap[tab.path] ? { ...tab, path: remap[tab.path] } : tab))
    setOpenFolders(prev => {
      const next = new Set()
      prev.forEach(path => next.add(remap[path] || path))
      return next
    })
  }
  function startTreeDrag(e, node) {
    if (renaming) return
    setDragPath(node.path)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', node.path)
  }
  function dragOverTreeNode(e, node) {
    const dragged = dragPath || e.dataTransfer.getData('text/plain')
    if (!dragged || dragged === node.path) return
    if (node.type !== 'folder') return
    if (isPathWithin(node.path, dragged)) return
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    setDropPath(node.path)
  }
  async function dropOnTreeNode(e, node) {
    const dragged = dragPath || e.dataTransfer.getData('text/plain')
    if (!dragged || node.type !== 'folder') return
    e.preventDefault(); e.stopPropagation()
    setDragPath(null); setDropPath(null)
    const result = await moveNode(dragged, node.path)
    if (result?.remap) {
      applyMovedPaths(result.remap)
      setOpenFolders(prev => new Set([...prev, node.path]))
    }
  }
  function dragOverRoot(e) {
    const dragged = dragPath || e.dataTransfer.getData('text/plain')
    if (!dragged) return
    const node = files.find(f => f.path === dragged)
    if (!node || node.parent_path === '') return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropPath('')
  }
  async function dropOnRoot(e) {
    const dragged = dragPath || e.dataTransfer.getData('text/plain')
    if (!dragged) return
    e.preventDefault()
    setDragPath(null); setDropPath(null)
    const result = await moveNode(dragged, '')
    if (result?.remap) applyMovedPaths(result.remap)
  }
  function endTreeDrag() {
    setDragPath(null)
    setDropPath(null)
  }
  function startResize(e) {
    e.preventDefault(); resizing.current = true
    const startX = e.clientX, startW = leftW
    const onMove = e => { if (resizing.current) setLeftW(Math.max(160, Math.min(500, startW + e.clientX - startX))) }
    const onUp   = () => { resizing.current = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp)
  }
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

  // ── markdown formatting ───────────────────────────────────────────────────
  function applyFormat(fmt) {
    if (activeFile) {
      clearTimeout(checkpointTimer.current)
      const before = sessionStartRef.current !== null ? sessionStartRef.current : content
      pushToUndo(before); sessionStartRef.current = null; baselineRef.current = content
    }
    const ta = textareaRef.current; if (!ta) return
    const { selectionStart: ss, selectionEnd: se, value } = ta
    const sel = value.slice(ss, se), bef = value.slice(0, ss), aft = value.slice(se)
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
  function handleKeyDown(e) {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.target; const { selectionStart: ss, selectionEnd: se, value } = ta; const spaces = '  '
      if (e.shiftKey) {
        const lineStart = value.lastIndexOf('\n', ss - 1) + 1
        if (value.slice(lineStart, lineStart + 2) === spaces) {
          setContent(value.slice(0, lineStart) + value.slice(lineStart + 2))
          setTimeout(() => { ta.setSelectionRange(ss - 2, se - 2) }, 0)
        }
      } else {
        setContent(value.slice(0, ss) + spaces + value.slice(se))
        setTimeout(() => { ta.setSelectionRange(ss + 2, ss + 2) }, 0)
      }
    }
  }
  function downloadFile() {
    if (!activeFile) return
    const blob = new Blob([content], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url; a.download = activeFile.name; a.click()
    URL.revokeObjectURL(url)
  }

  const matchCount = findQuery && content
    ? (content.match(new RegExp(findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length : 0

  const roots = files.filter(n => n.parent_path === '').sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  const visibleFiles = useMemo(() => visibleTreeNodes(files, openFolders), [files, openFolders])
  const fileSelection = useMultiSelection(visibleFiles, { getId: getFileSelectionId })

  function copySelectedFilePaths() {
    if (fileSelection.selectedCount) copyToClipboard(fileSelection.selectedItems.map(node => node.path).join('\n'))
  }

  function openFirstSelectedFile() {
    const node = fileSelection.selectedItems[0]
    if (!node) return
    if (node.type === 'folder') {
      setOpenFolders(s => {
        const next = new Set(s)
        next.has(node.path) ? next.delete(node.path) : next.add(node.path)
        return next
      })
    } else {
      openFile(node)
    }
  }

  function pathWithin(path, root) {
    return path === root || path.startsWith(root + '/')
  }

  async function deleteSelectedFiles() {
    if (!fileSelection.selectedCount) return
    if (!confirm(`Delete ${fileSelection.selectedCount} selected item${fileSelection.selectedCount === 1 ? '' : 's'}?`)) return
    const selected = fileSelection.selectedItems
    const selectedPaths = new Set(selected.map(node => node.path))
    const topLevel = selected.filter(node => {
      const parts = node.path.split('/')
      return !parts.slice(1).some((_, index) => selectedPaths.has(parts.slice(0, index + 1).join('/')))
    })
    if (activeFile && selected.some(node => pathWithin(activeFile.path, node.path))) {
      setActiveFile(null)
    }
    setOpenTabs(prev => prev.filter(tab => !selected.some(node => pathWithin(tab.path, node.path))))
    for (const node of topLevel) await deleteNode(node.path)
    fileSelection.clearSelection()
  }

  useEffect(() => {
    const fn = (e) => {
      if (isEditingTarget(e.target)) return
      const mod = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()
      if (mod && key === 'a' && visibleFiles.length) {
        e.preventDefault()
        fileSelection.selectAll(visibleFiles)
      } else if (mod && key === 'c' && fileSelection.selectedCount) {
        e.preventDefault()
        copySelectedFilePaths()
      } else if (e.key === 'Escape' && fileSelection.selectedCount) {
        fileSelection.clearSelection()
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && fileSelection.selectedCount) {
        e.preventDefault()
        deleteSelectedFiles()
      }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  })

  const isMd        = activeFile && isMarkdown(activeFile.name)
  const isHtml_     = activeFile && isHtml(activeFile.name)
  const showHtmlBar = activeFile && !isMd    // show HTML format/style rows for non-md files
  const words       = getWordCount(content)
  const statusColor = saveStatus === 'saved' ? 'text-brand-success' : saveStatus === 'saving' ? 'text-brand-accent' : 'text-gray-500'
  const statusLabel = saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'saving' ? 'Saving…' : '● Unsaved'

  // ── view mode tabs ────────────────────────────────────────────────────────
  const viewTabs = isMd
    ? [{ v:'source',l:'Src'}, {v:'edit',l:'Edit'}, {v:'preview',l:'View'}, {v:'split',l:'Split'}]
    : isHtml_
    ? [{ v:'source',l:'Src'}, {v:'edit',l:'Edit'}, {v:'preview',l:'View'}, {v:'split',l:'Split'}]
    : [{v:'source',l:'Src'}, {v:'edit',l:'Edit'}]

  // ── sidebar ───────────────────────────────────────────────────────────────
  const sidebarContent = (
    <div className="glass-card sm:rounded-lg p-3 flex flex-col overflow-hidden h-full w-full">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <span className="text-white text-sm font-semibold">Files</span>
        <div className="flex gap-0.5">
          <button onClick={() => { setNewItemTarget({ parentPath: '', type: 'file' }); setNewItemName('') }} className="nav-icon" title="New File" aria-label="New File"><PlusIco /></button>
          <button onClick={() => { setNewItemTarget({ parentPath: '', type: 'folder' }); setNewItemName('') }} className="nav-icon" title="New Folder" aria-label="New Folder"><FolderPlus /></button>
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
      <SelectionBar
        count={fileSelection.selectedCount}
        label="item"
        onClear={fileSelection.clearSelection}
        actions={[
          { label: 'Copy Paths', onClick: copySelectedFilePaths },
          { label: 'Open', onClick: openFirstSelectedFile },
          { label: 'Delete', danger: true, onClick: deleteSelectedFiles },
        ]}
      />
      <div
        ref={fileSelection.containerRef}
        onMouseDown={fileSelection.handleSurfaceMouseDown}
        onDragOver={dragOverRoot}
        onDrop={dropOnRoot}
        onDragEnd={endTreeDrag}
        className={`flex-1 overflow-y-auto relative rounded transition-colors ${dropPath === '' ? 'bg-brand-accent/10 ring-1 ring-brand-accent/40' : ''}`}
      >
        {fileSelection.selectionBox}
        {roots.length === 0 && !newItemTarget && (
          <p className="text-gray-600 text-xs text-center py-6 leading-relaxed">No files yet.<br />Use the + buttons above.</p>
        )}
        {roots.map(node => (
          <div key={node.id}>
            <TreeNode node={node} files={files} activeFile={activeFile} openFolders={openFolders}
              dragPath={dragPath} dropPath={dropPath}
              onSelect={openFile}
              onToggle={path => setOpenFolders(s => { const n = new Set(s); n.has(path) ? n.delete(path) : n.add(path); return n })}
              onCtx={nodeCtx} renaming={renaming} renameValue={renameValue}
              onDragStart={startTreeDrag} onDragOverNode={dragOverTreeNode} onDropNode={dropOnTreeNode} onDragEnd={endTreeDrag}
              setRenameValue={setRenameValue} onRenameBlur={commitRename}
              onRenameKey={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(null) }}
              selection={fileSelection}
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
    <div className={`${embedded ? 'p-2 h-full min-h-0' : 'p-4 pt-6 h-[calc(100dvh-64px)] sm:h-[calc(100dvh-40px)]'} flex items-center justify-center`}>
      <span className="text-gray-600 text-sm">Loading files…</span>
    </div>
  )

  return (
    <div
      className={`${fullScreen ? 'fixed inset-0 z-[60] bg-brand-bg' : embedded ? 'p-2 h-full min-h-0' : 'p-3 pt-4 sm:p-4 sm:pt-6 h-[calc(100dvh-64px)] sm:h-[calc(100dvh-40px)]'} animate-fadeIn flex gap-3`}
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
        style={typeof window !== 'undefined' && window.innerWidth >= 640 ? { width: leftW + 'px' } : {}}
      >{sidebarContent}</div>

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
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <p className="text-gray-400 text-sm font-medium">No file open</p>
            <p className="text-gray-600 text-xs mt-1 mb-6">Select a file from the sidebar or create one</p>
            <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
              <button onClick={() => setShowMobileSidebar(true)} className="sm:hidden btn-primary flex items-center justify-center gap-1.5 px-4 py-2.5 text-white rounded text-sm" aria-label="Browse files"><MenuIco /> Browse</button>
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
                    <FileIcon ext={getExt(t.name)} />{t.name}
                    <span onClick={e => { e.stopPropagation(); setOpenTabs(prev => prev.filter(x => x.path !== t.path)); if (t.path === activeFile.path) setActiveFile(openTabs.find(x => x.path !== t.path) || null) }}
                      className="text-gray-600 hover:text-white ml-0.5 leading-none">×</span>
                  </button>
                ))}
              </div>
            )}

            {/* ── Main Toolbar Row ── */}
            <div className="flex items-center gap-1 px-2 sm:px-3 py-1.5 border-b border-white/5 shrink-0 flex-wrap">
              <button onClick={() => setShowMobileSidebar(true)} className="sm:hidden nav-icon mr-1" title="Files" aria-label="Show files"><MenuIco /></button>
              <div className="flex items-center gap-1.5 flex-1 min-w-0 mr-1">
                <FileIcon ext={getExt(activeFile.name)} />
                <span className="text-white text-xs font-medium truncate">{activeFile.name}</span>
              </div>
              <TB onClick={performUndo} title="Undo (Ctrl+Z)" disabled={!canUndo}><UndoIco /></TB>
              <TB onClick={performRedo} title="Redo (Ctrl+Y)" disabled={!canRedo}><RedoIco /></TB>

              {/* Markdown-specific buttons (md files only, in main row) */}
              {isMd && (
                <>
                  <div className="w-px h-4 bg-white/10 mx-0.5" />
                  <TB onClick={() => applyFormat('bold')}   title="Bold (Ctrl+B)"><strong>B</strong></TB>
                  <TB onClick={() => applyFormat('italic')} title="Italic (Ctrl+I)"><em>I</em></TB>
                  <TB onClick={() => applyFormat('strike')} title="Strikethrough"><del>S</del></TB>
                  <div className="w-px h-4 bg-white/10 mx-0.5" />
                  <TB onClick={() => applyFormat('h1')} title="H1">H1</TB>
                  <TB onClick={() => applyFormat('h2')} title="H2">H2</TB>
                  <TB onClick={() => applyFormat('h3')} title="H3">H3</TB>
                  <div className="w-px h-4 bg-white/10 mx-0.5" />
                  <TB onClick={() => applyFormat('code')}  title="Code">&lt;/&gt;</TB>
                  <TB onClick={() => applyFormat('link')}  title="Link (Ctrl+K)">🔗</TB>
                  <TB onClick={() => applyFormat('quote')} title="Quote">&quot;</TB>
                  <TB onClick={() => applyFormat('ul')}    title="Bullet list">•</TB>
                  <TB onClick={() => applyFormat('ol')}    title="Numbered list">1.</TB>
                  <TB onClick={() => applyFormat('table')} title="Table">⊞</TB>
                  <TB onClick={() => applyFormat('hr')}    title="Divider">—</TB>
                </>
              )}

              {/* Right controls */}
              <div className="flex items-center gap-0.5 ml-auto">
                {/* View modes */}
                <div className="flex gap-0.5 bg-white/5 rounded p-0.5">
                  {viewTabs.map(({ v, l }) => (
                    <button key={v}
                      onClick={() => setViewMode(v)}
                      className={`${v === 'split' ? 'hidden sm:inline' : ''} px-2 py-0.5 rounded text-xs transition-all
                        ${viewMode === v ? 'bg-brand-accent/80 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >{l}</button>
                  ))}
                </div>
                <button onClick={() => setShowFind(v => !v)} className={`nav-icon ${showFind ? 'text-brand-accent' : ''}`} title="Find (Ctrl+F)" aria-label="Find"><SearchIco /></button>
                <button onClick={downloadFile} className="nav-icon" title="Download" aria-label="Download"><DownloadIco /></button>
                <button onClick={() => setFullScreen(v => !v)} className="nav-icon hidden sm:flex" title="Full screen" aria-label="Full screen">
                  {fullScreen ? <ExitFull /> : <FullIco />}
                </button>
                <button onClick={forceSave} className={`nav-icon ${statusColor}`} title="Save (Ctrl+S)" aria-label="Save"><SaveIco /></button>
              </div>
            </div>

            {/* ── HTML Format Row (non-md files) ── */}
            {showHtmlBar && (
              <div className="flex items-center gap-0.5 px-2 py-1 border-b border-white/[0.06] bg-black/10 shrink-0 overflow-x-auto scrollbar-hide">
                <span className="text-[9px] text-gray-600 font-mono uppercase tracking-wider mr-1 select-none w-10 shrink-0">Format</span>
                <HTB onClick={() => wrapHtml('<strong>', '</strong>')} title="Bold"><strong className="text-gray-300">B</strong></HTB>
                <HTB onClick={() => wrapHtml('<em>', '</em>')} title="Italic"><em className="text-gray-300">I</em></HTB>
                <HTB onClick={() => wrapHtml('<u>', '</u>')} title="Underline"><u className="text-gray-300">U</u></HTB>
                <HTB onClick={() => wrapHtml('<s>', '</s>')} title="Strikethrough"><s className="text-gray-300">S</s></HTB>
                <HSep />
                <HTB onClick={() => wrapHtml('<h1 style="font-family:Arial,sans-serif;font-size:32px;color:#1a1a1a;margin:0 0 16px;font-weight:700;">', '</h1>')} title="Heading 1">H1</HTB>
                <HTB onClick={() => wrapHtml('<h2 style="font-family:Arial,sans-serif;font-size:24px;color:#1a1a1a;margin:0 0 12px;font-weight:700;">', '</h2>')} title="Heading 2">H2</HTB>
                <HTB onClick={() => wrapHtml('<h3 style="font-family:Arial,sans-serif;font-size:20px;color:#1a1a1a;margin:0 0 10px;font-weight:600;">', '</h3>')} title="Heading 3">H3</HTB>
                <HTB onClick={() => wrapHtml('<h4 style="font-family:Arial,sans-serif;font-size:16px;color:#1a1a1a;margin:0 0 8px;font-weight:600;">', '</h4>')} title="Heading 4">H4</HTB>
                <HTB onClick={() => wrapHtml('<p style="font-family:Arial,sans-serif;font-size:15px;color:#555;line-height:1.7;margin:0 0 16px;">', '</p>')} title="Paragraph">P</HTB>
                <HSep />
                <HTB onClick={() => wrapHtml('<ul style="margin:0 0 16px;padding-left:24px;color:#555;font-family:Arial,sans-serif;font-size:14px;">\n  <li style="margin-bottom:6px;">', '</li>\n</ul>')} title="Bullet list">• List</HTB>
                <HTB onClick={() => wrapHtml('<ol style="margin:0 0 16px;padding-left:24px;color:#555;font-family:Arial,sans-serif;font-size:14px;">\n  <li style="margin-bottom:6px;">', '</li>\n</ol>')} title="Numbered list">1. List</HTB>
                <HTB onClick={() => insertHtml('<ul style="list-style:none;padding-left:0;margin:0 0 16px;">\n  <li style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-family:Arial,sans-serif;font-size:14px;color:#555;"><span style="display:inline-block;width:14px;height:14px;border:1.5px solid #999;border-radius:3px;flex-shrink:0;"></span><span>Item 1</span></li>\n  <li style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-family:Arial,sans-serif;font-size:14px;color:#555;"><span style="display:inline-block;width:14px;height:14px;border:1.5px solid #999;border-radius:3px;flex-shrink:0;"></span><span>Item 2</span></li>\n</ul>')} title="Checklist">☑ List</HTB>
                <HTB onClick={() => wrapHtml('<li style="margin-bottom:6px;">', '</li>')} title="List item">li</HTB>
                <HSep />
                <HTB onClick={() => wrapHtml('<div style="text-align:left;">', '</div>')} title="Align left">⬅</HTB>
                <HTB onClick={() => wrapHtml('<div style="text-align:center;">', '</div>')} title="Align center">≡</HTB>
                <HTB onClick={() => wrapHtml('<div style="text-align:right;">', '</div>')} title="Align right">➡</HTB>
                <HSep />
                <HTB onClick={insertLink} title="Insert link (prompts for URL)">🔗 Link</HTB>
                <HTB onClick={insertImage} title="Insert image (prompts for URL)">🖼 Img</HTB>
                <HSep />
                <HTB onClick={() => wrapHtml('<div style="">', '</div>')} title="Div container">div</HTB>
                <HTB onClick={() => wrapHtml('<span style="">', '</span>')} title="Inline span">span</HTB>
                <HSep />
                {/* Blocks dropdown */}
                <div className="relative flex-shrink-0" ref={blocksRef}>
                  <button
                    onMouseDown={e => { e.preventDefault(); setShowBlocksMenu(v => !v) }}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-all select-none
                      ${showBlocksMenu ? 'bg-brand-accent/30 text-brand-accent' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                    title="Insert email/HTML blocks and templates"
                  >
                    Blocks <ChevDownIco />
                  </button>
                  {showBlocksMenu && (
                    <BlocksMenu onInsert={insertHtml} onClose={() => setShowBlocksMenu(false)} />
                  )}
                </div>
                {/* Copy button */}
                <button
                  onMouseDown={e => { e.preventDefault(); copyHtml() }}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] ml-2 flex-shrink-0 transition-all
                    ${copyDone ? 'text-brand-success' : 'text-gray-600 hover:text-gray-300 hover:bg-white/5'}`}
                  title="Copy all to clipboard"
                >
                  <CopyIco />{copyDone ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}

            {/* ── HTML Style Row (non-md files) ── */}
            {showHtmlBar && (
              <div className="flex items-center gap-1 px-2 py-1 border-b border-white/[0.06] bg-black/10 shrink-0 overflow-x-auto scrollbar-hide">
                <span className="text-[9px] text-gray-600 font-mono uppercase tracking-wider mr-0.5 select-none w-10 shrink-0">Style</span>

                {/* Font family */}
                <select value={htmlFont}
                  onChange={e => {
                    const f = e.target.value; setHtmlFont(f)
                    // reset weight if current weight not available for new font
                    const avail = FONT_WEIGHT_MAP[f] || ['400','700']
                    if (!avail.includes(htmlWeight)) setHtmlWeight(avail.includes('400') ? '400' : avail[0])
                    wrapHtml(`<span style="font-family:${f};">`, '</span>')
                  }}
                  className="editor-toolbar-select bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-gray-300 text-[11px] outline-none cursor-pointer hover:border-white/20 flex-shrink-0"
                  style={{ maxWidth: 110 }}
                >{HTML_FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}</select>

                {/* Font size */}
                <select value={htmlSize}
                  onChange={e => { setHtmlSize(e.target.value); wrapHtml(`<span style="font-size:${e.target.value}px;">`, '</span>') }}
                  className="editor-toolbar-select bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-gray-300 text-[11px] outline-none cursor-pointer hover:border-white/20 flex-shrink-0"
                  style={{ width: 70 }}
                >{HTML_SIZES.map(s => <option key={s} value={s}>{s}px</option>)}</select>

                {/* Font weight — adaptive to selected font */}
                <select value={htmlWeight}
                  onChange={e => { setHtmlWeight(e.target.value); wrapHtml(`<span style="font-weight:${e.target.value};">`, '</span>') }}
                  className="editor-toolbar-select bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-gray-300 text-[11px] outline-none cursor-pointer hover:border-white/20 flex-shrink-0"
                  style={{ width: 90 }}
                  title="Font weight (options depend on selected font)"
                >
                  {(FONT_WEIGHT_MAP[htmlFont] || ['400','700']).map(w => (
                    <option key={w} value={w}>{WEIGHT_LABELS[w] || w}</option>
                  ))}
                </select>

                {/* Line height */}
                <select value={htmlLineH}
                  onChange={e => { setHtmlLineH(e.target.value); wrapHtml(`<span style="line-height:${e.target.value};">`, '</span>') }}
                  className="editor-toolbar-select bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-gray-300 text-[11px] outline-none cursor-pointer hover:border-white/20 flex-shrink-0"
                  style={{ width: 74 }}
                  title="Line height"
                >
                  {['1','1.2','1.4','1.5','1.6','1.7','1.8','2','2.2'].map(l => (
                    <option key={l} value={l}>lh {l}</option>
                  ))}
                </select>

                <HSep />

                {/* Text color */}
                <div className="relative flex-shrink-0">
                  <button onMouseDown={e => { e.preventDefault(); setShowColorPicker(v => v === 'text' ? null : 'text') }}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-gray-400 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap"
                    title="Text color"
                  >
                    <span className="inline-block w-3 h-3 rounded-sm border border-white/20 flex-shrink-0" style={{ background: '#c45e2c' }} /> A
                  </button>
                  {showColorPicker === 'text' && <ColorSwatches onSelect={c => applyColor('color', c)} />}
                </div>

                {/* BG color */}
                <div className="relative flex-shrink-0">
                  <button onMouseDown={e => { e.preventDefault(); setShowColorPicker(v => v === 'bg' ? null : 'bg') }}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-gray-400 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap"
                    title="Background color"
                  >
                    <span className="inline-block w-3 h-3 rounded-sm border border-white/20 flex-shrink-0" style={{ background: '#1a1a1a' }} /> BG
                  </button>
                  {showColorPicker === 'bg' && <ColorSwatches onSelect={c => applyColor('background-color', c)} />}
                </div>

                <HSep />
                <span className="text-[9px] text-gray-600 select-none flex-shrink-0">Pad:</span>
                {['4px','8px','12px','16px','24px','32px','40px'].map(p => (
                  <HTB key={p} onClick={() => wrapHtml(`<div style="padding:${p};">`, '</div>')} title={`padding: ${p}`}>{p}</HTB>
                ))}
                <HSep />
                <span className="text-[9px] text-gray-600 select-none flex-shrink-0">Radius:</span>
                {['0','2px','4px','6px','8px','12px','16px','50%'].map(r => (
                  <HTB key={r} onClick={() => wrapHtml(`<span style="border-radius:${r};">`, '</span>')} title={`border-radius: ${r}`}>{r}</HTB>
                ))}
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
                <button onClick={() => { setShowFind(false); setFindQuery('') }} className="nav-icon" title="Close find" aria-label="Close find"><CloseIco /></button>
              </div>
            )}

            {/* ── Editor area ── */}
            <div className="flex-1 overflow-hidden flex min-h-0">

              {/* Source textarea */}
              {(viewMode === 'source' || viewMode === 'split') && (
                <div className={`flex flex-col overflow-hidden ${viewMode === 'split' ? 'w-1/2 border-r border-white/5' : 'w-full'}`}>
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
                    placeholder={isMd ? '# Heading\n\nStart writing…\n\nCtrl+Z undo · Ctrl+Y redo · history persists' : '<!-- Start typing or insert a block from the toolbar above -->'}
                  />
                </div>
              )}

              {/* Edit mode — contenteditable WYSIWYG */}
              {viewMode === 'edit' && (
                <div className="flex-1 overflow-auto p-5">
                  <div
                    ref={editRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={() => {
                      if (!editRef.current) return
                      const next = editRef.current.innerHTML
                      setContent(next); setSaveStatus('modified')
                    }}
                    onPaste={handleEditPaste}
                    className="outline-none min-h-full text-gray-200 markdown-preview"
                    style={{ lineHeight: 1.7, fontSize: 15 }}
                    title="Edit mode — click and type to edit the rendered output"
                  />
                </div>
              )}

              {/* Preview (markdown render or HTML iframe) */}
              {(viewMode === 'preview' || viewMode === 'split') && (
                <div className={`overflow-auto p-5 ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
                  {isMd ? (
                    <div className="markdown-preview text-sm text-gray-300 max-w-none"
                      dangerouslySetInnerHTML={{ __html: renderMd(content) }} />
                  ) : (
                    <iframe srcDoc={content} className="w-full h-full rounded border-0" sandbox="" referrerPolicy="no-referrer" title="preview" />
                  )}
                </div>
              )}
            </div>

            {/* Status bar */}
            <div className="flex items-center gap-3 sm:gap-4 px-3 py-1 border-t border-white/5 shrink-0 text-xs select-none">
              <span className={`font-medium ${statusColor}`}>{statusLabel}</span>
              {canUndo && <span className="text-gray-700">{undoRef.current.length} undo</span>}
              {viewMode !== 'edit' && <span className="text-gray-600">Ln {cursorPos.line}, Col {cursorPos.col}</span>}
              <span className="text-gray-600">{content.split('\n').length} lines</span>
              {isMd && <>
                <span className="text-gray-600">{words} words</span>
                <span className="text-gray-600">{getReadTime(content)} min read</span>
              </>}
              {viewMode === 'edit' && <span className="text-gray-600 text-[10px]">edit mode — click to type</span>}
              <span className="ml-auto text-gray-700">{(new Blob([content]).size / 1024).toFixed(1)} KB</span>
              <span className="text-gray-700">{getExt(activeFile.name).toUpperCase() || 'TXT'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
