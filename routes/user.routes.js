const usersControllers = require("../controllers/user.controller");
module.exports = (app) => {
  const usersControllers = require("../controllers/user.controller");

  var router = require("express").Router();

  router.post("/registration", usersControllers.registration);

  // Регистрация и вход с телефона
  router.post("/registration-phone", usersControllers.registrationPhone);
  router.post("/check-sms", usersControllers.checkSms);

  router.post("/login", usersControllers.login);

  router.get("/getMe", usersControllers.getMe);

  router.get("/emailVerify", usersControllers.verifyEmail);

  router.post("/addRoleUser", usersControllers.addRoleUser);

  router.post("/addRoleInTable", usersControllers.addRoleInTable);

  router.patch("/chandeDataProfile", usersControllers.changeProfilDAta);

  router.get("/getMatch", usersControllers.getMatch);

  // router.get("/changePassword", usersControllers.changePassword);
  app.use("/", router);
};
