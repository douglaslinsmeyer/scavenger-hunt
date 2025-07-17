export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Hello from Scavenger Hunt Admin Dashboard!</h1>
      <p>Welcome to the admin dashboard for managing Scavenger Hunts.</p>
      <p>Backend API: {process.env.BACKEND_BASE_URL}</p>
    </main>
  );
}