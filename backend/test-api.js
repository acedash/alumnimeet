// Simple API test script
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function testAPI() {
  try {
    console.log('Testing API endpoints...');
    
    // Test chat conversations endpoint
    console.log('\n1. Testing /chat/conversations...');
    const convResponse = await fetch(`${API_BASE}/chat/conversations`, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', convResponse.status);
    if (convResponse.ok) {
      const data = await convResponse.json();
      console.log('Response:', data);
    } else {
      const error = await convResponse.text();
      console.log('Error:', error);
    }
    
  } catch (error) {
    console.error('API test failed:', error.message);
  }
}

testAPI(); 