import { WebSocketServer } from 'ws';
import { WSMessage } from './types';
import { registerPlayer } from './Commands/player';
import { getCreateGameAnswer, getGame, getJoinGameAnswers, getUpdatePlayersAnswer } from './Commands/gameManagement';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// WebSocket server
const wss = new WebSocketServer({ port: PORT });

wss.on('connection', socket => {
    console.log(`New client connected. Total clients: ${wss.clients.size}`);
    socket.on('message', (message: string) => {
        const messageParsed = JSON.parse(message);
        let answer: WSMessage;

        //TODO: разделить вызовы в контроллер или вроде того
        switch(messageParsed.type) {
            case 'reg':
                answer = registerPlayer(messageParsed.data, socket);
                socket.send(JSON.stringify(answer));
                break;
            case 'create_game':
                answer = getCreateGameAnswer(messageParsed.data, socket);
                socket.send(JSON.stringify(answer));
                break;
            case 'join_game':
                const answers: WSMessage[] = getJoinGameAnswers(messageParsed.data, socket);
                answer = answers[0];
                socket.send(JSON.stringify(answer));

                const game = getGame(messageParsed.data);
                game.players.forEach(player => {
                    player.ws.send(JSON.stringify(answers[1]));
                    player.ws.send(JSON.stringify(getUpdatePlayersAnswer(game.players)));
                })
                break;
        }
    })
})