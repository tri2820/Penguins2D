import Player from "./Player";
import Egg from "./Egg";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Game extends cc.Component {
    @property(cc.Prefab)
    readonly eggPrefab = null;

    @property(cc.Vec2)
    readonly mapSize = cc.v2(960,640);

    @property
    readonly timeLimit = 10;

    eggPool : cc.NodePool;
    timer = 0;
    player : Player;
    progressBar : cc.ProgressBar;

    start() {
        this.player = this.node.getComponentInChildren(Player);
        this.progressBar = this.getComponentInChildren(cc.Camera).getComponentInChildren(cc.ProgressBar);
        console.log(this.progressBar);
        this.timer = 0;
        this.eggPool = new cc.NodePool();
        this.spawnEgg();
    }

    gameOver(){
       this.player.enabled = false;
       this.player.stopMove();
    }

    despawnEgg(egg : cc.Node){
        this.eggPool.put(egg);
        this.spawnEgg();
    }

    // Server code
    spawnEgg(){
        console.log('Egg spawned!');
        let newEgg = this.eggPool.size() > 0 ? this.eggPool.get() : cc.instantiate<cc.Node>(this.eggPrefab);
        // Does the server need to render this
        this.node.addChild(newEgg);
        newEgg.getComponent(Egg).init(this);
        newEgg.setPosition(this.randomPosition());
    }

    randomPosition(){
        let localPosition = cc.v2(Math.random(),Math.random()).scale(this.mapSize);
        let globalPosition = localPosition.add(this.mapSize.div(2).neg());
        return globalPosition
    }

    update(dt){
        if (this.timer > this.timeLimit) {
            this.gameOver();
            return;
        }
        this.timer += dt;
        console.log(this.timer);
        this.progressBar.progress = this.timer/this.timeLimit;
    }
}
