const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
  const Users = sequelize.define("Users", {
    name: {
      type: Sequelize.STRING,
    },
    lastname: {
      type: Sequelize.STRING,
    },
    phone: {
      type: Sequelize.STRING,
    },
    email: {
      type: Sequelize.STRING,
      // Мы заходим через телефон нам тут нужен null
      // allowNull: false,
    },
    password: {
      type: Sequelize.STRING,
      // allowNull: false,
    },
    verifiedEmail: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    tariffs: {
      type: Sequelize.ARRAY(DataTypes.INTEGER),
    },
    hash: {
      type: Sequelize.STRING,
    },
  });

  return Users;
};
