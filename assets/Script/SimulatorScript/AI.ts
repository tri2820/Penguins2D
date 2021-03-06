import { ActionMessage, EndGameMessage, GameInfoMessage, PlayerIndex, Position, RequestJoinMessage, UpdateMessage } from "../Defs";
import Channel from "../Channel";
import { Defs, InputState } from "../Defs";

export default class AI extends cc.Component {
    connection : Channel;
    playerID : PlayerIndex;
    position : Position = cc.v2(0,0);
    // Store the position of the nearest egg
    nearestEgg : Position = cc.v2(0,0);
    inputState : InputState ;

    init(conn : Channel){
        this.inputState = Defs.getNewInputState();

        this.connection = conn;
        this.setupServerCallback();
        this.connection.sendToServer(new RequestJoinMessage());
    }
    
    setupServerCallback(){
        // TODO: use event system instead of explicit binding.
        this.connection.gameInfoCallback = this.gameInfoCallback.bind(this);
        this.connection.updateCallback = this.updateCallback.bind(this);
        this.connection.endGameCallback = this.endGameCallback.bind(this);        
    }

    gameInfoCallback(m:GameInfoMessage){
        this.playerID = m.playerIndex;
    }

    updateCallback(m:UpdateMessage){
        this.position = m.playerPositions[this.playerID];
        this.nearestEgg = m.eggPositions.reduce(function(prev, curr) {
            return prev.sub(this.position).mag() < curr.sub(this.position).mag() ? prev : curr;
        }.bind(this));
    }

    updateAction(){
        // Move to nearest egg
        if (this.nearestEgg.x > this.position.x){
            this.inputState.set("left",false);
            this.inputState.set("right",true);
        } else {
            this.inputState.set("left",true);
            this.inputState.set("right",false);
        }

        if (this.nearestEgg.y < this.position.y){
            this.inputState.set("up",false);
            this.inputState.set("down",true);
        } else {
            this.inputState.set("up",true);
            this.inputState.set("down",false);
        }
    }

    endGameCallback(m:EndGameMessage){
        this.enabled = false;
    }

    update(){
        this.updateAction();
        let m = new ActionMessage(this.inputState, 0);
        this.connection.sendToServer(m);
        
    }
}