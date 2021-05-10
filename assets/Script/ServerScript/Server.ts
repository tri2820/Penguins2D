import Player from "../Player";
import { EndGameMessage, ActionMessage, GameInfoMessage, MapSize, NumPlayer, PlayerIndex, TimeLimit, Timestamp, UpdateMessage } from "../Defs";
import Channel from "../Channel";
import { Position,Score } from "../Defs";

export default class Server extends cc.Component {
    // A channel for each client
    channels : Channel[];
    // Timestamp of the next update
    nextUpdate : Timestamp;

    // Game configurations
    readonly numPlayer : NumPlayer = 3;
    readonly timeLimit : TimeLimit = 10;
    readonly mapSize : MapSize = cc.v2(960,640);
    readonly numEgg = 5;
    readonly pickUpRadius = 100;

    // Game state
    players : cc.Node[];
    scores : Score[];
    timer : Timestamp;
    gameRunning: boolean;
    // Lightweight eggs' state, just record the positions
    eggs : Position[];

    // To simulate the players
    playerPrefab : cc.Prefab;

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
        // TODO: wait till ready
        cc.resources.load('Player', cc.Prefab, (e,prefab)=>{
            this.playerPrefab = prefab as cc.Prefab;
        })
    }

    // TODO: Fix Race condition
    addConnection(conn : Channel){
        this.channels.push(conn);
        this.addPlayer();
        conn.actionCallback = this.makeActionCallback(this.channels.length-1).bind(this);
    }

    addPlayer(){
        let newPlayer = cc.instantiate(this.playerPrefab);
        this.node.addChild(newPlayer);
        this.players.push(newPlayer);
        // Default score is 0
        this.scores.push(0);
    }

    // Create a callback for each client
    makeActionCallback(i : PlayerIndex){
        return (m: ActionMessage) => {
            this.onAction(i,m);
        }
    }

    // Receive a client's action
    onAction(i : PlayerIndex, m:ActionMessage){
        if (!this.gameRunning) return;
        this.players[i].getComponent(Player).inputState = m.inputState;
    }

    update(dt){
        this.timer += dt;
        // Start game if it has not started and we have enough player 
        if (!this.gameRunning && this.players.length == this.numPlayer) this.gameStart();
        if (!this.gameRunning) return;
        if (this.timer > this.timeLimit) this.gameOver();
        if (this.timer > this.nextUpdate) this.sendUpdate();
        // TODO: Separate into 2 methods
        // Remove collided eggs, and increase the score of players who ate them
        this.eggs = this.eggToScore();
        this.populateEggs();
    }

    gameStart(){
        this.gameRunning = true;
        this.players.forEach(p => {p.setPosition(this.randomPosition());});
        // Send game start message to each client
        this.channels.forEach((c, i) => {
            let m = new GameInfoMessage(i, this.numPlayer, this.timeLimit, this.mapSize);
            c.sendToClient(m);
        })
        // Important first update
        this.sendUpdate();
    }

    gameOver(){
        let m = new EndGameMessage(this.scores);
        this.channels.forEach(c => c.sendToClient(m));
        // Reset game state
        this.init();
    }

    sendUpdate(){
        this.populateEggs();
        let playerPositions = this.players.map(p => p.getPosition());
        let m = new UpdateMessage(playerPositions, this.eggs, this.scores, this.timer);
        this.channels.forEach(c=>{c.sendToClient(m);})
        // Server sends update with random interval
        this.nextUpdate = this.timer + (0.3 + Math.random()*0.2)
    }

    eggToScore(){
        // TODO: Stop this abomination
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