import { randomUUID } from "crypto";
import { Game, Player, Question } from "../types";
import { MILLISECONDS_IN_SECOND } from "../utils/constants";

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
        this.questionStartTime = Math.floor(Date.now() / MILLISECONDS_IN_SECOND);
    }

    nextQuestion(): Question | undefined {
        this.currentQuestion++;

        if (this.currentQuestion >= this.questions.length) {
            this.status = 'finished';
            return;
        }

        this.questionStartTime = Math.floor(Date.now() / MILLISECONDS_IN_SECOND);
        return this.questions[this.currentQuestion];
    }

    isAllAnswered(): boolean {
        return !this.players.find(player => !player.hasAnswered);
    }

    setPlayerAnswer(playerId: string, answerId: number): void {
        if (!this.questionStartTime) {
            return;
        }

        const answerTime = Math.floor(Date.now() / MILLISECONDS_IN_SECOND) - this.questionStartTime;
        const player = this.getPlayer(playerId);

        if (!player) {
            return;
        }
        
        player.hasAnswered = true;
        player.answerTime = answerTime;
        player.answeredCorrectly = answerId === this.getCorrectAnswer();

        this.playerAnswers.set(playerId, { answerIndex: answerId, timestamp: answerTime })
    }

    emptyPlayerAnswer(player: Player) {
        player.hasAnswered = false;
        player.answeredCorrectly = false;
    }

    getPlayer(playerId: string): Player | undefined {
        const player = this.players.find(player => player.index === playerId);
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