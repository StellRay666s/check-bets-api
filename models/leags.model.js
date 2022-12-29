const { sequelize, Sequelize } = require(".");

module.exports = (sequelize, Sequelize) => {
    const Leags = sequelize.define("Leags", {
        LEAGUE_NAME: { type: Sequelize.STRING },
        COUNTRY_NAME: { type: Sequelize.STRING },
        COUNTRY_ID: { type: Sequelize.INTEGER },
        ACTUAL_TOURNAMENT_SEASON_ID: { type: Sequelize.STRING },
        TEMPLATE_ID: { type: Sequelize.STRING },

    });





    return Leags;
};
