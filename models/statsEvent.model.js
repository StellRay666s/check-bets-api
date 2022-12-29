const { sequelize, Sequelize } = require(".");

module.exports = (sequelize, Sequelize) => {
    const stats = sequelize.define("Stats", {
        EVENT_ID: { type: Sequelize.STRING },



    });

    return stats;
};
