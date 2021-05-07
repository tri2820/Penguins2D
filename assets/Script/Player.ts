const {ccclass, property} = cc._decorator;

type Direction = 'up' | 'down' | 'left' | 'right';
type OffsetPosition = cc.Vec2;

@ccclass
export default class NewScript extends cc.Component {
    direction : Direction;

    @property
    readonly speed = 200;

    // Boundary zone
    minPosX : number;
    maxPosX : number; 
    anim : cc.Animation;

    keyCodeToDirection = new Map<any,Direction>([
        [cc.macro.KEY.left,'left'],
        [cc.macro.KEY.right,'right'],
        [cc.macro.KEY.down,'down'],
        [cc.macro.KEY.up,'up']
    ])

    directionToAnimation = new Map<Direction,string>([
        ['left','2run'],
        ['right','2run'],
        ['down','1run'],
        ['up','3run'],
    ])

    state = new Map<Direction,boolean>([
        ['left',false],
        ['right',false],
        ['up',false],
        ['down',false],
    ])

    onLoad(){
        this.anim = this.getComponent(cc.Animation);

        this.setInputControl();
        this.node.setPosition(cc.v2(0,0));
    }

    setInputControl(){
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    onKeyDown (event) {        
        let newDirection = this.keyCodeToDirection.get(event.keyCode);
        if (!newDirection || newDirection == this.direction) return;

        if (newDirection == 'left' || this.direction == 'left') this.node.scaleX *=-1;
        this.direction = newDirection;
        let animation = this.directionToAnimation.get(this.direction);
        this.anim.play(animation);
    }

    directionToOffset () : OffsetPosition {
        // offset for each 1 second
        if (this.direction=='up') return cc.v2(0,1).mul(this.speed); 
        if (this.direction=='down') return cc.v2(0,-1).mul(this.speed);
        if (this.direction=='left') return cc.v2(-1,0).mul(this.speed);
        // this.direction == 'right'
        return cc.v2(1,0).mul(this.speed);
    }

    update(dt){
        let offset = this.directionToOffset().mul(dt)
        this.node.setPosition(this.node.getPosition().add(offset));
    }
}