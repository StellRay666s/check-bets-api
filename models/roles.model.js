const { sequelize, Sequelize } = require(".");

module.exports = (sequelize, Sequelize) => {
  const Roles = sequelize.define("Roles", {
    name: { type: Sequelize.STRING },
  });

  return Roles;
};
