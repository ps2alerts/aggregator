const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")
const logger = require("winston")

class WebsocketServer {
  constructor(
      private _express,
      private _bodyParser,
      private _cors,
      private _logger
  ) {}

  start() {
    this._logger('Here we go!');
  }
}

const websocketServer = new WebsocketServer(express, bodyParser, cors, logger)



const app = express()

// Cross-orign setup - For developent use *
var corsOptions = {
  origin: "*"
}

app.use(cors(corsOptions))

// parse requests of content-type - application/json
app.use(bodyParser.json())

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

// Init DB

const db = require("./models")
db.sequelize.sync()

db.sequelize.sync({ force: true }).then(() => {
  console.log("Drop and re-sync db.")
})

const ps2ws = require('./src/censusSocket/wsHandler')
ps2ws.createStream()

//for testing purpose
// const qApi = require('./app/censusSocket/queryApiHandler');
// qApi.getRegionForZone(2);

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to ps2alerts websocket application." })
})

//require("./app/routes/charLogin.routes")(app);


// set port, listen for requests
const PORT = process.env.PORT || 3000
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}.`);
// });
