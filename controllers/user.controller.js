const db = require("../models");
const Users = db.Users;
const Roles = db.Roles;
const UserRoles = db.UserRoles;
const Tariffs = db.Tariffs;
const Leags = db.Leags;
const MatchLeag = db.MatchLeag;
const MatchLeagHockey = db.MatchHockey;
const PrevMatches = db.PrevMatches;
const StatsHome = db.StatsHome;
const StatsAway = db.StatsAway;
const StatsHomeHockey = db.StatsHomeHockey;
const PrewMatchHockey = db.PrevMatchHockey;
const StatsAwayHockey = db.StatsAwayHockey;
const userTariffs = db.userTariffs;
const Smscode = db.Smscode;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
var FormData = require("form-data");
var data = new FormData();
const sequelize = require('sequelize')

const { main, smsCodeSend } = require("../utils/mailer");
const { mainChancgePassword } = require("../utils/mailChangePassword");
const crypto = require("crypto");
const axios = require("axios");

const saltRounds = 12;

exports.registration = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    if (!email || !password) {
      res.status(400).send({
        message: "Поля не должны быть пустыми",
      });
    }

    const checkUser = await Users.findOne({ where: { email } });
    if (checkUser) {
      res.status(400).send({
        message: "Адресс электронной почты уже используется",
      });
      return false;
    }

    const role = await Roles.findOne({ where: { name: "Пользователь" } });
    const tariffs = await Tariffs.findOne({ where: { name: "Базовый" } });

    const tokenEmail = crypto.randomBytes(64).toString("hex");

    // await main();
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const user = await Users.create({
      email: email,
      password: passwordHash,
      // hash: tokenEmail,
    });

    if (user) {
      Users.update(
        {
          tariffs: sequelize.fn(
            "array_append",
            sequelize.col("tariffs"),
            tariffs.name
          ),
        },
        { where: { email: email } }
      );

      await user.addRoles(role);
    }

    return res.json({ message: "Регистрация прошла успешно." });
  } catch (err) {
    res.status(400).send({
      message: "Ошибка при регистрации",
    });
    console.log(err);
  }
};

exports.registrationPhone = async (req, res) => {
  try {
    const phone = req.body.phone;
    if (!phone) {
      res.status(400).send({
        message: "Поле не должно быть пустым",
      });
    }
    const checkUser = await Users.findOne({ where: { phone } });

    function getRandomArbitrary(min, max) {
      return Math.random() * (max - min) + min;
    }

    const code = getRandomArbitrary(1000, 9999).toFixed();
    const smsCode = await Smscode.create({
      code: code,
    });
    if (checkUser) {
      checkUser.addSmscode(smsCode);
    } else {
      const role = await Roles.findOne({ where: { name: "Пользователь" } });
      const user = await Users.create({
        phone: phone,
      });
      await user.addRoles(role);
      await user.addSmscode(smsCode);
    }
    await smsCodeSend(code);
    return res.json({ message: "Код отправлен." });
  } catch (err) {
    console.log(err);
    return res.status(400).send({
      message: "Ошибка при регистрации",
    });
  }
};

exports.checkSms = async (req, res) => {
  try {
    const phone = req.body.phone;
    const code = req.body.code;
    if (!phone || !code) {
      return res.status(400).send({
        message: "Пользователь не найден",
      });
    }
    const checkUser = await Users.findOne({ where: { phone: phone } });

    if (!checkUser) {
      return res.status(400).send({
        message: "Пользователь не найден",
      });
    }
    let profile = null;
    await checkUser.getSmscodes().then((codes) => {
      for (codeOne of codes) {
        if (codeOne.code === code) {
          const payload = { email: checkUser.email, id: checkUser.id };
          const token = jwt.sign(payload, "secret", { expiresIn: 86400 });
          profile = { checkUser, token };
        }
      }
    });
    if (profile) {
      await checkUser.getSmscodes().then((codes) => {
        for (codeOne of codes) {
          codeOne.destroy();
        }
      });
      return res.send(profile);
    }
    return res.status(400).send({
      message: "Неверный код",
    });
  } catch (err) {
    res.status(400).send({
      message: "Ошибка при вводе кода",
    });
    console.log(err);
  }
};

