module.exports = (sequelize, Sequelize) => {
    return sequelize.define("Smscode", {
        code: {type: Sequelize.STRING},
    });
};
