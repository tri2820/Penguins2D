import Client  from "./ClientScript/Client";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Egg extends cc.Component {
    pickUpRadius = 50;
    game : Client;

    init(game : Client) {
        this.game = game;
    }

    pickedUpByPlayer(){
        let thisPosition = this.node.getPosition();
        let playerPosition = this.game.player.node.getPosition();
        return thisPosition.sub(playerPosition).mag() <= this.pickUpRadius;
    }
    
    update(dt){
        if (this.pickedUpByPlayer()) {
            this.game.despawnEgg(this.node);
        }
    }
}