export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Hello from Scavenger Hunt Player App!</h1>
      <p>Welcome to the player application for Scavenger Hunt.</p>
      <p>Backend API: {process.env.NEXT_PUBLIC_API_URL}</p>
    </main>
  );
}