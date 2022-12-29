const { sequelize, Sequelize } = require(".");
const { DataTypes } = require("sequelize");
module.exports = (sequelize, Sequelize) => {
    const PrevMatches = sequelize.define("PrevMatches", {
        EVENT_ID: { type: Sequelize.STRING, primaryKey: true },
        MATCHES_HOME: { type: Sequelize.JSON },
        MATCHES_AWAY: { type: Sequelize.JSON },
    },);

    return PrevMatches;

}