exports.login = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    if (!email || !password) {
      return res.status(400).send({
        message: "Поля не должны быть пустыми",
      });
    }

    const checkUser = await Users.findOne({
      where: { email: email },
      raw: true,
    });

    if (!checkUser) {
      return res.status(400).send({ message: "Пользователя не существует" });
    }

    // if (!checkUser.verifiedEmail) {
    //   return res.status(400).send({
    //     message:
    //       "Для авторизации необходимо подтвердить адресс электронной почты",
    //   });
    // }

    const passwordEqual = await bcrypt.compare(password, checkUser.password);

    if (passwordEqual) {
      const payload = { email: checkUser.email, id: checkUser.id };
      const token = jwt.sign(payload, "secret", { expiresIn: 86200 });
      res.send({
        user: {
          name: checkUser.name,
          lastname: checkUser.lastname,
          email: checkUser.email,
          phone: checkUser.phone,
          tariffs: checkUser.tariffs,
        },
        token,
      });
    } else {
      res.status(400).send({ message: "Неправильный пароль" });
    }
  } catch (err) {
    return res.send(err);
  }
};

exports.getUsers = async (req, res) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).send({ message: "Неавторизован" });
  }
  const user = jwt.decode(token.replace("Bearer", "").trimStart(), "secret");
  const userRole = await UserRoles.findAll({ where: { UserId: user.id } });

  // res.send(userRole.filter(item => item.RoleId ===2));

  if (!userRole.filter((item) => item.RoleId === 2)) {
    return res.status(400).send({ message: "У вас нету соответсвующих прав!" });
  }

  const usersList = await Users.findAll({
    attributes: ["id", "name", "lastname", "phone", "email", "tariffs"],
  });

  return res.send(usersList);
};

exports.getUser = async (req, res) => {
  const token = req.headers.authorization;
  const id = req.query.id;

  const decode = jwt.decode(token.replace("Bearer", "").trimStart(), "secret");
  const roleId = await UserRoles.findAll({ where: { UserId: decode.id } });

  if (!roleId.filter((item) => item.RoleId === 2)) {
    return res.status(400).send({ message: "У вас нету соответсвующих прав!" });
  }

  const findUser = await Users.findOne(
    {
      attributes: ["id", "name", "lastname", "phone", "email", "tariffs"],
      where: { id: id },
    }
    // { where: { id: id } }
  );

  return res.send(findUser);
};

exports.verifyEmail = async (req, res) => {
  try {
    const hash = req.query.hash;
    const user = await Users.findOne({ where: { hash: hash } });
    if (user.verifiedEmail) {
      return res.send({ message: "Email уже подтвержден" });
    }
    console.log(user.verifiedEmail);
    if (user) {
      await Users.update(
        { verifiedEmail: true, hash: "" },
        { where: { email: user.email } }
      );
    }
    return res.render("index", {});
  } catch (err) {
    return res.send("Ошибка при подтверждении почты", err);
  }
};

exports.addRoleInTable = async (req, res) => {
  try {
    const role = req.body.role;
    const findRole = await Roles.findOne({ where: { name: role } });
    if (findRole) {
      return res.status(400).json({ message: "Такая роль уже существует!" });
    }
    await Roles.create({ name: role });
    return res.json({ message: "Роль успешно добавлена" });
  } catch (err) {
    return res.json({ message: "Ошибка при добавлении роли" });
  }
};

exports.addRoleUser = async (req, res) => {
  try {
    const email = req.body.email;
    const role = req.body.role;
    const user = await Users.findOne({ where: { email: email } });
    if (!user) {
      return res.json({ message: "Пользователь не найден" });
    }
    const findRole = await Roles.findOne({ where: { name: role } });
    if (!findRole) {
      return res.json({ message: "Роль не найдена!" });
    }
    await user.addRoles(findRole);

    return res.send({ message: "Роль добавлена" });
  } catch (err) { }
};

exports.addTariffsInTable = async (req, res) => {
  try {
    const tariff = req.body.tariff;
    const price = req.body.price;
    const findTariff = await Tariffs.findOne({ where: { name: tariff } });
    if (findTariff) {
      return res.status(400).json({ message: "Такойя тариф уже существует!" });
    }
    await Tariffs.create({ name: tariff, price: price });
    return res.json({ message: "Тариф успешно добавлен" });
  } catch (err) {
    return res.json({ message: err });
  }
};

