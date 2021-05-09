import { Game } from "./Defs";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Egg extends cc.Component {
    readonly pickUpRadius = 50;
    game : Game;

    init(game : Game) {
        this.game = game;
    }

    pickedUpByPlayer(){
        let thisPosition = this.node.getPosition();
        return this.game.players.map(p => {
            let playerPosition = p.getPosition()
            return thisPosition.sub(playerPosition).mag() <= this.pickUpRadius;
        }).some(Boolean)
    }
    
    update(dt){
        if (this.pickedUpByPlayer()) {
            this.game.despawnEgg(this.node);
        }
    }
}