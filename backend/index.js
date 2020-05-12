const keys = require('./keys');

// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const redis = require('redis');

const app = express();
app.use(cors());
app.use(bodyParser.json());
console.log(keys);

const port = 5000;

const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort
});

const { Pool } = require('pg');

const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPortq
})

pgClient.on('error', () => console.log('Cannot connect to PG database'));

pgClient
  .query('CREATE TABLE IF NOT EXISTS sumy (a1 INT, q INT, n INT, suma INT)')
  .catch(err => console.log(err));

app.post('/suma-ciagu', (req, res) => {
  const {a1, q, n} = req.body;
  const key = `${a1}-${q}-${n}`;
  redisClient.get(key, async (err, value) => {
    if (!value) {
      const sumaCiagu;
        if (q==1) {
            sumaCiagu = a1 * n;
        }
        else {
            sumaCiagu = a1 * (1-Math.pow(q, n))/(1-q);
        }
      redisClient.set(key, sumaCiagu);
      pgClient.query(`INSERT INTO sumy(a1, q, n, suma) VALUES (${a1}, ${q}, ${n}, ${sumaCiagu})`);
      res.send({suma: sumaCiagu});
    }
    else {
      console.log('Suma istnieje juz w cachu')
      res.send({suma: value})
    }
  })
});

app.get('/results', async (req, res) => {
  const results = await pgClient.query('SELECT * FROM sumy');
  res.send({sumy: results.rows});
})

app.listen(port, err => {
  console.log(`Backend app listening on ${port}`);
})