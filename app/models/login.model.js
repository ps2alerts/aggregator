module.exports = (sequelize, Sequelize) => {
    const Login = sequelize.define("Login", {
      character_id: {
        type: Sequelize.STRING
      },
      event_name: {
        type: Sequelize.STRING
      },
      timestamp: {
        type: Sequelize.STRING
      }
    });
  
    return Login;
  };