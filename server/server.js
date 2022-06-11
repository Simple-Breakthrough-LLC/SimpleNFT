const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const cors = require("cors");
const app = express();
const server = require("http").createServer(app);
const cookieParser = require("cookie-parser");

const path = require("path");

const connectDB = require("./db");
const sessionMiddleware = require("./middleware/session-middleware");
const contractRouter = require("./routes/contract.router")

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json"
  );
  next();
});

dotenv.config();
connectDB();

app.use(sessionMiddleware);

app.use(express.static("build"));

app.use(cookieParser());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb'}));

app.use("/contract", contractRouter);

app.get("/*", function (req, res) {
  res.sendFile(path.join(__dirname, "../build/index.html"), function (err) {
    if (err) {
      console.log(err);
    }
  });
});

// createData()

server.listen(PORT, () => {
  console.log(`listening on port: ${PORT}`);
});
