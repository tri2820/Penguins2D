import Player from "../Player";
import { Position } from "../Defs";
import Camera from "./Camera";
import { Score, EndGameMessage, GameInfoMessage, MapSize, NumPlayer, PlayerIndex, RequestJoinMessage, Timestamp, TimeLimit, UpdateMessage, ActionMessage } from "../Defs";
import ServerConnectionSimulator  from "../SimulatorScript/ServerConnectionSimulator";
import Channel from "../Channel";
import Egg from "../Egg";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Client extends cc.Component {
    // TODO: Hot loading
    @property(cc.Prefab)
    readonly eggPrefab = null;

    @property(cc.Prefab)
    readonly playerPrefab = null;

    // Efficiently spawn and despawn eggs
    eggPool : cc.NodePool;

    // UI elements
    progressBar : cc.ProgressBar;
    scoreText : cc.Label;
    
    // Game state
    numPlayer : NumPlayer
    timeLimit : TimeLimit;
    mapSize : MapSize;
    // Main player and remote players
    playerId : PlayerIndex;
    player : Player;
    players : cc.Node[];

    // Client logic state
    firstUpdate : boolean;
    lastUpdatePlayerPositions : Position[];
    lastUpdateEggPositions : Position[];
    lastUpdateScores : Score[];
    eggDespawners : CallableFunction[];
    timer : Timestamp;
    score : Score;
    // Channel to communicate with server
    channel : Channel;


    init() {
        // In production, change this to websocket object of type Channel
        this.addComponent(ServerConnectionSimulator);
        this.channel = this.getComponent(ServerConnectionSimulator);

        this.timer = 0;
        this.progressBar = this.getComponentInChildren(cc.Camera).getComponentInChildren(cc.ProgressBar);
        // TODO: may get the wrong label 
        // if score label is at lower position than timer label in scene
        this.scoreText = this.getComponentInChildren(cc.Camera).getComponentInChildren(cc.Label);
        this.eggPool = new cc.NodePool();
        this.players = []
        this.eggDespawners = []
        this.firstUpdate = true;
        this.lastUpdateEggPositions = [];
        this.lastUpdateScores = []; 
        this.score = 0;
    }


    start(){
        this.init();
        this.setupServerCallback();
        this.requestJoin();
    }


    requestJoin(){
        let m = new RequestJoinMessage();
        this.channel.sendToServer(m);
    }


    setupServerCallback(){
        // Channel object will call these callbacks on new message
        // TODO: use event system instead of explicit binding.
        this.channel.gameInfoCallback = this.gameInfoCallback.bind(this);
        this.channel.updateCallback = this.updateCallback.bind(this);
        this.channel.endGameCallback = this.endGameCallback.bind(this);        
    }


    gameInfoCallback(m : GameInfoMessage){
        this.playerId = m.playerIndex;
        this.numPlayer = m.numPlayer;
        this.timeLimit = m.timeLimit;
        this.mapSize = m.mapSize;

        this.prepareGame();
        this.setupMainPlayer();
    }
    

    prepareGame(){
        // Populate players
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

        // Camera follows main player
        this.getComponentInChildren(cc.Camera).getComponent(Camera).init(this.player);

        // Listen to input
        this.setInputControl();
    }


    updateCallback(m : UpdateMessage){
        // TODO: use timestamp for prediction and server reconcilation
        // For now, the game is deterministic enough to NOT sync the local main player with server
        let timestamp = m.timestamp;

        // Player logic
        // Save to this array for interpolation
        this.lastUpdatePlayerPositions = m.playerPositions;
        // On first update, sync players' position
        if (this.firstUpdate) {
            m.playerPositions.forEach((v,i) => this.players[i].setPosition(v))
        }

        // Egg logic
        // Destroy all eggs
        this.eggDespawners.forEach(despawner => despawner());
        this.eggDespawners = [];
        // Cold region, draw egg with state at time t-1 if it is far from the main player
        this.lastUpdateEggPositions.forEach(v => {
            if (v.sub(this.player.node.getPosition()).mag() < 200) return;
            let newEgg = this.spawnEgg();
            newEgg.setPosition(v);
        })
        // Hot region, draw egg with state at time t if it is near the main player
        this.lastUpdateEggPositions = m.eggPositions;
        this.lastUpdateEggPositions.forEach(v => {
            if (v.sub(this.player.node.getPosition()).mag() > 200) return;
            let newEgg = this.spawnEgg();
            newEgg.setPosition(v);
        })

        // Update score
        this.lastUpdateScores = m.scores;
        this.score = this.lastUpdateScores[this.playerId];
        this.scoreText.string = `${this.score}`;

        // No more is first update
        if (this.firstUpdate) this.firstUpdate = false;
    }


    endGameCallback(m : EndGameMessage){
        // Stop animation
        this.player.stopMove();
        
        // Show score
        let score = m.scores[this.playerId];
        let rank = this.lastUpdateScores.filter(s => s > score).length + 1
        this.scoreText.string = `Your score is ${score}\nRank ${rank}/${this.players.length}`
        this.scoreText.node.setPosition(0,200);

        // Stop updating players
        this.players.forEach(p => p.getComponent(Player).enabled = false);

        // Stop listening to input
        this.unsetInputControl();
    }    


    update(dt){
        this.timer += dt;
        this.progressBar.progress = this.timer/this.timeLimit;
        // If there is a begin and target state then start interpolating
        if (!this.firstUpdate && this.lastUpdatePlayerPositions) this.interpolate()
    }


    interpolate(){
        this.players.forEach((player,i)=>{
            // Don't interpolate the main player
            if (this.playerId == i) return;
            // Interpolate the remote players by controlling their input
            this.updateInputState(this.lastUpdatePlayerPositions[i], player);
        })
    }

    
    updateInputState(position, player : cc.Node){
        // Very expensive interpolating
        // TODO: directly animate, not going through inputState
        let p = player.getComponent(Player);

        // If reach near target position then stop moving (stop shaking!)
        if (Math.abs(position.x - player.getPosition().x) < 3) {
            p.onKeyUp({keyCode : cc.macro.KEY.left});
            p.onKeyUp({keyCode : cc.macro.KEY.right});
        } else {
            if (position.x > player.getPosition().x){
                p.onKeyDown({keyCode : cc.macro.KEY.right});
                p.onKeyUp({keyCode : cc.macro.KEY.left})
            } else if (position.x < player.getPosition().x) {
                p.onKeyDown({keyCode : cc.macro.KEY.left});
                p.onKeyUp({keyCode : cc.macro.KEY.right})
            } 
        }

        // If reach near target position then stop moving (stop shaking!)
        if (Math.abs(position.y - player.getPosition().y) < 3) {
            p.onKeyUp({keyCode : cc.macro.KEY.up});
            p.onKeyUp({keyCode : cc.macro.KEY.down});
        } else{
            if (position.y < player.getPosition().y){
                p.onKeyDown({keyCode : cc.macro.KEY.down});
                p.onKeyUp({keyCode : cc.macro.KEY.up});
            } else {
                p.onKeyUp({keyCode : cc.macro.KEY.down});
                p.onKeyDown({keyCode : cc.macro.KEY.up});
            }
        }
    }


    spawnEgg(){
        let newEgg = this.eggPool.size() > 0 ? this.eggPool.get() : cc.instantiate<cc.Node>(this.eggPrefab);
        this.node.addChild(newEgg);
        newEgg.getComponent(Egg).init(this);
        this.eggDespawners.push(() => this.despawnEgg(newEgg));
        return newEgg
    }

    despawnEgg(egg : cc.Node) {
        this.eggPool.put(egg);
    }

    
    // Listen/Unlisten to cocos input events
    setInputControl(){
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }
    unsetInputControl(){
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }


    // TODO: Decorator
    onKeyDown(event){
        this.player.onKeyDown(event);
        let m = new ActionMessage(this.player.inputState, this.timer);
        this.channel.sendToServer(m);
    }
    onKeyUp(event){
        this.player.onKeyUp(event);
        let m = new ActionMessage(this.player.inputState, this.timer);
        this.channel.sendToServer(m);
    }
}
