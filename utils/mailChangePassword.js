const nodemailer = require("nodemailer");

async function mainChancgePassword(email, hash) {
  let transporter = nodemailer.createTransport({
    host: "smtp.yandex.ru",
    port: 465,
    secure: true,

    auth: {
      user: "amazaryan2018",
      pass: "yywlbdtfqgreqpyj",
    },
  });

  await transporter.sendMail({
    from: "<amazaryan2018@yandex.ru>",
    to: email,
    subject: "Смена пароля",
    text: "Здравствуйте, для смена пароля перейдите по ссылке",
    html: `<a href=http://localhost:8000/changePassword?{hash}}>Нажмите сюда</a>`,
  });
}

module.exports = { mainChancgePassword };
//yywlbdtfqgreqpyj
