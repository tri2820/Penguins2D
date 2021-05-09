// import Player from "../Player";
// import Egg from "../Egg";
// import Camera from "./Camera";

// const {ccclass, property} = cc._decorator;

// @ccclass
export default class Server  {}
//     @property(cc.Prefab)
//     readonly eggPrefab = null;

//     @property(cc.Prefab)
//     readonly playerPrefab = null;

//     @property(cc.Vec2)
//     readonly mapSize = cc.v2(960,640);

//     @property
//     readonly timeLimit = 10;

//     eggPool : cc.NodePool;
//     timer = 0;
//     player : Player;
//     progressBar : cc.ProgressBar;

//     start(){
//         let newPlayer = cc.instantiate<cc.Node>(this.playerPrefab)
//         this.node.addChild(newPlayer);
//         this.player = newPlayer.getComponent(Player);
//         this.getComponentInChildren(cc.Camera).getComponent(Camera).init(this.player);

//         this.progressBar = this.getComponentInChildren(cc.Camera).getComponentInChildren(cc.ProgressBar);
//         this.timer = 0;

//         this.eggPool = new cc.NodePool();
//         this.spawnEgg();
//         this.setInputControl();
//     }

//     // Endgame message handler
//     gameOver(){
//        this.player.enabled = false;
//        this.player.stopMove();
//        this.unsetInputControl();
//     }

//     despawnEgg(egg : cc.Node){
//         this.eggPool.put(egg);
//         this.spawnEgg();
//     }

//     // Server code
//     spawnEgg(){
//         let newEgg = this.eggPool.size() > 0 ? this.eggPool.get() : cc.instantiate<cc.Node>(this.eggPrefab);
//         // Does the server need to render this
//         this.node.addChild(newEgg);
//         newEgg.getComponent(Egg).init(this);
//         newEgg.setPosition(this.randomPosition());
//     }

//     randomPosition(){
//         let localPosition = cc.v2(Math.random(),Math.random()).scale(this.mapSize);
//         let globalPosition = localPosition.add(this.mapSize.div(2).neg());
//         return globalPosition
//     }

//     update(dt){
//         this.timer += dt;
//         this.progressBar.progress = this.timer/this.timeLimit;
//     }

//     // Player control is here
//     // because we need Player prefab functionally pure
//     setInputControl(){
//         cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.player.onKeyDown, this.player);
//         cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.player.onKeyUp, this.player);
//     }

//     unsetInputControl(){
//         cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.player.onKeyDown, this.player);
//         cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.player.onKeyUp, this.player);
//     }
// }
// // 