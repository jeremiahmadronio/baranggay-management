const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  password: '1',
  host: 'localhost',
  port: 5432,
  database: 'barangay'
});
client.connect()
  .then(() => client.query("SELECT id, case_number, case_type, case_filed_at, status FROM cases WHERE case_type = 'BCPC_CASE' OR dept_id = (SELECT id FROM departments WHERE name = 'BCPC')"))
  .then(res => { console.log("CASES:", res.rows); client.end(); })
  .catch(err => { console.error("ERR:", err.message); client.end(); });
