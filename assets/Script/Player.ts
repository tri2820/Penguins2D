import {Defs, Direction, InputState} from './Defs'
const {ccclass, property} = cc._decorator;

@ccclass
export default class Player extends cc.Component {
    anim : cc.Animation;
    _cached_scaleX : number;

    @property
    readonly speed = 300;

    inputState : InputState;

    onLoad(){
        this.inputState = Defs.getNewInputState();
        this.anim = this.getComponent(cc.Animation);
        this._cached_scaleX = this.node.scaleX;
        this.node.setPosition(cc.v2(0,0));
    }

    onKeyDown (event) {
        let direction = Defs.keyCodeToDirection.get(event.keyCode);
        if (!direction) return;
        if (this.inputState.get(direction)) return;
        this.inputState.set(direction, true);
        this.animate(direction);
    }

    onKeyUp (event) {        
        let direction = Defs.keyCodeToDirection.get(event.keyCode);
        if (!direction) return;
        if (!this.inputState.get(direction)) return;
        this.inputState.set(direction, false);
        this.animate(direction);
    }

    displacement () {
        let displacements = Array.from(this.inputState.entries()).map(([k,v]) => v ? Defs.unitDisplacement.get(k) : cc.v2(0,0));
        let displacement = displacements.reduce((s, v) => s.add(v))
        return displacement.mul(this.speed)
    }

    animate(direction : Direction){
        let runDirection = Array.from(this.inputState.keys()).find(k => this.inputState.get(k));        
        let animation = runDirection ? Defs.directionToAnimation.get(runDirection) : Defs.directionToIdleAnimation.get(direction);
        this.anim.play(animation);
        if (runDirection) this.node.scaleX = this.inputState.get('left') ? -this._cached_scaleX : this._cached_scaleX;
    }

    update(dt){
        let displacement = this.displacement().mul(dt);
        this.node.setPosition(this.node.getPosition().add(displacement));
    }

    stopMove(){
        this.anim.pause();
    }
}