exports.addTarifsUser = async (req, res) => {
  try {
    const email = req.body.email;
    const tariffs = req.body.tariffs;

    const user = await Users.findOne({ where: { email: email } });
    if (!user) {
      return res.json({ message: "Пользователь не найден" });
    }
    const findTariff = await Tariffs.findOne({ where: { name: tariffs } });
    if (!findTariff) {
      return res.json({ message: "Тариф не найден!" });
    }
    await user.addTariffs(findTariff);

    return res.send({ message: "Тариф добавлен" });
  } catch (err) { }
};

exports.changeProfilDAta = async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).send({ message: "Неавторизован" });
    }
    const replaceToken = token.replace("Bearer", "").trimStart();

    const user = jwt.decode(replaceToken, "secret");

    if (user.email === req.body.email) {
      await Users.update(
        {
          name: req.body.name,
          lastname: req.body.lastname,
          phone: req.body.phone,
        },
        { where: { id: user.id } }
      );
      return res.send({ message: "Данные изменены без email." });
    } else {
      await Users.update(
        {
          name: req.body.name,
          lastname: req.body.lastname,
          phone: req.body.phone,
          email: req.body.email,
          verifidEmail: false,
        },
        { where: { id: user.id } }
      );

      const newUser = await Users.findOne({
        where: { id: user.id },
      });
      const payload = { email: newUser.email, id: newUser.id };
      const updateToken = jwt.sign(payload, "secret", { expiresIn: 86400 });
      return res.send({
        message: "Данные успешно обновлены",
        updateToken: updateToken,
      });
    }
  } catch (err) {
    return res.send(err);
  }
};

exports.getMe = async (req, res) => {
  try {
    const token = req.headers.authorization.replace("Bearer", "").trimStart();
    if (!token) {
      return res.status(401).json({ message: "Не авторизован!" });
    }

    if (!jwt.verify(token, "secret")) {
      return res.send({ message: "Токен не действителен" });
    }

    const decoded = jwt.decode(token, "secret");
    if (decoded) {
      const user = await Users.findOne({
        where: { id: decoded.id },
        attributes: ["id", "name", "lastname", "phone", "email", "tariffs"],
      });

      const tariffs = await userTariffs.findOne({
        where: { UserId: decoded.id },
      });

      return res.send(user);
    }
  } catch (err) {
    res.json({ message: err });
  }
};

exports.saveChangeOnAdmin = async (req, res) => {
  try {
    const token = req.headers.authorization;
    const userId = req.body.id;
    if (!token) {
      return res.send({ message: "Не авторизован" });
    }
    const decode = jwt.decode(
      token.replace("Bearer", "").trimStart(),
      "secret"
    );

    const roleId = await UserRoles.findAll({ where: { UserId: decode.id } });
    if (!roleId.filter((item) => item.RoleId === 2)) {
      return res
        .status(400)
        .send({ message: "У вас нету соответсвующих прав!" });
    }

    const user = Users.update(
      { where: { id: userId } },
      { name: req.body.name, lastname: req.body.lastname }
    );
  } catch (err) {
    res.send("Ошибка");
  }
};

exports.buyTariffs = async (req, res) => {
  const token = req.headers.authorization;
  const decode = jwt.decode(token.replace("Bearer", "").trimStart());
  if (!token) {
    return res.send({ message: "Неавторизован" });
  }
  const tariffs = await Tariffs.findOne({
    where: { name: "Премиум" },
  });

  if (!tariffs) {
    return res.send({ message: "Тариф не найден" });
  }

  await Users.update(
    {
      tariffs: sequelize.fn(
        "array_append",
        sequelize.col("tariffs"),
        tariffs.name
      ),
    },
    { where: { id: decode.id } }
  );
  return res.send({ message: "Тариф приобретен" });
};

exports.changePassword = async (req, res) => {
  const newPassword = req.body.newPassword;
  const currentPassword = req.body.currentPassword;
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).send({ message: "Неавторизован" });
  }

  const decode = jwt.decode(token.replace("Bearer", "").trimStart());
  const user = await Users.findOne({ where: { id: decode.id } });

  const verifyPassword = await bcrypt.compare(currentPassword, user.password);

  if (!verifyPassword) {
    return res.status(403).send({ message: "Неверный пароль" });
  }

  const hashPassword = await bcrypt.hash(newPassword, saltRounds);

  await Users.update(
    {
      password: hashPassword,
    },
    { where: { id: user.id } }
  );

  return res.send({ message: "Пароль успешно обновлен" });
};

