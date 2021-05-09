import Player from "../Player";
import { Position } from "../Defs";
import Camera from "./Camera";
import { Score, EndGameMessage, GameInfoMessage, MapSize, NumPlayer, PlayerIndex, RequestJoinMessage, Timestamp, TimeLimit, UpdateMessage, ActionMessage } from "../Defs";
import { Channel, ServerConnectionSimulator } from "../SimulatorScript/ServerConnectionSimulator";
import Egg from "../Egg";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Client extends cc.Component {
    @property(cc.Prefab)
    readonly eggPrefab = null;

    @property(cc.Prefab)
    readonly playerPrefab = null;

    connection : Channel;

    eggPool : cc.NodePool;
    timer : Timestamp;
    progressBar : cc.ProgressBar;
    
    playerId : PlayerIndex;
    numPlayer : NumPlayer
    timeLimit : TimeLimit;
    mapSize : MapSize;
    players : cc.Node[];

    player : Player;
    scores : Score[];
    eggDespawners : CallableFunction[];
    firstUpdate : boolean;
    lastUpdatePlayerPositions : Position[];
    lastUpdateEggPositions : Position[];


    init() {
        // Change this in production
        this.addComponent(ServerConnectionSimulator);
        this.connection = this.getComponent(ServerConnectionSimulator);

        this.timer = 0;
        this.progressBar = this.getComponentInChildren(cc.Camera).getComponentInChildren(cc.ProgressBar);
        this.eggPool = new cc.NodePool();
        this.players = []
        this.eggDespawners = []
        this.firstUpdate = true;
        this.lastUpdateEggPositions = [];
    }

    start(){
        this.init();
        this.setupServerCallback();
        this.requestJoin();
    }

    setupServerCallback(){
        // TODO: use event system instead of explicit binding.
        this.connection.gameInfoCallback = this.gameInfoCallback.bind(this);
        this.connection.updateCallback = this.updateCallback.bind(this);
        this.connection.endGameCallback = this.endGameCallback.bind(this);        
    }

    gameInfoCallback(m : GameInfoMessage){
        this.playerId = m.playerIndex;
        this.numPlayer = m.numPlayer;
        this.timeLimit = m.timeLimit;
        this.mapSize = m.mapSize;

        this.prepareGame();
        this.setupMainPlayer();
    }

    updateCallback(m : UpdateMessage){
        let playerPositions = m.playerPositions;
        let eggPositions = m.eggPositions;
        let scores = m.scores;
        let timestamp = m.timestamp;

        this.lastUpdatePlayerPositions = playerPositions;
        if (this.firstUpdate) {
            playerPositions.forEach((v,i) => this.players[i].setPosition(v))
        }

        this.eggDespawners.forEach(despawner => despawner());
        this.eggDespawners = [];
        
        this.lastUpdateEggPositions.forEach(v => {
            if (v.sub(this.player.node.getPosition()).mag() < 100) return;
            let newEgg = this.spawnEgg();
            newEgg.setPosition(v);
        })

        this.lastUpdateEggPositions = eggPositions;
        eggPositions.forEach(v => {
            if (v.sub(this.player.node.getPosition()).mag() > 200) return;
            let newEgg = this.spawnEgg();
            newEgg.setPosition(v);
        })
        
        this.scores = scores;
        if (this.firstUpdate) this.firstUpdate = false;
    }

    endGameCallback(m : EndGameMessage){
        this.player.enabled = false;
        this.player.stopMove();
        this.unsetInputControl(); 
    }

    prepareGame(){
        for (let i=0; i<this.numPlayer; i++) {
            let player = cc.instantiate<cc.Node>(this.playerPrefab);
            this.players.push(player);
            this.node.addChild(player);
            player.opacity = 120;
        }
    }

    setupMainPlayer(){
        this.player = this.players[this.playerId].getComponent(Player);
        this.player.node.zIndex = 999;
        this.player.node.opacity = 255;

        this.getComponentInChildren(cc.Camera).getComponent(Camera).init(this.player);
        this.setInputControl();
    }

    requestJoin(){
        let m = new RequestJoinMessage();
        this.connection.send(m, "clientToServer");
    }

    update(dt){
        this.timer += dt;
        this.progressBar.progress = this.timer/this.timeLimit;
        if (!this.firstUpdate && this.lastUpdatePlayerPositions) this.interpolate()
    }

    interpolate(){
        this.players.forEach((player,i)=>{
            if (this.playerId == i) return;
            this.updateInputState(this.lastUpdatePlayerPositions[i], player);
        })
    }

    updateInputState(position, player : cc.Node){
        let p = player.getComponent(Player);
        if (Math.abs(position.x - player.getPosition().x) < 3) {
            p.onKeyUp({keyCode : cc.macro.KEY.left});
            p.onKeyUp({keyCode : cc.macro.KEY.right});
            return;
        };

        if (position.x > player.getPosition().x){
            p.onKeyDown({keyCode : cc.macro.KEY.right});
            p.onKeyUp({keyCode : cc.macro.KEY.left})
        } else if (position.x < player.getPosition().x) {
            p.onKeyDown({keyCode : cc.macro.KEY.left});
            p.onKeyUp({keyCode : cc.macro.KEY.right})
        } 

        if (Math.abs(position.y - player.getPosition().y) < 3) {
            p.onKeyUp({keyCode : cc.macro.KEY.up});
            p.onKeyUp({keyCode : cc.macro.KEY.down});
            return;
        };

        if (position.y < player.getPosition().y){
            p.onKeyDown({keyCode : cc.macro.KEY.down});
            p.onKeyUp({keyCode : cc.macro.KEY.up});
        } else {
            p.onKeyUp({keyCode : cc.macro.KEY.down});
            p.onKeyDown({keyCode : cc.macro.KEY.up});
        }
    }

    spawnEgg(){
        let newEgg = this.eggPool.size() > 0 ? this.eggPool.get() : cc.instantiate<cc.Node>(this.eggPrefab);
        this.node.addChild(newEgg);
        newEgg.getComponent(Egg).init(this);
        this.eggDespawners.push(() => this.despawnEgg(newEgg));
        return newEgg
    }

    despawnEgg(egg : cc.Node){
        this.eggPool.put(egg);
    }

    // Player control is here
    // because we need Player prefab functionally pure
    setInputControl(){
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    unsetInputControl(){
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }


    // TODO: Make decorator
    onKeyDown(event){
        this.player.onKeyDown(event);
        let m = new ActionMessage(this.player.inputState, this.timer);
        this.connection.send(m, "clientToServer");
    }

    onKeyUp(){
        this.player.onKeyUp(event);
        let m = new ActionMessage(this.player.inputState, this.timer);
        this.connection.send(m, "clientToServer");
    }
}
