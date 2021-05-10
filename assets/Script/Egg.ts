import Client  from "./ClientScript/Client";

const {ccclass} = cc._decorator;

@ccclass
export default class Egg extends cc.Component {
    // TODO: sync with server through message
    pickUpRadius = 50;

    game : Client;

    init(game : Client) {
        this.game = game;
        this.node.color = new cc.Color()
                            .setB(Math.random()*255)
                            .setR(Math.random()*255)
                            .setG(Math.random()*255);
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