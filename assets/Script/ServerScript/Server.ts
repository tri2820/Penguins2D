import Player from "../Player";
import Egg from "../Egg";
import { GameInfoMessage, MapSize, NumPlayer, TimeLimit, Timestamp } from "../Defs";
import { ServerConnectionSimulator } from "../SimulatorScript/ServerConnectionSimulator";
import { Game } from "../Defs";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Server extends cc.Component implements Game {
    eggPrefab : cc.Prefab;
    playerPrefab : cc.Prefab;

    connection : ServerConnectionSimulator;
//     @property(cc.Vec2)
//     readonly mapSize = cc.v2(960,640);

//     @property
//     readonly timeLimit = 10;
//     timer = 0;
//     player : Player;
//     progressBar : cc.ProgressBar;

    players : cc.Node[];
    eggPool : cc.NodePool;
    timer : Timestamp;
    gameRunning: boolean;

    readonly numPlayer : NumPlayer = 1;
    readonly timeLimit : TimeLimit = 10;
    readonly mapSize : MapSize = cc.v2(960,640);
    readonly numEgg = 5;

    onLoad(){
        this.players = [];
        this.eggPool = new cc.NodePool();
        this.timer = 0;

        // TODO: await ready
        cc.resources.load('Player', cc.Prefab, (e,prefab)=>{
            this.playerPrefab = prefab as cc.Prefab;
        })

        // TODO: await ready
        cc.resources.load('Egg', cc.Prefab, (e,prefab)=>{
            this.eggPrefab = prefab as cc.Prefab;
        })
    }

    addPlayer(){
        let newPlayer = cc.instantiate(this.playerPrefab);
        newPlayer.setPosition(this.randomPosition());
        this.node.addChild(newPlayer);
        this.players.push(newPlayer);
    }

    gameStart(){
        this.gameRunning = true;

        for(let i=0; i<this.numEgg; i++){
            let newEgg = this.spawnEgg();
            newEgg.setPosition(this.randomPosition());
        }

        this.players.forEach((_, i) => {
            let m = new GameInfoMessage(i, this.numPlayer, this.timeLimit, this.mapSize);
            this.connection.send(m, "serverToClient");
        })
    }

    update(dt){
        if (!this.gameRunning && this.players.length == this.numPlayer) this.gameStart();
        this.timer += dt;
    }

    spawnEgg(){
        let newEgg = this.eggPool.size() > 0 ? this.eggPool.get() : cc.instantiate(this.eggPrefab);
        this.node.addChild(newEgg);
        newEgg.getComponent(Egg).init(this);
        return newEgg
    }

    despawnEgg(egg : cc.Node){
        this.eggPool.put(egg);
    }

    randomPosition(){
        let localPosition = cc.v2(Math.random(),Math.random()).scale(this.mapSize);
        let globalPosition = localPosition.add(this.mapSize.div(2).neg());
        return globalPosition
    }
}