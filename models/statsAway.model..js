const { sequelize, Sequelize } = require(".");

module.exports = (sequelize, Sequelize) => {
  const statsAway = sequelize.define("StatsAway", {
    EVENT_ID: { type: Sequelize.STRING, },
    STATS: { type: Sequelize.JSON },

  });

  return statsAway;
};
