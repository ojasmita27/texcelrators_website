require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

(async () => {
  const token = process.argv[2];
  const projectId = process.argv[3];
  const memberId = process.argv[4];
  if (!token || !projectId || !memberId) {
    console.error('Usage: node test-put.js <token> <projectId> <memberId>');
    process.exit(2);
  }
  const url = `http://localhost:3000/projects/${projectId}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ teamMemberIds: [memberId] })
  });
  const text = await res.text();
  console.log(res.status, text);
})();