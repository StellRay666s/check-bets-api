const { sequelize, Sequelize } = require(".");
const { DataTypes } = require("sequelize");
module.exports = (sequelize, Sequelize) => {
    const PrevMatchesHockey = sequelize.define("PrevMatchesHocke", {
        EVENT_ID: { type: Sequelize.STRING, primaryKey: true },
        MATCHES_HOME: { type: Sequelize.JSON },
        MATCHES_AWAY: { type: Sequelize.JSON },
    },);

    return PrevMatchesHockey;

}



