import { database } from ".";
import express from "express";
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer } from "http";
import { get } from "https";
import { createXpBar } from "./d20/function";

const express_app = express();
const server = createServer(express_app);

const port = process.env.PORT || 8080;

express_app.use(cors());
express_app.use(bodyParser.urlencoded({
    extended: false
}));
express_app.use(bodyParser.json());

express_app.use('/static', express.static('./public'))

type User = {
    id: string;
    username: string;
    discriminator: number | string;
    public_flags: number;
    flags: number;
    banner: any;
    banner_color: string;
    accent_color: number;
    locale: string;
    mfa_enabled: boolean;
}

type getUserStuff = {
    statusCode: number | undefined;
    statusMessage: string | undefined;
    user: User;
}

function getUser(tokenType: string, accessToken: string): Promise<getUserStuff> {
    return new Promise((resolve, reject) => {
        get('https://discord.com/api/users/@me', {
            headers: {
                authorization: `${tokenType} ${accessToken}`,
            },
        }, (response) => {
            response.setEncoding('utf8');
            let rawData = '';
            response.on('data', (chunk) => {
                rawData += chunk;
            });
            response.on('end', () => {
                let user = JSON.parse(rawData);
                resolve({
                    user: user,
                    statusCode: response.statusCode,
                    statusMessage: response.statusMessage
                });
            });
        })
    })
}

express_app.get('/card/:tokentype/:token', async (req, res) => {
    let tokenType = req.params.tokentype;
    let accessToken = req.params.token;

    let { statusCode, user } = await getUser(tokenType, accessToken);
    database.child('card').child(user.id).once('value').then(card => res.send(card.val()));
})

express_app.post('/card/:tokentype/:token', async (req, res) => {
    let tokenType = req.params.tokentype;
    let accessToken = req.params.token;

    // console.log(req.body);

    let card = {
        type: req.body.type,
        color: req.body.color,
        color2: req.body.color2,
        title: req.body.title
    }

    let { statusCode, user } = await getUser(tokenType, accessToken);
    database.child('card').child(user.id).set(card).then(() => {
        res.send(card);
    });
})

express_app.get('/result', async (req, res) => {
    let type = req.query.type;
    let color = req.query.color;
    let color2 = req.query.color2;

    if (typeof type != 'string') type = 'normal';
    if (typeof color != 'string') color = '#FFFFFF';
    if (typeof color2 != 'string') color2 = '#000000';

    if (!color.startsWith('#')) color = '#' + color;
    if (!color2.startsWith('#')) color2 = '#' + color2;

    let canvas = await createXpBar(type, color, color2);
    res.send(canvas.toDataURL());;
})

express_app.get('/user/:tokentype/:token', async (req, res) => {
    let { user } = await getUser(req.params.tokentype, req.params.token);
    res.send(user);
});

server.listen(port);