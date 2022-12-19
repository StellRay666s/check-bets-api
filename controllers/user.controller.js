const db = require("../models");
const Users = db.Users;
const Roles = db.Roles;
const UserRoles = db.UserRoles;
const Tariffs = db.Tariffs;
const userTariffs = db.userTariffs;
const Smscode = db.Smscode;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { main, smsCodeSend } = require("../utils/mailer");
const { mainChancgePassword } = require("../utils/mailChangePassword");
const crypto = require("crypto");
const axios = require("axios");
const { sequelize } = require("../models");
const { where } = require("sequelize");
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
    await main(email, tokenEmail);
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const user = await Users.create({
      email: email,
      password: passwordHash,
      hash: tokenEmail,
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
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    return res.status(400).send({
      message: "Поля не должны быть пустыми",
    });
  }

  const checkUser = await Users.findOne({ where: { email: email }, raw: true });

  if (!checkUser) {
    return res.status(400).send({ message: "Пользователя не существует" });
  }

  if (!checkUser.verifiedEmail) {
    return res.status(400).send({
      message:
        "Для авторизации необходимо подтвердить адресс электронной почты",
    });
  }

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
};

exports.getUsers = async (req, res) => {
  const token = req.headers.authorization.replace("Bearer", "").trimStart();
  if (!token) {
    return res.status(401).send({ message: "Неавторизован" });
  }
  const user = jwt.decode(token, "secret");
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
    { attributes: ["id", "name", "lastname", "phone", "email", "tariffs"] },
    { where: { id: id } }
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
  } catch (err) {}
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
    return res.json({ message: "Ошибка при добавлении тарифа" });
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
  } catch (err) {}
};

exports.changeProfilDAta = async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).send({ message: "Неавторизован" });
    }
    const replaceToken = token.replace("Bearer", "").trimStart();

    const user = jwt.decode(replaceToken, "secret");
    console.log(user);

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
        raw: true,
      });

      const tariffs = await userTariffs.findOne({
        where: { UserId: decoded.id },
      });

      return res.send({
        user: {
          name: user.name,
          lastname: user.lastname,
          email: user.email,
          phone: user.phone,
          tariffs: tariffs.TariffId,
        },
      });
    }
  } catch (err) {
    res.json({ message: err });
  }
};

exports.getMatch = async (req, res) => {
  axios
    .get(
      "https://flashlive-sports.p.rapidapi.com/v1/events/list",

      {
        params: {
          locale: "ru_RU",
          sport_id: "1",
          indent_days: "-7",
          timezone: "-4",
        },
        headers: {
          "X-RapidAPI-Key":
            "08e003e353msh5f64ec3ee6ecbeep151a3bjsn2b8d2f5d4103",
          "X-RapidAPI-Host": "flashlive-sports.p.rapidapi.com",
        },
      }
    )
    .then((res) => {
      console.log(res);
    });
};

exports.buyTariffs = async (req, res) => {
  const token = req.headers.authorization;
  const decode = jwt.decode(token.replace("Bearer", "").trimStart());
  if (!token) {
    return res.send({ message: "Неавторизован" });
  }
  const tariffs = await Tariffs.findOne({
    where: { name: req.body.tariffs },
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
