const {ccclass, property} = cc._decorator;

import Player from '../Player'

@ccclass
export default class Camera extends cc.Component {
    player : Player

    init(player : Player){
        this.player = player;
    }

    update(){
        if (this.player == null) return;
        let position = this.player.node.getPosition();
        this.node.setPosition(position);
    }    
}