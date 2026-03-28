import { WebSocketServer, WebSocket } from 'ws';
import { Game, Player, WSMessage } from './types';
import { UserStorage } from './database/UserStorage';
import { GameStorage } from './database/GameStorage';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// WebSocket server
const wss = new WebSocketServer({ port: PORT });

const userStorage = new UserStorage();
const gameStorage = new GameStorage();

wss.on('connection', socket => {
    console.log(`New client connected. Total clients: ${wss.clients.size}`);
    socket.on('message', (message: string) => {
        const messageParsed = JSON.parse(message);
        let answer: WSMessage;

        //TODO: разделить вызовы в контроллер или вроде того
        switch(messageParsed.type) {
            case 'reg':
                const existingUser = userStorage.getUserByData(messageParsed.data);
                const user = existingUser ? existingUser: userStorage.addUser(messageParsed.data, socket);
                user.ws = socket;

                answer = {
                    type: 'reg',
                    data: {
                        name: user.name,
                        index: user.index,
                        error: false,
                        errorText: ''
                    },
                    id: 0
                }


                socket.send(JSON.stringify(answer));
                break;
            case 'create_game':
                const currentUser = userStorage.getUserBySocket(socket);

                if (!currentUser) {
                    // вернуть ошибку
                    break;
                }

                let game = gameStorage.addGame(messageParsed.data, currentUser.index);
                answer = {
                    type: 'game_created',
                    data: {
                        gameId: game.id,
                        code: game.code,
                    },
                    id: 0
                }

                socket.send(JSON.stringify(answer));
                break;
            case 'join_game':
                const currentJoinedUser = userStorage.getUserBySocket(socket);

                if (!currentJoinedUser) {
                    // вернуть ошибку
                    break;
                }

                const player: Player = {
                    name: currentJoinedUser.name,
                    index: currentJoinedUser.index,
                    score: 0,
                    ws: currentJoinedUser.ws
                }

                const joinedGame = gameStorage.joinGame(messageParsed.data.code, player);

                if (typeof joinedGame === 'string') {
                    //тут должна быть ошибка
                    break;
                }

                answer = {
                    type: 'game_joined',
                    data: {
                        gameId: joinedGame.id
                    },
                    id: 0
                }

                const playerJoinedAnswer = {
                    type: 'player_joined',
                    data: {
                        playerName: player.name,
                        playerCount: joinedGame.players.length,
                    },
                    id: 0
                }

                socket.send(JSON.stringify(answer));

                joinedGame.players.forEach(client => {
                    client.ws.send(JSON.stringify(playerJoinedAnswer))
                    updatePlayers(client.ws, joinedGame.players);
                })
        }
    })
})


//запускать когда игрок присоединяется и уходит
function updatePlayers(socket: WebSocket, players: Player[]) {
    const playersToSend = players.map(player => {
        return {name: player.name, index: player.index, score: player.score};
    });

    const answer: WSMessage = {
        type: 'update_players',
        data: playersToSend,
        id: 0
    }

    socket.send(JSON.stringify(answer));
}