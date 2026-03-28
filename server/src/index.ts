import { WebSocketServer } from 'ws';
import { Game, WSMessage } from './types';
import { registerPlayer } from './Commands/player';
import { getCreateGameAnswer, getJoinGameAnswers, getUpdatePlayersAnswer} from './Commands/gameManagement';
import { getStartGameAnswer } from './Commands/gamePlay';
import { getGameByCode, getGameById, getUserById, leaveGame } from './utils/utils'

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// WebSocket server
const wss = new WebSocketServer({ port: PORT });

wss.on('connection', socket => {
    console.log(`New client connected. Total clients: ${wss.clients.size}`);
    socket.on('message', (message: string) => {
        const messageParsed = JSON.parse(message);
        let answer: WSMessage;
        let game: Game;

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

                game = getGameByCode(messageParsed.data);
                // это бы сократить
                const host = getUserById(game.hostId);
                host?.ws.send(JSON.stringify(answers[1]));
                host?.ws.send(JSON.stringify(getUpdatePlayersAnswer(game.players)));

                game.players.forEach(player => {
                    player.ws.send(JSON.stringify(answers[1]));
                    player.ws.send(JSON.stringify(getUpdatePlayersAnswer(game.players)));
                })
                break;
            case 'start_game':
                game = getGameById(messageParsed.data);
                answer = getStartGameAnswer(game);

                socket.send(JSON.stringify(answer));

                game.players.forEach(player => {
                    player.ws.send(JSON.stringify(answer));
                })

        }
    })

    socket.on('close', () => {
        console.log(`Client DISCONNECTED. Total clients: ${wss.clients.size}`);
        const runningGame: Game | undefined = leaveGame(socket);

        if (runningGame) {
            const host = getUserById(runningGame.hostId);
            host?.ws.send(JSON.stringify(getUpdatePlayersAnswer(runningGame.players)));
            
            runningGame.players.forEach(player => {
                player.ws.send(JSON.stringify(getUpdatePlayersAnswer(runningGame.players)));
            });
        }
    })
})