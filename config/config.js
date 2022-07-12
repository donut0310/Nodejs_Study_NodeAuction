import dotenv from "dotenv";
dotenv.config();
const env = process.env;

export default {
  development: {
    username: env.DB_USERNAME,
    password: env.SEQUELIZE_PASSWORD,
    database: env.DB_NAME,
    host: env.DB_HOST,
    dialect: "mysql",
    operatorAliases: false,
  },
  test: {
    username: "root",
    password: null,
    database: "database_test",
    host: "127.0.0.1",
    dialect: "mysql",
  },
  production: {
    username: "root",
    password: null,
    database: "database_production",
    host: "127.0.0.1",
    dialect: "mysql",
  },
};