///Матчи

exports.getMatch = async (req, res) => {
  try {
    const response1 = await axios.get(
      "https://flashlive-sports.p.rapidapi.com/v1/tournaments/list",
      {
        params: { sport_id: "1", locale: "ru_RU" },
        headers: {
          "accept-encoding": "*",
          "X-RapidAPI-Key":
            "08e003e353msh5f64ec3ee6ecbeep151a3bjsn2b8d2f5d4103",
          "X-RapidAPI-Host": "flashlive-sports.p.rapidapi.com",
        },
      }
    );

    const response = await axios.get(
      "https://flashlive-sports.p.rapidapi.com/v1/events/list",
      {
        params: {
          locale: "ru_RU",
          sport_id: "4",
          indent_days: "1",
          timezone: "3",
        },
        headers: {
          "accept-encoding": "*",
          "X-RapidAPI-Key":
            "08e003e353msh5f64ec3ee6ecbeep151a3bjsn2b8d2f5d4103",
          "X-RapidAPI-Host": "flashlive-sports.p.rapidapi.com",
        },
      }
    );
    const NHL = response.data.DATA.filter((item) => item.NAME === "США: НХЛ");

    const filterLeag = response1.data.DATA.filter(
      (item) =>
        (item.LEAGUE_NAME === "Лига А") & (item.COUNTRY_NAME === "Австралия") ||
        (item.LEAGUE_NAME === "Бундеслига") &
        (item.COUNTRY_NAME === "Австрия") ||
        (item.LEAGUE_NAME === "Вторая лига") &
        (item.COUNTRY_NAME === "Австрия") ||
        (item.LEAGUE_NAME === "Премьер-лига") &
        (item.COUNTRY_NAME === "Англия") ||
        (item.LEAGUE_NAME === "Чемпионшип") &
        (item.COUNTRY_NAME === "Англия") ||
        (item.LEAGUE_NAME === "Лига Професиональ") &
        (item.COUNTRY_NAME === "Аргентина") ||
        (item.LEAGUE_NAME === "Высшая лига") &
        (item.COUNTRY_NAME === "Бельгия") ||
        (item.LEAGUE_NAME === "Чемпионат Бразилии") &
        (item.COUNTRY_NAME === "Бразилия") ||
        (item.LEAGUE_NAME === "Чемпионат Бразилии В") &
        (item.COUNTRY_NAME === "Бразилия") ||
        (item.LEAGUE_NAME === "Бундеслига") &
        (item.COUNTRY_NAME === "Германия") ||
        (item.LEAGUE_NAME === "Вторая Бундеслига") &
        (item.COUNTRY_NAME === "Германия") ||
        (item.LEAGUE_NAME === "Суперлига") & (item.COUNTRY_NAME === "Греция") ||
        (item.LEAGUE_NAME === "Суперлига") & (item.COUNTRY_NAME === "Дания") ||
        (item.LEAGUE_NAME === "Примера") & (item.COUNTRY_NAME === "Испания") ||
        (item.LEAGUE_NAME === "Сегунда") & (item.COUNTRY_NAME === "Испания") ||
        (item.LEAGUE_NAME === "Серия А") & (item.COUNTRY_NAME === "Италия") ||
        (item.LEAGUE_NAME === "Серия В") & (item.COUNTRY_NAME === "Италия") ||
        (item.LEAGUE_NAME === "Суперлига") & (item.COUNTRY_NAME === "Китай") ||
        (item.LEAGUE_NAME === "Лига MX") & (item.COUNTRY_NAME === "Мексика") ||
        (item.LEAGUE_NAME === "Высшая лига") &
        (item.COUNTRY_NAME === "Нидерланды") ||
        (item.LEAGUE_NAME === "Первый дивизион") &
        (item.COUNTRY_NAME === "Нидерланды") ||
        (item.LEAGUE_NAME === "Премьер-лига") &
        (item.COUNTRY_NAME === "Польша") ||
        (item.LEAGUE_NAME === "Суперлига") & (item.COUNTRY_NAME === "Сербия") ||
        (item.LEAGUE_NAME === "Первая лига") &
        (item.COUNTRY_NAME === "Словакия") ||
        (item.LEAGUE_NAME === "Первая лига") &
        (item.COUNTRY_NAME === "Словения") ||
        (item.LEAGUE_NAME === "МЛС") & (item.COUNTRY_NAME === "США") ||
        (item.LEAGUE_NAME === "Суперлига") & (item.COUNTRY_NAME === "Турция") ||
        (item.LEAGUE_NAME === "Первая лига") &
        (item.COUNTRY_NAME === "Франция") ||
        (item.LEAGUE_NAME === "Вторая лига") &
        (item.COUNTRY_NAME === "Франция") ||
        (item.LEAGUE_NAME === "HNL") & (item.COUNTRY_NAME === "Хорватия") ||
        (item.LEAGUE_NAME === "Первая лига") &
        (item.COUNTRY_NAME === "Чехия") ||
        (item.LEAGUE_NAME === "Второй дивизион") &
        (item.COUNTRY_NAME === "Чехия") ||
        (item.LEAGUE_NAME === "Суперлига") &
        (item.COUNTRY_NAME === "Швейцария") ||
        (item.LEAGUE_NAME === "Первая лига") &
        (item.COUNTRY_NAME === "Швейцария") ||
        (item.LEAGUE_NAME === "Высшая лига") &
        (item.COUNTRY_NAME === "Швеция") ||
        (item.LEAGUE_NAME === "Первая лига") &
        (item.COUNTRY_NAME === "Швеция") ||
        (item.LEAGUE_NAME === "Премьер-лига") &
        (item.COUNTRY_NAME === "Шотландия") ||
        (item.LEAGUE_NAME === "К-Лига 1") &
        (item.COUNTRY_NAME === "Южная Корея") ||
        (item.LEAGUE_NAME === "Лига Джей-1") &
        (item.COUNTRY_NAME === "Япония") ||
        (item.LEAGUE_NAME === "Высший дивизион") &
        (item.COUNTRY_NAME === "Чили") ||
        (item.LEAGUE_NAME === "Высшая лига") &
        (item.COUNTRY_NAME === "Норвегия")
    );

    const allSports = NHL.concat(filterLeag);

    await Leags.bulkCreate(allSports);

    return res.send({ message: "Loaded" });
  } catch (err) { }

  // var config = {
  //   method: 'get',
  //   url: 'https://flashlive-sports.p.rapidapi.com/v1/events/h2h?locale=ru_RU&event_id=ANkQ5DxG',
  //   headers: {
  //     'accept-encoding': '*',
  //     'X-RapidAPI-Key': '08e003e353msh5f64ec3ee6ecbeep151a3bjsn2b8d2f5d4103',
  //     'X-RapidAPI-Host': 'flashlive-sports.p.rapidapi.com',
  //     ...data.getHeaders()
  //   },
  //   data: data
  // };
  // axios(config)
  //   .then(function (response) {
  //     res.send(JSON.stringify(response.data));
  //   })
  //   .catch(function (error) {
  //     console.log(error);
  //   })
};

