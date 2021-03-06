import Player from '../Player'
const {ccclass} = cc._decorator;

@ccclass
export default class Camera extends cc.Component {
    player : Player

    init(player : Player){
        this.player = player;
        this.node.zIndex = 998;
    }

    update(){
        if (this.player == null) return;
        let position = this.player.node.getPosition();
        this.node.setPosition(position);
    }    
}