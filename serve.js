const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./models");
const path = require("path");
const multer = require("multer");
const formData = require("express-form-data");
var corsOptions = {
  origin: "https://check-bets.online",
};

const app = express();

// Без формдаты никуда ))
app.use(formData.parse());

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
const PORT = process.env.PORT || 8000;
app.use(express.static(path.join(__dirname, "public")));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

require("./routes/user.routes.js")(app);
require("./routes/news.routes.js")(app);

const storage = multer.diskStorage({
    destination: (_, __, cb) => {
        cb(null, "uploads");
    },
    filename: (_, file, cb) => {
        cb(null, file.originalname);
    },
});
const upload = multer({storage});

app.use("/upload", express.static("uploads"));
app.post("/upload", upload.single("image"), (req, res) => {
    res.json({
        url: `/uploads/${req.file.originalname}`,
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
