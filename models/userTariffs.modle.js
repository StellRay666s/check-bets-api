const { sequelize, Sequelize } = require(".");

module.exports = (sequelize, Sequelize) => {
  const userTariffs = sequelize.define("userTariffs", {
    tariffsFinish: {
      type: Sequelize.DATE
    }

  });
  return userTariffs;
};
