const { sequelize, Sequelize } = require(".");

module.exports = (sequelize, Sequelize) => {
  const Tariffs = sequelize.define("Tariffs", {
    name: { type: Sequelize.STRING },
    price: { type: Sequelize.INTEGER },
  });

  return Tariffs;
};
