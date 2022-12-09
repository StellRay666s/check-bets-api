const dbConfig = require("../config/db.config");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig.db, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.host,
  dialect: dbConfig.dialect,
  operatorAliases: false,
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Users = require("./users.model.js")(sequelize, Sequelize);
db.News = require("./news.model.js")(sequelize, Sequelize);
db.Roles = require("./roles.model.js")(sequelize, Sequelize);
db.UserRoles = require("./userRoles.model.js")(sequelize, Sequelize);

db.Users.belongsToMany(db.Roles, { through: db.UserRoles });
db.Roles.belongsToMany(db.Users, { through: db.UserRoles });

module.exports = db;