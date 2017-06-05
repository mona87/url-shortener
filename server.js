const express = require('express');
const path = require('path');
const mongoose = require('mongoose')
const url = process.env.MONGOLAB_URI;

const app = express();


mongoose.Promise = global.Promise;

mongoose.connect(url);

let schema = mongoose.Schema({
  original_url: String,
  short_url: String,
});

const Model = mongoose.model('Model', schema);

const characters = "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNOPQRSTUVWXYZ";

//check if url is valid
function urlIsValid(url) {
  let regEx = /^https?:\/\/(\S+\.)?(\S+\.)(\S+)\S*/;
  return regEx.test(url);
}

//generate short string
function createShortUrl() {
  let length = new Array(4);
  let shortUrl = '';

  for (let i of length) {
    shortUrl += characters[Math.floor(Math.random() * (characters.length - 1))]
  }
  return shortUrl

}

app.use(express.static('client'));

app.get('/', (req, res) => {
  res.sendFile()
})

app.get('/new/*', (req, res) => {
  let url = req.params[0]

  if (urlIsValid(url)) {
    //validate url
    let newUrl = createShortUrl();

    Model.findOne({ short_url: newUrl })
      .then(doc => {
        //check is shortUrl exists, returns existing url 
        return doc ? doc.shortUrl : false
      })
      .then(shortUrl => {
        //if it doesn't exist, save url in database
        if (!shortUrl) {
          let newModel = new Model({
            original_url: url,
            short_url: newUrl
          })
          return newModel.save();
        }

      })
      .then(newUrl => {
        //return the new link
        res.send({
          original_url: newUrl.original_url,
          short_url: `http://localhost:5000/${newUrl.short_url}`
        });
      })
      .catch((error) => {
        res.status(500).json({ error: 'error' });
        return mongoose.Promise.reject(err);

      });
  } else {
    res.status(500).json({ error: 'Invalid url format' })
  }
})

app.get('/:shortUrl', (req, res) => {
  let shortUrl = req.params.shortUrl;
  //find shorturl in database and then redirect to orignal url
  Model.findOne({ short_url: shortUrl })
    .then(doc => {
      if (doc) {
        res.redirect(doc.original_url);
      } else {
        res.status(404).json({ error: 'page not found' })
      }

    })

})

app.listen(process.env.PORT || 5000, process.env.IP || "0.0.0.0", () => {
  console.log('app running on 5000')
})
