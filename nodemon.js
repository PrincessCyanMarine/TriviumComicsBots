const nodemon = require("nodemon");

nodemon({
    exec: "pm2 start ecosystem.config.js --only bots",
});
