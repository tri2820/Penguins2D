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
export type TotalTime = number;
export type NumPlayer = number;
export type PlayerIndex = number;
export type MapSize = cc.Vec2;
export type Score = number;

export type RequestJoinMessage = void;
export type GameInfoMessage = [PlayerIndex, NumPlayer, TotalTime, MapSize];
export type UpdateMessage = [Position[], Position[], Score[], Timestamp];
export type ActionMessage = [InputState, Timestamp];
export type EndGameMessage = Score[];

export type GenericMessage = RequestJoinMessage | GameInfoMessage | UpdateMessage | ActionMessage | EndGameMessage

