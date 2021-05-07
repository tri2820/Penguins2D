const {ccclass, property} = cc._decorator;

import Player from './Player'

@ccclass
export default class NewScript extends cc.Component {
    @property(Player)
    readonly player : Player = null;

    update(){
        let position = this.player.node.getPosition();
        this.node.setPosition(position);
    }    
}