import Player from "./Player";

export type Direction = 'up' | 'down' | 'left' | 'right';
export type InputState = Map<Direction,boolean>;
export type Position = cc.Vec2;

export class Defs {
    static keyCodeToDirection = new Map<any,Direction>([
        [cc.macro.KEY.left,'left'],
        [cc.macro.KEY.right,'right'],
        [cc.macro.KEY.down,'down'],
        [cc.macro.KEY.up,'up']
    ])

    static directionToAnimation = new Map<Direction,string>([
        ['up','3run'],
        ['down','1run'],
        ['left','2run'],
        ['right','2run']
    ])

    static directionToIdleAnimation = new Map<Direction,string>([
        ['up','3idle'],
        ['down','1idle'],
        ['left','2idle'],
        ['right','2idle']
    ])

    static unitDisplacement = new Map([
        ['up', cc.v2(0,1)],
        ['down', cc.v2(0,-1)],
        ['left', cc.v2(-1,0)],
        ['right', cc.v2(1,0)],
    ])

    // TODO: Better cloning method
    static getNewInputState() : InputState{
        return new Map<Direction,boolean>([
            ['up',false],
            ['down',false],
            ['left',false],
            ['right',false],
        ])
    } 
}

export type Timestamp = number;
export type TimeLimit = number;
export type NumPlayer = number;
export type PlayerIndex = number;
export type MapSize = cc.Vec2;
export type Score = number;

export class RequestJoinMessage {};

export class GameInfoMessage {
    constructor(playerIndex, numPlayer, timeLimit, mapSize){
        this.playerIndex = playerIndex;
        this.numPlayer = numPlayer;
        this.timeLimit = timeLimit;
        this.mapSize = mapSize;
    }
    playerIndex: PlayerIndex;
    numPlayer: NumPlayer;
    timeLimit: TimeLimit; 
    mapSize: MapSize
};

export class UpdateMessage {
    constructor(playerPositions, eggPositions, scores, timestamp){
        this.playerPositions = playerPositions;
        this.eggPositions = eggPositions;
        this.scores = scores;
        this.timestamp = timestamp;    
    }
    playerPositions : Position[];
    eggPositions : Position[];
    scores : Score[];
    timestamp: Timestamp
}

export class ActionMessage {
    constructor(inputState, timestamp){
        this.inputState = inputState;
        this.timestamp = timestamp;
    }
    inputState : InputState;
    timestamp : Timestamp  
} 

export class EndGameMessage {
    constructor(scores){
        this.scores = scores;
    }
    scores : Score[]
} 

export type GenericMessage = RequestJoinMessage | GameInfoMessage | UpdateMessage | ActionMessage | EndGameMessage
export type clientToServerMessage = RequestJoinMessage | ActionMessage
export type serverToClientMessage = GameInfoMessage | UpdateMessage | EndGameMessage