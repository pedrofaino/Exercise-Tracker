const express = require('express')
const app = express()
const cors = require('cors');
const { default: mongoose } = require('mongoose');
const url = require('url')
const bodyParser = require('body-parser');
require('dotenv').config()


app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: { type: Date, default: Date.now }
})
let exercise = mongoose.model('exercise', exerciseSchema);

const userSchema = new mongoose.Schema({
  username: String,
  exercises: [exerciseSchema]
})
let user = mongoose.model('user', userSchema);

app.get('/api/users', async function (req, res) {
  const users = await user.find()
  const listUsers = []
  for (let user in users) {
    listUsers.push({
      username: users[user].username,
      _id: users[user]._id,
    })
  }
  return res.json(listUsers)
})

app.post('/api/users', function (req, res) {
  let username = req.body.username;
  let newUser = new user({ username: username })
  newUser.save().then((err) => {
    if (err) {
      console.log(err)
    }
    console.log("User created")
  })
  return res.json({ username: newUser.username, _id: newUser._id })
})

app.post('/api/users/:id/exercises', async function (req, res) {
  let id = req.params.id;
  let userD = await user.findById(id);
  let des = req.body.description
  let dur = req.body.duration
  let date = new Date(req.body.date)
  let newExercise = new exercise({ username: userD.username, description: des, duration: dur, date: date })
  userD.exercises.push(newExercise)
  try {
    userD.save().then(() => console.log(`Exercise added to ${userD}`));
    return res.json({ _id:userD._id, username:userD.username, date:date.toDateString(), duration: dur, description:des })
  } catch (error) {
    console.log(`Error: ${error}`)
    return res.json({ error: error })
  }
})

app.get('/api/users/:id/logs', async function (req, res) {
  const userId = req.params.id
  const search = url.parse(req.url, true).search
  const from = new Date(search.split('&')[0].slice(1)).valueOf()
  const to = new Date(search.split('&')[1]).valueOf()
  const limit = (search.split('&')[2])
  const userD = await user.findById(userId);
  const listOfExercises = [];
  for (let exercise of userD.exercises) {
    if (exercise.date.valueOf() > from && exercise.date.valueOf() < to) {
      listOfExercises.push({
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString()
      });
    }
  }
  console.log(limit)
  console.log(listOfExercises.slice(0, limit));
  return res.json({ username: userD.username, count: userD.exercises.length(), _id: userD._id, log: listOfExercises.slice(0, limit) })
})





mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"));
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
