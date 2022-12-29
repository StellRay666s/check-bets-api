const { sequelize, Sequelize } = require(".");

module.exports = (sequelize, Sequelize) => {
  const stats = sequelize.define("Stats", {
    EVENT_ID: { type: Sequelize.STRING },
    STATS: { type: Sequelize.STRING(999999) },

  });

  return stats;
};
