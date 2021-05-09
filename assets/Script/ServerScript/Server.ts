import Player from "../Player";
import Egg from "../Egg";
import { GameInfoMessage, MapSize, NumPlayer, TimeLimit, Timestamp, UpdateMessage } from "../Defs";
import { ServerConnection, ServerConnectionSimulator } from "../SimulatorScript/ServerConnectionSimulator";
import { Position,Score } from "../Defs";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Server extends cc.Component {
    playerPrefab : cc.Prefab;

    connections : ServerConnection[];

    players : cc.Node[];
    scores : Score[];
    timer : Timestamp;
    gameRunning: boolean;
    eggs : Position[];
    nextUpdate : Timestamp;

    readonly numPlayer : NumPlayer = 3;
    readonly timeLimit : TimeLimit = 10;
    readonly mapSize : MapSize = cc.v2(960,640);
    readonly numEgg = 5;
    readonly pickUpRadius = 20;

    onLoad(){
        this.players = [];
        this.eggs = []
        this.timer = 0;
        this.connections = [];
        this.scores = [];

        // TODO: wait ready
        cc.resources.load('Player', cc.Prefab, (e,prefab)=>{
            this.playerPrefab = prefab as cc.Prefab;
        })
    }

    addConnection(conn : ServerConnection){
        console.log('Add connection');
        this.connections.push(conn);
        this.addPlayer();
    }

    addPlayer(){
        let newPlayer = cc.instantiate(this.playerPrefab);
        this.node.addChild(newPlayer);
        this.players.push(newPlayer);
        this.scores.push(0);
    }

    gameStart(){
        this.gameRunning = true;
        this.players.forEach(p => {
            p.setPosition(this.randomPosition());
        });

        this.connections.forEach((c, i) => {
            let m = new GameInfoMessage(i, this.numPlayer, this.timeLimit, this.mapSize);
            c.send(m, "serverToClient");
        })

        this.sendUpdate();
    }

    sendUpdate(){
        this.populateEggs();
        let playerPositions = this.players.map((p) => p.getPosition());
        let m = new UpdateMessage(playerPositions, this.eggs, this.scores, this.timer);
        this.connections.forEach((c)=>{
            c.send(m, "serverToClient");
        })
        this.nextUpdate = this.timer + (0.3 + Math.random()*0.2)
    }

    update(dt){
        this.timer += dt;
        if (this.timer > this.nextUpdate) this.sendUpdate();

        if (!this.gameRunning && this.players.length == this.numPlayer) this.gameStart();

        if (!this.gameRunning) return;
        this.eggs = this.surviviedEggs();
        this.populateEggs();
    }

    surviviedEggs(){
        return this.eggs.filter((egg) => {
            return this.players.map((player)=>{
                return egg.sub(player.getPosition()).mag() <= this.pickUpRadius;
            }).every(collided => !collided)
        })
    }

    populateEggs(){
        let n = this.eggs.length;
        for(let i=n; i<this.numEgg; i++){
            let newEgg = this.spawnEgg();
            this.eggs.push(newEgg);
        }
    }

    spawnEgg(){
        return this.randomPosition()
    }

    randomPosition(){
        let localPosition = cc.v2(Math.random(),Math.random()).scale(this.mapSize);
        let globalPosition = localPosition.add(this.mapSize.div(2).neg());
        return globalPosition
    }
}