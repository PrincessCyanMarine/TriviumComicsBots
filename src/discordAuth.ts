
import { get } from "https";

export type User = {
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
    avatar: string;
};

export type getUserStuff = {
    statusCode: number | undefined;
    statusMessage: string | undefined;
    user: User;
};

export function getGuilds(tokenType: string, accessToken: string): Promise<{ id: string }[]> {
    return new Promise((resolve, reject) => {
        get(
            "https://discord.com/api/users/@me/guilds",
            {
                headers: {
                    authorization: `${tokenType} ${accessToken}`,
                },
            },
            (response) => {
                response.setEncoding("utf8");
                let rawData = "";
                response.on("data", (chunk) => {
                    rawData += chunk;
                });
                response.on("end", () => {
                    let guilds: { id: string }[] = JSON.parse(rawData);
                    resolve(guilds);
                });
            }
        );
    });
}

export function getUser(tokenType: string, accessToken: string): Promise<getUserStuff> {
    return new Promise(async (resolve, reject) => {
        // let guilds: { id: string }[] = await getGuilds(tokenType, accessToken);
        get(
            "https://discord.com/api/users/@me",
            {
                headers: {
                    authorization: `${tokenType} ${accessToken}`,
                },
            },
            (response) => {
                response.setEncoding("utf8");
                let rawData = "";
                response.on("data", (chunk) => {
                    rawData += chunk;
                });
                response.on("end", () => {
                    let user = JSON.parse(rawData);
                    // user["guilds"] = guilds;
                    resolve({
                        user: user,
                        statusCode: response.statusCode,
                        statusMessage: response.statusMessage,
                    });
                });
            }
        );
    });
}
