module.exports = {
    HOST: "123.456.789.0",
    USER: "dbUser",
    PASSWORD: "dbPassword",
    DB: "DbName",
    dialect: "mysql",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
};
