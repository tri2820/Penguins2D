import Player from "../Player";
import { EndGameMessage, ActionMessage, GameInfoMessage, MapSize, NumPlayer, PlayerIndex, TimeLimit, Timestamp, UpdateMessage } from "../Defs";
import { Channel } from "../SimulatorScript/ServerConnectionSimulator";
import { Position,Score } from "../Defs";

export default class Server extends cc.Component {
    playerPrefab : cc.Prefab;

    channels : Channel[];

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
    readonly pickUpRadius = 100;

    init(){
        this.players = [];
        this.eggs = []
        this.timer = 0;
        this.channels = [];
        this.scores = [];
        this.gameRunning = false;
    }

    onLoad(){
        this.init()
        // TODO: wait ready
        cc.resources.load('Player', cc.Prefab, (e,prefab)=>{
            this.playerPrefab = prefab as cc.Prefab;
        })
    }

    // Race condition warning
    addConnection(conn : Channel){
        this.channels.push(conn);
        this.addPlayer();
        conn.actionCallback = this.makeActionCallback(this.channels.length-1).bind(this);
    }

    makeActionCallback(i : PlayerIndex){
        return (m: ActionMessage) => {
            this.onAction(i,m);
        }
    }

    onAction(i : PlayerIndex, m:ActionMessage){
        if (!this.gameRunning) return;
        this.players[i].getComponent(Player).inputState = m.inputState;
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

        this.channels.forEach((c, i) => {
            let m = new GameInfoMessage(i, this.numPlayer, this.timeLimit, this.mapSize);
            c.sendToClient(m);
        })

        this.sendUpdate();
    }

    sendUpdate(){
        this.populateEggs();
        let playerPositions = this.players.map((p) => p.getPosition());
        let m = new UpdateMessage(playerPositions, this.eggs, this.scores, this.timer);
        this.channels.forEach((c)=>{
            c.sendToClient(m);
        })
        this.nextUpdate = this.timer + (0.3 + Math.random()*0.2)
    }

    gameOver(){
        let m = new EndGameMessage(this.scores);
        this.channels.forEach(c => c.sendToClient(m))
        this.init();
    }

    update(dt){
        this.timer += dt;
        if (!this.gameRunning && this.players.length == this.numPlayer) this.gameStart();
        if (!this.gameRunning) return;
        if (this.timer > this.timeLimit) this.gameOver();
        if (this.timer > this.nextUpdate) this.sendUpdate();
        this.eggs = this.eggToScore();
        this.populateEggs();
    }

    eggToScore(){
        return this.eggs.filter((egg) => {
            let playerCollisions = this.players.map((player, i)=>{
                return egg.sub(player.getPosition()).mag() <= this.pickUpRadius;
            })
            let collided = playerCollisions.findIndex((collision)=>collision==true);
            if (collided>-1) this.scores[collided]++;
            return collided==-1
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