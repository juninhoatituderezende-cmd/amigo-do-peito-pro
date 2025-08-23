
// EMERGENCY TEST - Step 1: Absolute minimum
export default function Index() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#000000', 
      color: '#ffffff', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#FFD700' }}>🚨 TESTE MÓVEL</h1>
      <p>Se você consegue ver esta mensagem, o app está funcionando!</p>
      <button 
        style={{ 
          backgroundColor: '#FFD700', 
          color: '#000000', 
          padding: '15px 30px', 
          border: 'none', 
          borderRadius: '5px',
          fontSize: '16px',
          marginTop: '20px'
        }}
        onClick={() => alert('Botão funcionando!')}
      >
        Testar Clique
      </button>
    </div>
  );
}
