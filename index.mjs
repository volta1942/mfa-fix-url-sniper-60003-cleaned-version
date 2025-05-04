  //----------------------------------------------------//
 //----------------Cleaned By Volta1942----------------//
//----------------------------------------------------//

import tls from 'tls';
import http from 'http';
import WebSocket from 'ws';
import extractJsonFromString from 'extract-json-from-string';
import axios from 'axios';
import https from 'https';

const token = ''; 
const password = ''; 
const serverId = ''; 
const gatewayURL = 'wss://gateway-us-east1-b.discord.gg';
const webhookURL = ''; 

let vanity;
let mfaToken = '';
const sessionCache = new Map();

const guilds = {};

async function connectTLS() {
    const tlsSocket = tls.connect({
        host: 'canary.discord.com',
        port: 8443,
        minVersion: 'TLSv1.2',
        maxVersion: 'TLSv1.2',
        handshakeTimeout: 0,
        rejectUnauthorized: false,
        zeroRtt: true,
        servername: 'canary.discord.com',
        keepAlive: true,
        session: sessionCache.get('canary.discord.com'),
    });

    tlsSocket.on('data', handleData);
    tlsSocket.on('end', reconnect);
    tlsSocket.on('secureConnect', () => (connectWebSocket(), tlsSocket.setNoDelay(true)));
    tlsSocket.on('session', (session) => sessionCache.set('canary.discord.com', session));
    tlsSocket.on('error', reconnect);

    function handleData(data) {
        const ext = extractJsonFromString(data.toString());
        const find = ext.find((e) => e.code || e.message);
        if (find) {
            notifyWebhook(find);
        }
    }

    async function notifyWebhook(find) {
        const requestBody = {
            content: `@everyone`,
            embeds: [
                {
                    description: `\`\`\`${JSON.stringify(find)}\`\`\``,
                    color: 0x00ff00,
                    image: {
                        url: 'https://tenor.com/view/no1-can-bozok-karanl%C4%B1k-oyuncu-gif-20436907',
                    },
                    fields: [
                        { name: 'Vanity', value: `\`${vanity}\``, inline: true },
                        { name: 'Guild', value: `\`${serverId}\``, inline: true },
                        { name: 'Gateway', value: `\`${gatewayURL}\``, inline: true },
                    ],
                    footer: {
                        text: `<: | ${new Date().toLocaleString('tr-TR', { hour12: false })}`,
                        icon_url: 'https://tenor.com/view/no1-can-bozok-karanl%C4%B1k-oyuncu-gif-20436907',
                    },
                    timestamp: new Date().toISOString(),
                },
            ],
        };
        try {
            await axios.post(webhookURL, requestBody);
        } catch (error) {
            console.error('N0TF94E30R9R:', error);
        }
    }

    const agent = new https.Agent({
        keepAlive: true,
        secureProtocol: 'TLSv1_2_method',
        rejectUnauthorized: false,
        secureContext: tls.createSecureContext({
            secureProtocol: 'TLSv1_2_method',
        }),
        session: sessionCache.get('canary.discord.com'),
    });

    async function performPatchRequest(vanityCode) {
        const requestBody = { code: vanityCode };
        const headers = {
            Authorization: token,
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 ...',
            'X-Super-Properties': '...',
            'X-Discord-MFA-Authorization': mfaToken,
        };
        const config = {
            headers,
            httpsAgent: agent,
        };
        try {
            await Promise.all([
                tlsRequest(requestBody),
                axios.patch(`https://canary.discord.com/api/v7/guilds/${serverId}/vanity-url`, requestBody, config)
            ]);
        } catch (error) {
            console.error('P4TCH43RR30R:', error);
        }
        vanity = vanityCode;
    }

    function tlsRequest(requestBody) {
        tlsSocket.write(
            `PATCH /api/v9/guilds/${serverId}/vanity-url HTTP/1.1\r\n` +
            `Host: canary.discord.com\r\n` +
            `Authorization: ${token}\r\n` +
            `Content-Type: application/json\r\n` +
            `Content-Length: ${JSON.stringify(requestBody).length}\r\n` +
            `User-Agent: Mozilla/5.0\r\n` +
            `X-Super-Properties: eyJvcyI6IkFuZHJvaWQiLCJicm93c2VyIjoiQW5kcm9pZCBDaHJvbWUiLCJkZXZpY2UiOiJBbmRyb2lkIiwic3lzdGVtX2xvY2FsZSI6InRyLVRSIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKExpbnV4OyBBbmRyb2lkIDYuMDsgTmV4dXMgNSBCdWlsZC9NUkE1OE4pIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMzEuMC4wLjAgTW9iaWxlIFNhZmFyaS81MzcuMzYiLCJicm93c2VyX3ZlcnNpb24iOiIxMzEuMC4wLjAiLCJvc192ZXJzaW9uIjoiNi4wIiwicmVmZXJyZXIiOiJodHRwczovL2Rpc2NvcmQuY29tL2NoYW5uZWxzL0BtZS8xMzAzMDQ1MDIyNjQzNTIzNjU1IiwicmVmZXJyaW5nX2RvbWFpbiI6ImRpc2NvcmQuY29tIiwicmVmZXJyZXJfY3VycmVudCI6IiIsInJlZmVycmluZ19kb21haW5fY3VycmVudCI6IiIsInJlbGVhc2VfY2hhbm5lbCI6InN0YWJsZSIsImNsaWVudF9idWlsZF9udW1iZXIiOjM1NTYyNCwiY2xpZW50X2V2ZW50X3NvdXJjZSI6bnVsbCwiaGFzX2NsaWVudF9tb2RzIjpmYWxzZX0=\r\n` +
            `X-Discord-MFA-Authorization: ${mfaToken}\r\n` +
            `\r\n` +
            JSON.stringify(requestBody),
            'utf-8',
        );
    }

    function connectWebSocket() {
        const websocket = new WebSocket(gatewayURL);
        websocket.onclose = reconnect;
        websocket.onmessage = handleWebSocketMessage;
        websocket.onopen = () => {
            websocket.send(JSON.stringify({
                op: 2,
                d: {
                    token: token,
                    intents: 1,
                    properties: {
                        os: 'windows',
                        browser: 'chrome',
                        device: 'vxltacan',
                    },
                },
            }));
            setInterval(() => websocket.send(JSON.stringify({ op: 1, d: {} })), 41250);
        };
    }

    function handleWebSocketMessage(message) {
        const { d, op, t } = JSON.parse(message.data);
        switch (t) {
            case 'GUILD_UPDATE': {
                const find = guilds[d.guild_id];
                if (find && find !== d.vanity_url_code) {
                    performPatchRequest(find);
                }
                break;
            }
            case 'READY': {
                d.guilds.forEach((guild) => {
                    if (guild.vanity_url_code) {
                        guilds[guild.id] = guild.vanity_url_code;
                        console.log(`GUILD => ${guild.id} || VANITY => ${guild.vanity_url_code}`);
                    }
                });
                break;
            }
            default: {
                if (op === 7) {
                    reconnect();
                }
                break;
            }
        }
    }

    function reconnect() {
        setTimeout(connectTLS, 1000);
    }

    setInterval(() => {
        tlsSocket.write('HEAD / HTTP/1.1\r\nHost: canary.discord.com\r\n\r\n');
    }, 7500);
}

connectTLS();

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/devcoder') {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk;
        });
        req.on('end', () => {
            try {
                const { mfaToken: receivedToken } = JSON.parse(body);
                if (receivedToken) {
                    mfaToken = receivedToken;
                    console.log(`[${new Date().toLocaleTimeString()}] > MFA TAKED: ${receivedToken}`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'MFA token taked and seted.' }));
                } else {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    res.end('bad request.');
                }
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Invalid JSON format.');
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(8080, () => {
    console.log("SNIPER IS READY.");
});
