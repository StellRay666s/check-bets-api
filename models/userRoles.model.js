const { sequelize, Sequelize } = require(".");

module.exports = (sequelize, Sequelize) => {
  const UserRoles = sequelize.define("UserRoles", {});
  return UserRoles;
};
