export default function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#1a1a1a',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 16, zIndex: 9999
    }}>
      <div style={{
        width: 36, height: 36,
        border: '3px solid #2a2a2a',
        borderTopColor: '#c45e2c',
        borderRadius: '50%',
        animation: 'bwSpin 0.8s linear infinite'
      }} />
      <div style={{ color: '#555', fontSize: 13, fontWeight: 400, fontFamily: "'Albert Sans', system-ui, sans-serif" }}>
        Loading...
      </div>
    </div>
  )
}
