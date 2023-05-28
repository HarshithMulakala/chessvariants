const http = require("http");
const path = require('path');
const express = require("express");
const app = require("express")();
let port = process.env.PORT || 9090;
let initial_path = path.join(__dirname, 'public');
app.use(express.static(initial_path));
app.get("/home", (req, res) => res.sendFile(__dirname + "/public/index.html"))
app.listen(9091, () => console.log("Listening on http port 9091"))
const websocketServer = require("websocket").server
const httpServer = http.createServer();
httpServer.listen(port, () => console.log("Listening.. on 9090"))
//hashmap clients
const clients = {};
const games = {};

updateGameState();

const wsServer = new websocketServer({
    "httpServer": httpServer
})
wsServer.on("request", request => {
    //connect
    const connection = request.accept(null, request.origin);
    connection.on("open", () => console.log("opened!"))
    connection.on("close", () => console.log("closed!"))
    connection.on("message", message => {
        const result = JSON.parse(message.utf8Data)
        //I have received a message from the client
        //a user want to create a new game
        if (result.method === "create") {
            const clientId = result.clientId;
            const gameId = guid();
            games[gameId] = {
                "id": gameId,
                "balls": 64,
                "clients": []
            }

            const payLoad = {
                "method": "create",
                "game": games[gameId]
            }

            const con = clients[clientId].connection;
            con.send(JSON.stringify(payLoad));
            app.get("/" + gameId, (req, res) => res.redirect(__dirname + "/public/index.html?gameid=" + gameId))
        }

        //a client want to join
        if (result.method === "join") {
            const gameId = result.gameId;
            const game = games[gameId];
            const clientId = result.clientId;
            let clientState = false;
            if (clients[clientId].gameId !== -1 && clients[clientId].gameId !== gameId) {
                games[clients[clientId].gameId].clients = games[clients[clientId].gameId].clients.filter(c => c.clientId !== clientId);
            }
            game.clients.forEach(c => {
                if (c.clientId === clientId)
                    clientState = true;
            })


            if (!clientState) {
                clients[clientId].gameId = gameId;
                if (game.clients.length >= 2) {
                    //sorry max players reach
                    return;
                }
                const color = { "0": "White", "1": "Black" }[game.clients.length]
                game.clients.push({
                    "clientId": clientId,
                    "color": color
                })

                const payLoad = {
                    "method": "join",
                    "game": game
                }
                //loop through all clients and tell them that people has joined
                game.clients.forEach(c => {
                    clients[c.clientId].connection.send(JSON.stringify(payLoad))
                })
            }


        }
        //a user plays
        if (result.method === "play") {
            const gameId = result.gameId;
            const ballId = result.ballId;
            const color = result.color;
            let state = games[gameId].state;
            if (!state)
                state = {}

            state[ballId] = color;
            games[gameId].state = state;

        }

    })

    //generate a new clientId
    const clientId = guid();
    clients[clientId] = {
        "connection": connection,
        "gameId": -1
    }

    const payLoad = {
        "method": "connect",
        "clientId": clientId
    }
    //send back the client connect
    connection.send(JSON.stringify(payLoad))

})


function updateGameState() {

    //{"gameid", fasdfsf}
    for (const g of Object.keys(games)) {
        const game = games[g]
        const payLoad = {
            "method": "update",
            "game": game
        }

        game.clients.forEach(c => {
            clients[c.clientId].connection.send(JSON.stringify(payLoad))
        })
    }

    setTimeout(updateGameState, 500);
}



function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

// then to call it, plus stitch in '4' in the third group
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0, 3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();