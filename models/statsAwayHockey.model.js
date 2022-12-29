const { sequelize, Sequelize } = require(".");

module.exports = (sequelize, Sequelize) => {
    const statsAwayHockey = sequelize.define("StatsAwayHockey", {
        EVENT_ID: { type: Sequelize.STRING, },
        STATS: { type: Sequelize.JSON },

    });

    return statsAwayHockey;
};
