const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
const cryptoRandomString = require("crypto-random-string");

const feedRouter = require("./routes/feed");
const authRouter = require("./routes/auth");
// const isAuthRouter = require("./middleware/is-auth");

const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      cryptoRandomString({ length: 15, type: "url-safe" }) +
        "_" +
        file.originalname
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  next();
});
app.use(bodyParser.json());
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use("/images/", express.static(path.join(__dirname, "images")));

app.use("/auth", authRouter);
app.use("/feed", feedRouter);

// Error Handling Route
app.use((error, req, res, next) => {
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  console.log(error.message);
  res.status(status).json({ message: message, data: data });
});

mongoose
  .connect(
    "mongodb+srv://{<mongodb admin name>}:{<mongodb admin pass>}@cluster0-a1qqq.mongodb.net/messages?retryWrites=true&w=majority"
  )
  .then((res) => {
    const server = app.listen(8080);
    console.log("Connected to the Database");
    const io = require("./socket").init(server);
    io.on("connection", (socket) => {
      console.log("Client connected");
    });
  })
  .catch((err) => console.log(err));
