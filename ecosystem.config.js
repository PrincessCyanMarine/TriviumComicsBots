module.exports = {
    apps: [
        {
            name: "bots",
            script: "dist/index.js",
        },
        {
            name: "nodemon",
            script: "./nodemon.js",
        },
        {
            name: "tsc",
            script: "./tsc_watch.js",
        },
    ],
};
