import {Defs, Direction, InputState} from './Defs'
const {ccclass, property} = cc._decorator;

@ccclass
export default class Player extends cc.Component {
    @property
    readonly speed = 300;

    inputState : InputState;
    anim : cc.Animation;
    // Only have the "moving right" texture
    // Flipping the scale (horizontally reflect) to get the "moving left" texture
    // Flipping again to get back to "moving right" -> cached
    _cached_scaleX : number;

    onLoad(){
        this.inputState = Defs.getNewInputState();
        this.anim = this.getComponent(cc.Animation);
        this._cached_scaleX = this.node.scaleX;
        this.node.setPosition(cc.v2(0,0));
    }

    // TODO: Replace these callbacks with getter and setter of inputState 
    onKeyDown (event) {
        let direction = Defs.keyCodeToDirection.get(event.keyCode);
        // If event is not a direction action
        if (!direction) return;
        // If is moving in that direction already
        if (this.inputState.get(direction)) return;
        this.inputState.set(direction, true);
        this.animate(direction);
    }
    onKeyUp (event) {        
        let direction = Defs.keyCodeToDirection.get(event.keyCode);
        // If event is not a direction action
        if (!direction) return;
        // If is not moving in that direction already
        if (!this.inputState.get(direction)) return;
        this.inputState.set(direction, false);
        this.animate(direction);
    }

    // Calculate the displacement wrt the input
    displacement () {
        // Each direction translates to a displacement along that axis
        let displacements = Array.from(this.inputState.entries()).map(([k,v]) => v ? Defs.unitDisplacement.get(k) : cc.v2(0,0));
        // Sum all displacements along axes
        let displacement = displacements.reduce((s, v) => s.add(v))
        return displacement.mul(this.speed)
    }

    animate(direction : Direction){
        // Get one of the running directions
        // When query from inputState, "up" and "down" is prioritied over "left" and "right"
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