import { randomUUID } from "crypto";
import { Game, Player, Question } from "../types";


export class QuestionGame implements Game {
    id: string;
    code: string;
    hostId: string
    questions: Question[];
    players: Player[];
    currentQuestion: number;
    status: "waiting" | "in_progress" | "finished";
    questionStartTime?: number | undefined;
    questionTimer?: NodeJS.Timeout | undefined;
    playerAnswers: Map<string, { answerIndex: number; timestamp: number; }>;

    constructor (questions: Question[], hostId: string) {
        this.id = randomUUID();
        this.code = this.#generateCode();
        this.hostId = hostId;
        this.questions = questions;
        this.players = [];
        this.currentQuestion = 0;
        this.status = 'waiting';
        this.playerAnswers = new Map();
    }

    start() {
        this.status = 'in_progress';
        this.questionStartTime = new Date().getUTCSeconds();
    }

    nextQuestion(): Question | undefined {
        this.currentQuestion++;

        if (this.currentQuestion >= this.questions.length) {
            this.status = 'finished';
            return;
        }

        return this.questions[this.currentQuestion];
    }

    isAllAnswered(): boolean {
        return !this.players.find(player => !player.hasAnswered);
    }

    setPlayerAnswer(playerId: string, answerId: number) {
        if (!this.questionStartTime) {
            return;
        }

        const answerTime = new Date().getUTCSeconds() - this.questionStartTime;
        const player = this.getPlayer(playerId);
        
        player.hasAnswered = true;
        player.answerTime = answerTime;
        player.answeredCorrectly = answerId === this.getCorrectAnswer();
        console.log(`correct answer is ${this.getCorrectAnswer()} and user answer is ${answerId}`);
        console.log(`is player answered: ${player.hasAnswered} and is correct ${player.answeredCorrectly} and answertime is ${player.answerTime}`);

        this.playerAnswers.set(playerId, { answerIndex: answerId, timestamp: answerTime })
    }

    getPlayer(playerId: string): Player {
        const player = this.players.find(player => player.index === playerId);

        if (!player) {
            throw ('Player is not found');
        }

        return player
    }

    getCorrectAnswer() {
        return this.questions[this.currentQuestion].correctIndex;
    }

    #generateCode(): string {
        return Array.apply(0, Array(6)).map(function() {
            return (function(charset){
                return charset.charAt(Math.floor(Math.random() * charset.length))
            }('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'));
        }).join('')
    }
}