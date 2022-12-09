const { sequelize, Sequelize } = require(".");

module.exports = (sequelize, Sequelize) => {
  const userTariffs = sequelize.define("userTariffs", {});
  return userTariffs;
};
