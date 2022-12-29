const { sequelize, Sequelize } = require(".");

module.exports = (sequelize, Sequelize) => {
  const stats = sequelize.define("StatsHome", {
    EVENT_ID: { type: Sequelize.STRING, },
    STATS: { type: Sequelize.JSON },

  });

  return stats;
};
