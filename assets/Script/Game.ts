import Player from "./Player";
import Egg from "./Egg";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Game extends cc.Component {

    @property(Player)
    readonly player : Player = null;

    // ATTENTION
    @property(cc.Prefab)
    readonly eggPrefab = null;

    eggPool : cc.NodePool;
    timer = 0;
    timelimit = 10000;

    start() {
        this.timer = 0;
        this.eggPool = new cc.NodePool();
        // TEST
        this.spawnEggSpawn();
        console.log('Egg spawned!');
    }

    gameOver(){
        console.log('Game Over!');
    }

    // Server code
    spawnEggSpawn(){
        console.log('Egg spawned!');
        // reuse(this) 
        let newEgg =  this.eggPool.size() > 0 ? this.eggPool.get(this) : cc.instantiate<cc.Node>(this.eggPrefab);
        // Does the server need to render this
        this.node.addChild(newEgg);
        
        newEgg.getComponent(Egg).init(this);
        newEgg.getComponent(Egg).setRandomPosition();
    }

    update(dt){
        if (this.timer > this.timelimit) {
            this.gameOver();
            return;
        }
        this.timer += dt;
    }
}