exports.getMatchLeag = async (req, res) => {
  try {
    const leagList = await Leags.findAll();

    const TEMPLATE_ID = leagList.map((item) => item.TEMPLATE_ID);
    const response = await axios.get(
      "https://flashlive-sports.p.rapidapi.com/v1/events/list",
      {
        params: {
          locale: "ru_RU",
          sport_id: "1",
          timezone: "3",
          indent_days: "0",
        },
        headers: {
          "accept-encoding": "*",
          "X-RapidAPI-Key":
            "08e003e353msh5f64ec3ee6ecbeep151a3bjsn2b8d2f5d4103",
          "X-RapidAPI-Host": "flashlive-sports.p.rapidapi.com",
        },
      }
    );

    const todayMatches = response.data.DATA.filter((item) =>
      TEMPLATE_ID?.includes(item.TEMPLATE_ID)
    );

    const events = todayMatches.flatMap((item) => item.EVENTS);
    const filterEvets = events.filter(
      (item) => item.STAGE_TYPE === "SCHEDULED"
    );

    await MatchLeag.bulkCreate(todayMatches);
    return res.send({ message: "Loaded" });
  } catch (err) { }
};

exports.getMatchHockey = async (req, res) => {
  try {
    const leagList = await Leags.findOne({ where: { LEAGUE_NAME: "НХЛ" } });
    const TEMPLATE_ID = leagList.TEMPLATE_ID;
    const response = await axios.get(
      "https://flashlive-sports.p.rapidapi.com/v1/events/list",
      {
        params: {
          locale: "ru_RU",
          sport_id: "4",
          timezone: "3",
          indent_days: "1",
        },
        headers: {
          "accept-encoding": "*",
          "X-RapidAPI-Key":
            "08e003e353msh5f64ec3ee6ecbeep151a3bjsn2b8d2f5d4103",
          "X-RapidAPI-Host": "flashlive-sports.p.rapidapi.com",
        },
      }
    );

    const leag = response.data.DATA.filter(
      (item) => item.TEMPLATE_ID === TEMPLATE_ID
    );

    await MatchLeagHockey.bulkCreate(leag);

    return res.send("Loaded");

    // const events = todayMatches.flatMap((item) => item.EVENTS);
    // const filterEvets = events.filter(
    //   (item) => item.STAGE_TYPE === "SCHEDULED"
    // );
  } catch (err) { }
};

