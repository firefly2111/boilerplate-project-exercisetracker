const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

var Schema = mongoose.Schema;
var userAndExercise = new Schema({
  username: String,
  count: Number,
  log: [{description: String, duration: Number, date: {type: Date, default: Date.now}}]
});

var addUserAndUpdate = mongoose.model("addUserAndUpdate", userAndExercise);

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/exercise/new-user", (req,res) => {
  addUserAndUpdate.find().then(data => {
    var databaseData = new addUserAndUpdate({username: req.body.username, count: 0});
    data = data.filter((i) => i.username === req.body.username);
    if(data.length === 0){
      databaseData.save().then(result => {
        res.json({username: result.username, userId: result._id});
      }).catch(err => {
        res.json({error: err});
      });
    }else{
      res.json({message: "Username is already taken"});
    }
  });
});

app.get("/api/exercise/users", (req, res) => {
  addUserAndUpdate.find().then(result => {
    res.json(result);
  }).catch(err => {
    res.json({error: err});
  });
});

app.post("/api/exercise/add", (req, res) => {
  var dataToAdd = {description: req.body.description, duration: req.body.duration, date: req.body.date};
  var searchId = req.body.userId;
  
  if(req.body.description === "" || req.body.duration === ""){
    res.json({message: "Please fill in all fields"});
  }else{
  addUserAndUpdate.findById(searchId).then(result => {
    result.log.push(dataToAdd);
    result.markModified('log');
    result.save().then(data => {
      res.json({message: "data saved"});
    }).catch(err => {
      res.json({message: "save not work"});
    });
  }).catch(err => {
    res.json({error: "no Id"});
  });
  }
});


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
