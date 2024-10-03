const express = require("express");
const socket = require("socket.io");
const http = require("http");
const {Chess} = require("chess.js");
const path = require("path");

const app = express();
//express ke server ko http ke server se link kiya , aur http ka server socket me pass keya
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();           //this extract the rules of chess from chess.js
let players = {};
let currentPlayer = "w" ;       //w -> white

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public"))) ;

app.get("/", (req,res) => {
    res.render("index.ejs", { title: "Chess Game"});
});
 
io.on("connection", function (uniquesocket) {
    console.log("connection");

    if(!players.white) {
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole", "w");
    }
    else if(!players.black){
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole", "b");
    }
    else{
        uniquesocket.emit("spectatorRole");
    }

    uniquesocket.on("disconnect", function(){
        if(uniquesocket.id === players.white){
            delete players.white;
        }
        else if(uniquesocket.id === players.black){
            delete players.black;
        }
    });

    uniquesocket.on("move",(move) => {
        try{
            if (chess.turn() === "w" && uniquesocket.id !== players.white) return;
            if (chess.turn() === "b" && uniquesocket.id !== players.black)  return;

            const result = chess.move(move);
            if(result){
                currentPlayer = chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen());       //chess.fen() gives the current state of the board. ex: place of king etc  
            }
            else{
                console.log("invalid move :", move);
                uniquesocket.emit("invalidMove", move);
            }
        }catch(err){
            console.log(err);
            uniquesocket.emit("invalid move :", move);
        }
    });

    
});

server.listen(3000, function() {
    console.log("listening on port : 3000");
});