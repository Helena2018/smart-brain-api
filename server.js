import express from 'express';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt-nodejs';
import cors from 'cors';
import knex from 'knex';

const db = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'newuser',
      password : '123',
      database : 'smart-brain'
    }
  });
  // db.select('*').from('users').then(data => {
  //   console.log(data);
  // })

const app = express();

app.use(bodyParser.json());
app.use(cors());

const database = {
  users: [
    {
      id: '123',
      name: 'Lilly',
      email: 'lilly@gmail.com',
      password: 'lilly',
      entries: 0,
      joined: new Date()
    },
    {
      id: '124',
      name: 'Jhon',
      email: 'jhon@gmail.com',
      password: 'john',
      entries: 0,
      joined: new Date()
    }
  ]
}

app.get('/', (req, res) => {
  res.send(database.users);
})

app.post('/signin', (req, res) => {
  db.select('email', 'hash').from('login')
  .where('email', '=', req.body.email)
  .then(data => {
    const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
    if(isValid) {
      return db.select('*').from('users')
      .where('email', '=', req.body.email)
      .then(user => {
        res.json(user[0])
      })
      .catch(err => res.status(400).json('unable to get user'))
    } else {
      res.status(400).json('wrong credenthials')
    }
  })
  .catch(err => res.status(400).json('wrong credenthials'))
})

app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  const hash = bcrypt.hashSync(password);
  db.transaction(trx => {
    trx.insert({
      hash: hash,
      email: email
    })
    .into('login')
    .returning('email')
    .then(loginEmail => {
      return trx('users')
        .returning('*')
        .insert({
          name: name,
          email: loginEmail[0].email,
          joined: new Date()
        })
        .then(user => {
          res.json(user[0])
        })
    })
    .then(trx.commit)
    .catch(trx.rollback)
  })
  .catch(err => res.status(400).json('unable to register'))
})

app.get('/profile/:id', (req, res) => {
  const { id } = req.params;
  db.select('*').from('users').where({id})
  .then(user => {
    if(user.length) {
      res.json(user[0])
    } else {
      res.status(400).json('not found')
    }
  })
  .catch(err => res.status(400).json('error getting user'))
})

app.put('/image', (req, res) => {
  const { id } = req.body;
  db('users').where('id', '=', id)
  .increment('entries', 1)
  .returning('entries')
  .then(entries => {
    res.json(entries[0].entries);
  })
  .catch(err => res.status(400).json('unable go get entries!'))
})

app.listen(3000, () => {
  console.log('App is runing on port 3000');
})