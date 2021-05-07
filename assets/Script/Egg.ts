import Game from "./Game";

const {ccclass, property} = cc._decorator;

// Pool

@ccclass
export default class NewScript extends cc.Component {
    game : Game;

    init (game) {
        this.game = game;
    }

    reuse (game){
        // ^ is this needed
        this.init(game);
    }

    distanceToPlayer(){
        let playerPosition = this.game.player.node.getPosition();
        let thisPosition = this.node.getPosition();
        return thisPosition.sub(playerPosition).mag();
    }

    setRandomPosition(){
        // Map size, should move to its own class later
        let mapsize = cc.v2(100,100);
        let r2 = cc.v2(Math.random(),Math.random());
        let newPosition = mapsize.multiply(r2)
        this.node.setPosition(newPosition);
    }

    onLoad(){

    }

    runAnimation(){

    }

    onPicked () {

    }
    
    update(dt){

    }
}