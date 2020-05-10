const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

// Cross-orign setup - For developent use *
var corsOptions = {
  origin: "*"
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Init DB

const db = require("./app/models");
db.sequelize.sync();

// db.sequelize.sync({ force: true }).then(() => {
//     console.log("Drop and re-sync db.");
//   });

const ps2ws = require('./app/census/wsHandler');
ps2ws.createStream();

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to ps2alerts websocket application." });
});

//require("./app/routes/charLogin.routes")(app);


// set port, listen for requests
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});