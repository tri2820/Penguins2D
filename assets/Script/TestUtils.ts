import { GameInfoMessage, NumPlayer, UpdateMessage, Position, Score, Timestamp } from "./Defs";

export class TestUtils {
    static generateGameInfoMessage() : GameInfoMessage{
        return [2,5,20,cc.v2(960,640)]
    }
    static generateUpdateMessage(n: NumPlayer, mapsize) : UpdateMessage {
        let playerPositions : Position[] = [];
        let eggPositions : Position[] = [];
        let scores : Score[] = [];
        let timestamp : Timestamp = 0;

        for(let i=0; i<n; i++) playerPositions.push(this.randomPosition(mapsize));
        for(let i=0; i<5; i++) eggPositions.push(this.randomPosition(mapsize));
        for(let i=0; i<5; i++) scores.push(0);

        return [playerPositions, eggPositions, scores, timestamp];
    }   

    static randomPosition(mapSize) : Position {
        let localPosition = cc.v2(Math.random(),Math.random()).scale(mapSize);
        let globalPosition = localPosition.add(mapSize.div(2).neg());
        return globalPosition
    }

}

