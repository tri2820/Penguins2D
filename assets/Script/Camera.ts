const {ccclass, property} = cc._decorator;

import Player from './Player'

@ccclass
export default class NewScript extends cc.Component {
    player : Player

    start(){
        this.player = this.node.parent.getComponentInChildren(Player);
    }

    update(){
        let position = this.player.node.getPosition();
        this.node.setPosition(position);
    }    
}