exports.getTodaMatch = async (req, res) => {
  const matches = await MatchLeag.findAll();
  const hockey = await MatchLeagHockey.findAll();
  return res.send({ todayFootball: matches, todayHockey: hockey });
};

exports.getLeag = async (req, res) => {
  const leag = await Leags.findAll();

  return res.send(leag);
};

exports.getFilterMatch = async (req, res) => {
  const id = req.query.id;
  const todayMatch = await MatchLeag.findOne({ where: { TEMPLATE_ID: id } });

  if (!todayMatch) {
    return res.status(404).send({ message: "Сегодня нет матчей" });
  }

  const filterMatch = todayMatch.EVENTS.filter(
    (item) => item.STAGE_TYPE === "SCHEDULED"
  );
  return res.send(filterMatch);
};

exports.getPrevMatch = async (req, res) => {
  try {
    const matches = await MatchLeag.findAll();
    const eventId = matches.flatMap((item) =>
      item.EVENTS.map((item) => item.EVENT_ID)
    );
    for (let i = 0; i < eventId.length; i++) {
      const { data, status } = await axios.get(
        "https://flashlive-sports.p.rapidapi.com/v1/events/h2h",
        {
          params: { event_id: eventId[i], locale: "ru_RU" },
          headers: {
            "accept-encoding": "*",
            "X-RapidAPI-Key":
              "08e003e353msh5f64ec3ee6ecbeep151a3bjsn2b8d2f5d4103",
            "X-RapidAPI-Host": "flashlive-sports.p.rapidapi.com",
          },
        }
      );

      await PrevMatches.create({
        EVENT_ID: eventId[i],
        MATCHES_HOME: JSON.stringify(data.DATA[0].GROUPS[0].ITEMS),
        MATCHES_AWAY: JSON.stringify(data.DATA[0].GROUPS[1].ITEMS),
      });
    }

    return res.send({ message: "Loaded" });
  } catch (err) {
    return res.send({ err });
  }
};

exports.getPrevMatchHockey = async (req, res) => {
  try {
    const matches = await MatchLeagHockey.findAll();
    const eventId = matches.flatMap((item) =>
      item.EVENTS.map((item) => item.EVENT_ID)
    );
    for (let i = 0; i < eventId.length; i++) {
      const { data, status } = await axios.get(
        "https://flashlive-sports.p.rapidapi.com/v1/events/h2h",
        {
          params: { event_id: eventId[i], locale: "ru_RU" },
          headers: {
            "accept-encoding": "*",
            "X-RapidAPI-Key":
              "08e003e353msh5f64ec3ee6ecbeep151a3bjsn2b8d2f5d4103",
            "X-RapidAPI-Host": "flashlive-sports.p.rapidapi.com",
          },
        }
      );

      await PrevMatchHockey.create({
        EVENT_ID: eventId[i],
        MATCHES_HOME: JSON.stringify(data.DATA[0].GROUPS[0].ITEMS),
        MATCHES_AWAY: JSON.stringify(data.DATA[0].GROUPS[1].ITEMS),
      });
    }

    return res.send({ message: "Loaded" });
  } catch (err) {
    return res.status(400).send(err);
  }
};

