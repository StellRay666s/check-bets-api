const db = require("../models");
const Users = db.Users;
const News = db.News;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Op = db.Sequelize.Op;
const crypto = require("crypto");
const saltRounds = 12;

exports.createNews = async (req, res) => {
  try {
    const image = req.body.image;
    const title = req.body.title;
    const description = req.body.description;
    if (title === "" || description === "") {
      return res.status(400).send({ message: "Поля не должны быть пустыми" });
    }
    await News.create({ title: title, image: image, description: description });
    return res.json({ message: "Данные успешно сохранены" });
  } catch (err) {
    res.send(err);
  }
};

exports.getNews = async (req, res) => {
  try {
    const news = await News.findAll();

    if (!news) {
      return res.status(400).json({ message: "Новостей не найдено" });
    }
    return res.json(news);
  } catch (err) {
    return res.json({ message: "Ошибка при получении новостей!" });
  }
};

exports.getOne = async (req, res) => {
  try {
    const newsId = req.params.id;
    const findNews = await News.findByPk(newsId);
    if (!findNews) {
      return res.status(400).json({ message: "Такой статьи не найдено" });
    }
    const countViews = findNews.views;
    await News.update({ views: countViews + 1 }, { where: { id: newsId } });
    res.json(findNews);
  } catch (err) {
    return res.json(err);
  }
};

exports.updateNews = async (req, res) => {
  try {
    const newsId = req.params.id;
    const news = News.findByPk(newsId);
    if (!news) {
      return res.json("Новость не найдена");
    }
    await News.update(
      {
        title: req.body.title,
        description: req.body.description,
        image: req.body.image,
      },
      { where: { id: newsId } }
    );
    return res.status(200).json({ message: "Данные успешно сохранены!" });
  } catch (err) {
    console.log(err);
  }
};

exports.deleteNews = async (req, res) => {
  try {
    const newsId = req.params.id;
    const findNews = await News.findByPk(newsId);
    if (findNews) {
      await News.destroy({
        where: {
          id: newsId,
        },
      });
      return res.json({ message: "Новость успешно удалена!" });
    }
  } catch (err) {
    return res.json({ message: "Ошибка при удалении!" });
  }
};
