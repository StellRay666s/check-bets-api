const { sequelize, Sequelize } = require(".");

module.exports = (sequelize, Sequelize) => {
    const statsHomeHockey = sequelize.define("StatsHomeHockey", {
        EVENT_ID: { type: Sequelize.STRING, },
        STATS: { type: Sequelize.JSON },

    });

    return statsHomeHockey;
};