exports.getStatsPrevMatchHockey = async (req, res) => {
  try {
    const prevMatches = await PrewMatchHockey.findAll();
    const parseDataHome = prevMatches.map((item) =>
      JSON.parse(item.MATCHES_HOME)
    );
    const matchHome = parseDataHome;
    const matchListHome = matchHome.flatMap((item) =>
      item
        .filter((item) => item.EVENT_NAME === "НХЛ" && item.STAGE != "AWARDED")
        .slice(0, 6)
    );
    const filterID = matchListHome.filter(
      (value, index, self) =>
        index ===
        self.findIndex(
          (t) => t.EVENT_ID === value.EVENT_ID && t.EVENT_ID === value.EVENT_ID
        )
    );

    for (let i = 0; i < filterID.length; i++) {
      const { data } = await axios.get(
        "https://flashlive-sports.p.rapidapi.com/v1/events/statistics",
        {
          params: { event_id: filterID[i].EVENT_ID, locale: "ru_RU" },
          headers: {
            "accept-encoding": "*",
            "X-RapidAPI-Key":
              "08e003e353msh5f64ec3ee6ecbeep151a3bjsn2b8d2f5d4103",
            "X-RapidAPI-Host": "flashlive-sports.p.rapidapi.com",
          },
        }
      );
      await StatsHomeHockey.create({
        EVENT_ID: filterID[i].EVENT_ID,
        STATS: JSON.stringify(data.DATA),
      });
    }

    return res.send({ message: "Loaded" });
  } catch (err) {
    return res.send(err)
  }
  return res.send(filterID);
};

exports.getStatsPrevMatchHockeyAway = async (req, res) => {
  const prevMatches = await PrevMatchHockey.findAll();
  const parseDataHome = prevMatches.map((item) =>
    JSON.parse(item.MATCHES_AWAY)
  );
  const matchHome = parseDataHome;
  const matchListHome = matchHome.flatMap((item) =>
    item
      .filter((item) => item.EVENT_NAME === "НХЛ" && item.STAGE != "AWARDED")
      .slice(0, 6)
  );
  const filterID = matchListHome.filter(
    (value, index, self) =>
      index ===
      self.findIndex(
        (t) => t.EVENT_ID === value.EVENT_ID && t.EVENT_ID === value.EVENT_ID
      )
  );

  for (let i = 0; i < filterID.length; i++) {
    const { data } = await axios.get(
      "https://flashlive-sports.p.rapidapi.com/v1/events/statistics",
      {
        params: { event_id: filterID[i].EVENT_ID, locale: "ru_RU" },
        headers: {
          "accept-encoding": "*",
          "X-RapidAPI-Key":
            "08e003e353msh5f64ec3ee6ecbeep151a3bjsn2b8d2f5d4103",
          "X-RapidAPI-Host": "flashlive-sports.p.rapidapi.com",
        },
      }
    );
    await StatsAwayHockey.create({
      EVENT_ID: filterID[i].EVENT_ID,
      STATS: JSON.stringify(data.DATA),
    });
  }

  return res.send({ message: "Loaded" });

  return res.send(filterID);
};

exports.getStatsPrevMatch = async (req, res) => {
  try {
    const prevMatches = await PrevMatches.findAll();
    const eventsId = prevMatches.map((item) => item.EVENT_ID);
    const leagName = await Leags.findAll({ attributes: ["LEAGUE_NAME"] });
    const leagFilter = leagName.map((item) => item.LEAGUE_NAME);
    const parseDataHome = prevMatches.map((item) =>
      JSON.parse(item.MATCHES_HOME)
    );
    const matchHome = parseDataHome;

    const matchListHome = matchHome.flatMap((item) =>
      item
        .filter(
          (item) =>
            leagFilter?.includes(item.EVENT_NAME) && item.STAGE != "AWARDED"
        )
        .slice(0, 6)
    );
    const filterID = matchListHome.filter(
      (value, index, self) =>
        index ===
        self.findIndex(
          (t) => t.EVENT_ID === value.EVENT_ID && t.EVENT_ID === value.EVENT_ID
        )
    );

    for (let i = 0; i < filterID.length; i++) {
      const { data } = await axios.get(
        "https://flashlive-sports.p.rapidapi.com/v1/events/statistics",
        {
          params: { event_id: filterID[i].EVENT_ID, locale: "ru_RU" },
          headers: {
            "accept-encoding": "*",
            "X-RapidAPI-Key":
              "08e003e353msh5f64ec3ee6ecbeep151a3bjsn2b8d2f5d4103",
            "X-RapidAPI-Host": "flashlive-sports.p.rapidapi.com",
          },
        }
      );
      await StatsHome.create({
        EVENT_ID: filterID[i].EVENT_ID,
        STATS: JSON.stringify(data.DATA),
      });
    }

    return res.send({ message: "Loaded" });
  } catch (err) {
    return res.send(err);
  }
};

