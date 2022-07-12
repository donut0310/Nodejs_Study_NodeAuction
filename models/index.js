// Package Modules
import Sequelize from "sequelize";

// Custom Modules
import { User } from "./user.js";
import { Good } from "./good.js";
import { Auction } from "./auction.js";
import Config from "../config/config.js";

const env = process.env.NODE_ENV || "development";
const config = Config[env];

export const db = {};
export const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

db.sequelize = sequelize;
db.User = User;
db.Good = Good;
db.Auction = Auction;

User.init(sequelize);
Good.init(sequelize);
Auction.init(sequelize);

User.associate(db);
Good.associate(db);
Auction.associate(db);

export default db;
