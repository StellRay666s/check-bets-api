const { sequelize, Sequelize } = require(".");

module.exports = (sequelize, Sequelize) => {
  const News = sequelize.define("News", {
    title: { type: Sequelize.STRING },
    description: { type: Sequelize.STRING },
    image: { type: Sequelize.STRING },
    views: { type: Sequelize.INTEGER, defaultValue: 0 },
  });

  return News;
};
