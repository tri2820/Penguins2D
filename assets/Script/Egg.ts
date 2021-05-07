import Game from "./Game";
import Player from "./Player";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Egg extends cc.Component {
    readonly pickUpRadius = 50;

    game : Game;

    init(game: Game){
        this.game = game;
    }

    // reuse(game : Game){this.init(game)}

    pickedUpByPlayer(){
        let playerPosition = this.game.player.node.getPosition();
        let thisPosition = this.node.getPosition();
        return thisPosition.sub(playerPosition).mag() <= this.pickUpRadius;
    }
    runAnimation(){

    }

    onPicked () {

    }
    
    update(dt){
        if (this.pickedUpByPlayer()) {
            this.game.despawnEgg(this.node);
        }
    }
}