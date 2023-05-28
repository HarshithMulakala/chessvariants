//HTML elements
let clientId = null;
let gameId = null;
let playerColor = null;

const urlParams = new URLSearchParams(window.location.search);
const gameIdParam = urlParams.get("gameId");

let ws = new WebSocket("ws://localhost:9090")
const btnCreate = document.getElementById("btnCreate");
const btnJoin = document.getElementById("btnJoin");
const txtGameId = document.getElementById("txtGameId");
const divPlayers = document.getElementById("divPlayers");
const divBoard = document.getElementById("divBoard");


//wiring events
btnJoin.addEventListener("click", e => {

    if (txtGameId.value === "")
        return;

    gameId = txtGameId.value;


    const payLoad = {
        "method": "join",
        "clientId": clientId,
        "gameId": gameId
    }

    ws.send(JSON.stringify(payLoad));

})

btnCreate.addEventListener("click", e => {

    const payLoad = {
        "method": "create",
        "clientId": clientId
    }

    ws.send(JSON.stringify(payLoad));

})

ws.onmessage = message => {
    //message.data
    const response = JSON.parse(message.data);
    //connect
    if (response.method === "connect") {
        clientId = response.clientId;
        console.log("Client id Set successfully " + clientId)

        if (gameIdParam !== null) {
            txtGameId.value = gameIdParam;
            btnJoin.click();
        }

    }

    //create
    if (response.method === "create") {
        gameId = response.game.id;
        txtGameId.value = gameId;
        btnJoin.click();
        console.log("game successfully created with id " + response.game.id + " with " + response.game.balls + " balls")
    }


    //update
    if (response.method === "update") {
        //{1: "red", 1}
        if (!response.game.state) return;
        for (const b of Object.keys(response.game.state)) {
            const ballObject = document.getElementById("ball" + b);
            ballObject.style.backgroundColor = response.game.state[b];
        }

    }

    //join
    if (response.method === "join") {
        const game = response.game;

        while (divPlayers.firstChild)
            divPlayers.removeChild(divPlayers.firstChild)

        game.clients.forEach(c => {

            const d = document.createElement("div");
            d.style.width = "200px";
            d.style.background = c.color
            d.textContent = c.clientId;
            divPlayers.appendChild(d);

            if (c.clientId === clientId) playerColor = c.color;
        })


        while (divBoard.firstChild != null)
            divBoard.removeChild(divBoard.firstChild)

        // var countNum = 1;
        // for (var i = 0; i < 8; i++) {
        //     for (var j = 0; j < 8; j++) {
        //         var chessSquare = document.createElement('div');
        //         chessSquare.className = 'chess-square';
        //         chessSquare.id = "ball" + (countNum);
        //         chessSquare.tag = countNum;
        //         chessSquare.textContent = countNum;
        //         if ((i + j) % 2 == 0) {
        //             chessSquare.style.backgroundColor = 'blue';
        //         }
        //         else {
        //             chessSquare.style.backgroundColor = 'red';
        //         }
        //         chessSquare.addEventListener("click", e => {
        //             chessSquare.style.background = playerColor;
        //             console.log(chessSquare.tag);
        //             const payLoad = {
        //                 "method": "play",
        //                 "clientId": clientId,
        //                 "gameId": gameId,
        //                 "ballId": chessSquare.tag,
        //                 "color": playerColor
        //             }
        //             ws.send(JSON.stringify(payLoad))
        //         })
        //         divBoard.appendChild(chessSquare);
        //         countNum++;
        //     }
        // }

        for (let i = 0; i < game.balls; i++) {

            const b = document.createElement("button");
            b.id = "ball" + (i + 1);
            b.tag = i + 1
            b.textContent = i + 1
            b.style.width = "150px"
            b.style.height = "150px"
            b.addEventListener("click", e => {
                b.style.background = playerColor
                const payLoad = {
                    "method": "play",
                    "clientId": clientId,
                    "gameId": gameId,
                    "ballId": b.tag,
                    "color": playerColor
                }
                ws.send(JSON.stringify(payLoad))
            })
            divBoard.appendChild(b);
        }

    }
}