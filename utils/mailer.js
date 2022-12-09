const nodemailer = require("nodemailer");

async function main(email, hash) {
  let transporter = nodemailer.createTransport({
    host: "smtp.yandex.ru",
    port: 465,
    secure: true,

    auth: {
      user: "amazaryan2018",
      pass: "yywlbdtfqgreqpyj",
    },
  });

  transporter.sendMail(
    {
      from: "<amazaryan2018@yandex.ru>",
      to: email,
      subject: "Подтверждение почты",
      text: "",
      html: `Для подтверждения перейдите по <a href=http://localhost:8000/emailVerify?hash=${hash}>ссылке</a>`,
    },
    (err, info) => {
      console.log(err);
    }
  );
}

module.exports = { main };
//yywlbdtfqgreqpyj
