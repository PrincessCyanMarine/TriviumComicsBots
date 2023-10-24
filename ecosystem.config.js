module.exports = {
    apps: [
        {
            name: "bots",
            script: "dist/index.js",
            watch: ["dist/**"],
            // ignore_watch: ["node_modules"],
        },
    ],
};
