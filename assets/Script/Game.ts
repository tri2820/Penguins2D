import Player from "./Player";
import Egg from "./Egg";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Game extends cc.Component {
    @property(Player)
    readonly player = null;

    // ATTENTION
    @property(cc.Prefab)
    readonly eggPrefab = null;

    @property(cc.Vec2)
    readonly mapSize = cc.v2(960,640);

    @property
    readonly timeLimit = 100000;

    eggPool : cc.NodePool;
    timer = 0;

    start() {
        this.timer = 0;
        this.eggPool = new cc.NodePool();
        this.spawnEgg();
    }

    gameOver(){
        console.log('Game Over!');
    }

    despawnEgg(egg){
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

        var r2 = cc.v2(Math.random(),Math.random());
        var localPosition = r2.scale(this.mapSize);
        var globalPosition = localPosition.add(this.mapSize.div(2).neg());
        console.log('this is r2',r2);
        console.log('this is mapsize',this.mapSize);
        console.log('this is local',localPosition);

        // newEgg.setPosition(globalPosition);
    }

    update(dt){
        if (this.timer > this.timeLimit) {
            this.gameOver();
            return;
        }
        this.timer += dt;
    }
}