exports.getStatsPrevMatchAway = async (req, res) => {
  try {
    const prevMatches = await PrevMatches.findAll();
    const eventsId = prevMatches.map((item) => item.EVENT_ID);
    const leagName = await Leags.findAll({ attributes: ["LEAGUE_NAME"] });
    const leagFilter = leagName.map((item) => item.LEAGUE_NAME);
    const parseData = prevMatches.map((item) => JSON.parse(item.MATCHES_AWAY));
    const match = parseData;

    const matchList = match.flatMap((item) =>
      item
        .filter(
          (item) =>
            leagFilter?.includes(item.EVENT_NAME) && item.STAGE != "AWARDED"
        )
        .slice(0, 6)
    );
    const filterID = matchList.filter(
      (value, index, self) =>
        index ===
        self.findIndex(
          (t) => t.EVENT_ID === value.EVENT_ID && t.EVENT_ID === value.EVENT_ID
        )
    );

    for (let i = 0; i < filterID.length; i++) {
      const { data } = await axios.get(
        "https://flashlive-sports.p.rapidapi.com/v1/events/statistics",
        {
          params: { event_id: filterID[i].EVENT_ID, locale: "ru_RU" },
          headers: {
            "accept-encoding": "*",
            "X-RapidAPI-Key":
              "08e003e353msh5f64ec3ee6ecbeep151a3bjsn2b8d2f5d4103",
            "X-RapidAPI-Host": "flashlive-sports.p.rapidapi.com",
          },
        }
      );
      await StatsAway.create({
        EVENT_ID: filterID[i].EVENT_ID,
        STATS: JSON.stringify(data.DATA),
      });
    }

    return res.send({ message: "Loaded" });
  } catch (err) {
    return res.send(err);
  }
};

exports.getPrevsMatch = async (req, res) => {
  try {
    const eventid = req.query.event_id;
    const leagList = await Leags.findAll();
    const LEAGUE_NAME = leagList.map((item) => item.LEAGUE_NAME);
    const prevMatch = await PrevMatches.findOne({
      where: { EVENT_ID: eventid },
    });
    if (!prevMatch) {
      const prevMatch = await PrewMatchHockey.findOne({
        where: { EVENT_ID: eventid },
      });
      const matchesHome = JSON.parse(prevMatch.MATCHES_HOME);
      const matchesAway = JSON.parse(prevMatch.MATCHES_AWAY);
      return res.send({
        matchHome: matchesHome.filter((item) =>
          LEAGUE_NAME.includes(item.EVENT_NAME)
        ),
        matchesAway: matchesAway.filter((item) =>
          LEAGUE_NAME.includes(item.EVENT_NAME)
        ),
      });
    }

    const matchesHome = JSON.parse(prevMatch.MATCHES_HOME);
    const matchesAway = JSON.parse(prevMatch.MATCHES_AWAY);
    return res.send({
      matchHome: matchesHome.filter((item) =>
        LEAGUE_NAME.includes(item.EVENT_NAME)
      ),
      matchesAway: matchesAway.filter((item) =>
        LEAGUE_NAME.includes(item.EVENT_NAME)
      ),
    });
  } catch (err) {
    console.log(err);
  }
};

exports.stats = async (req, res) => {
  try {
    const id = req.body.id;
    const stats = await StatsHome.findAll({ where: { EVENT_ID: id } });

    if (stats.length === 0) {
      const stats = await StatsHomeHockey.findAll({ where: { EVENT_ID: id } });
      return res.send(stats.map((item) => JSON.parse(item.STATS)));
    }

    return res.send(stats.map((item) => JSON.parse(item.STATS)));

    //OOAz88ZA
  } catch (err) {
    return res.send(err);
  }
};

exports.StatsAway = async (req, res) => {
  try {
    const id = req.body.id;
    const stats = await StatsAway.findAll({ where: { EVENT_ID: id } });
    if (stats.length === 0) {
      const stats = await StatsAwayHockey.findAll({ where: { EVENT_ID: id } });
      return res.send(stats.map((item) => JSON.parse(item.STATS)));
    }

    return res.send(stats.map((item) => JSON.parse(item.STATS)));

    //OOAz88ZA
  } catch (err) {
    return res.send(err);
  }
};
