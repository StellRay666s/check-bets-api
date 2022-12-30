module.exports = (app) => {
  const usersControllers = require("../controllers/user.controller");

  var router = require("express").Router();
  const bodyParser = require("body-parser");
  const json = bodyParser.json();
  var urlencodedParser = bodyParser.urlencoded({ extended: false });

  router.post("/registration", usersControllers.registration);

  // Регистрация и вход с телефона
  router.post("/registration-phone", usersControllers.registrationPhone);

  router.post("/check-sms", usersControllers.checkSms);

  router.post("/login", usersControllers.login);

  router.get("/getMe", usersControllers.getMe);

  router.get("/getUser", usersControllers.getUser);

  router.get("/emailVerify", usersControllers.verifyEmail);

  router.post("/addRoleUser", usersControllers.addRoleUser);

  router.post("/addTarifsTable", usersControllers.addTariffsInTable);

  router.post("/addTarifsUser", usersControllers.addTarifsUser);

  router.post("/addRoleInTable", usersControllers.addRoleInTable);

  router.patch("/chandeDataProfile", usersControllers.changeProfilDAta);

  router.get("/getUsers", usersControllers.getUsers);

  router.post("/buyTariffs", usersControllers.buyTariffs);

  router.patch("/changePassword", usersControllers.changePassword);

  router.get("/getMatch", usersControllers.getMatch);

  router.get("/getMatchLeag", usersControllers.getMatchLeag);

  router.get("/getMatchHockey", usersControllers.getMatchHockey);

  // router.get("/getTodaMatch", usersControllers.getTodaMatch);

  router.get("/getLeag", usersControllers.getLeag);

  router.get("/getFilterMatch", usersControllers.getFilterMatch);

  router.get("/getTodaMatch", usersControllers.getTodaMatch);

  router.get("/getPrevMatch", usersControllers.getPrevMatch);

  router.get("/getPrevMatchHockey", usersControllers.getPrevMatchHockey);

  router.get("/getStatsPrevMatch", usersControllers.getStatsPrevMatch);

  router.get("/getStatsPrevMatchHockey", usersControllers.getStatsPrevMatchHockey);


  router.get("/getStatsPrevMatchHockeyAway", usersControllers.getStatsPrevMatchHockeyAway);

  router.get("/getStatsPrevMatchAway", usersControllers.getStatsPrevMatchAway);

  router.get("/getPrevsMatch", usersControllers.getPrevsMatch);

  router.post("/stats", usersControllers.stats);

  router.post("/statsAway", usersControllers.StatsAway);

  router.get('/getPrewsMatchss', usersControllers.getPrevMatchesss)


  // router.get("/changePassword", usersControllers.changePassword);
  app.use("/", router);
};
