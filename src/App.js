import React, { useState } from 'react';

function App() {
    const [data, setData] = useState('');
    const [token, setToken] = useState('');

    const handleTokenize = async () => {
      try {
          const response = await fetch('http://localhost:4000/tokenize', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ data }),
          });
          if (!response.ok) {
              throw new Error('Network response was not ok');
          }
          const result = await response.json();
          setToken(result.token);
      } catch (error) {
          console.error('Error fetching data:', error.message);
          // Handle error state or display an error message to the user
      }
    };  
  
    const handleVerifyZKP = async () => {
        const proof = '169';
        const response = await fetch('http://localhost:4000/verifyZKP', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ proof, token }),
        });
        const result = await response.json();
        alert(`Proof is ${result.isValid ? 'valid' : 'invalid'}`);
    };

    return (
        <div>
            <input
                type="text"
                value={data}
                onChange={(e) => setData(e.target.value)}
                placeholder="Enter transaction data"
            />
            <button onClick={handleTokenize}>Tokenize</button>
            {token && <div>Token: {token}</div>}
            <button onClick={handleVerifyZKP}>Verify ZKP</button>
        </div>
    );
}

export default App;
