const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./models");
const path = require("path");
const multer = require("multer");
const formData = require("express-form-data");
const compression = require('compression')
const cron = require('node-cron')
var corsOptions = {};
const { checkTimeSubscribe } = require('./utils/chekSubscribe')


const app = express();

// cron.schedule('*/1 * * * * *', function () {
//   checkTimeSubscribe()

// })

cron.schedule('*/1 * * * *', function () {
  console.log(1)

})

// Без формдаты никуда ))
// app.use(formData.parse());

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 8000;
app.use(express.static(path.join(__dirname, "public")));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

require("./routes/user.routes.js")(app);
require("./routes/news.routes.js")(app);
app.use("/upload", express.static("uploads"));

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, "uploads");
  },
  filename: (_, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

app.post("/upload", upload.single("image"), (req, res) => {
  res.json({
    url: `/upload/${req.file.originalname}`,
  });
});

app.listen(PORT, () => {
  console.log("Server running in " + PORT);
});

db.sequelize
  // .sync({ force: true })
  .sync()
  .then(() => console.log("synced ok"))
  .catch((err) => console.log("error" + err));
app.get("/", (req, res) => {
  res.send("Helslo world");
});
