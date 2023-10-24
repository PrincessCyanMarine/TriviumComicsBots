module.exports = {
    apps: [
        {
            name: "bots",
            script: "dist/index.js",
            watch: true,
            ignore_watch: ["node_modules"],
        },
    ],
};
