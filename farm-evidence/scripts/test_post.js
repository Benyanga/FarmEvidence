const axios = require('axios');

async function run() {
  try {
    const res = await axios.post('http://localhost:5179/api/trials', {
      name: 'node-test',
      treatments: [{ name: 'CA', code: 'CA' }, { name: 'CF', code: 'CF' }],
      plantingDate: '2026-03-15',
      location: 'Node Demo',
    }, { timeout: 5000 });
    console.log('STATUS', res.status);
    console.log('DATA', res.data);
  } catch (err) {
    if (err.response) {
      console.error('RESPONSE STATUS', err.response.status);
      console.error('RESPONSE DATA', err.response.data);
    } else {
      console.error('ERROR', err.message);
    }
  }
}

run();
