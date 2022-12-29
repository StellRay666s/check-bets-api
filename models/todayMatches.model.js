const { sequelize, Sequelize } = require(".");

module.exports = (sequelize, Sequelize) => {
  const todayMatcheyFootball = sequelize.define("TodayMatchesFootbal", {
    NAME: { type: Sequelize.STRING },
    TOURNAMENT_TEMPLATE_ID: { type: Sequelize.STRING },
    COUNTRY_NAME: { type: Sequelize.STRING },
    TOURNAMENT_ID: { type: Sequelize.STRING },
    TEMPLATE_ID: { type: Sequelize.STRING },
    TOURNAMENT_IMAGE: { type: Sequelize.STRING },
    EVENTS: { type: Sequelize.JSON },
  });

  return todayMatcheyFootball;
};
