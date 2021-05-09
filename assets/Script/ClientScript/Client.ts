import Player from "../Player";
import Egg from "../Egg";
import Camera from "./Camera";
import { Score, EndGameMessage, GameInfoMessage, MapSize, NumPlayer, PlayerIndex, RequestJoinMessage, Timestamp, TimeLimit, UpdateMessage } from "../Defs";
import { ServerConnection, ServerConnectionSimulator } from "../SimulatorScript/ServerConnectionSimulator";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Client extends cc.Component {
    @property(cc.Prefab)
    readonly eggPrefab = null;

    @property(cc.Prefab)
    readonly playerPrefab = null;

    connection : ServerConnection;

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

    init() {
        // Change this in production
        this.addComponent(ServerConnectionSimulator);
        this.connection = this.getComponent(ServerConnectionSimulator);

        this.timer = 0;
        this.progressBar = this.getComponentInChildren(cc.Camera).getComponentInChildren(cc.ProgressBar);
        this.eggPool = new cc.NodePool();
        this.players = []
    }

    start(){
        this.init();
        this.setupServerCallback();
        this.requestJoin();
    }

    setupServerCallback(){
        // TODO: use event system instead of explicit binding.
        this.connection.gameInfoCallback = this.doGameInfo.bind(this);
        this.connection.updateCallback = this.doUpdate.bind(this);
        this.connection.endGameCallback = this.doEndgame.bind(this);        
    }

    doGameInfo(m : GameInfoMessage){
        this.playerId = m.playerIndex;
        this.numPlayer = m.numPlayer;
        this.timeLimit = m.timeLimit;
        this.mapSize = m.mapSize;

        this.prepareGame();
        this.setupMainPlayer();
    }

    doUpdate(m : UpdateMessage){
        let playerPositions = m.playerPositions;
        let eggPositions = m.eggPositions;
        let scores = m.scores;
        let timestamp = m.timestamp;

        this.players.forEach((r,i) => r.setPosition(playerPositions[i]));
        eggPositions.forEach(v => {
            let newEgg = this.spawnEgg();
            newEgg.setPosition(v);
        })
        this.scores = scores;

        // Interpolation
    }

    doEndgame(m : EndGameMessage){
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
    }

    spawnEgg(){
        let newEgg = this.eggPool.size() > 0 ? this.eggPool.get() : cc.instantiate<cc.Node>(this.eggPrefab);
        this.node.addChild(newEgg);
        newEgg.getComponent(Egg).init(this);
        return newEgg
    }

    despawnEgg(egg : cc.Node){
        this.eggPool.put(egg);
    }

    // Player control is here
    // because we need Player prefab functionally pure
    setInputControl(){
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.player.onKeyDown, this.player);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.player.onKeyUp, this.player);
    }

    unsetInputControl(){
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.player.onKeyDown, this.player);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.player.onKeyUp, this.player);
    }


    // Prediction and sendAction
    onKeyboardDown(){

    }

    onKeyboardUp(){
        
    }
}
