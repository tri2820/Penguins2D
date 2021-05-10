import { ActionMessage, clientToServerMessage, EndGameMessage, GameInfoMessage, PlayerIndex, Position, RequestJoinMessage, UpdateMessage } from "../Defs";
import { Channel, ServerConnectionSimulator } from "./ServerConnectionSimulator";
import { Defs, InputState } from "../Defs";

const {ccclass, property} = cc._decorator;

@ccclass
export default class AI extends cc.Component {
    connection : Channel;
    playerID : PlayerIndex;
    position : Position;
    nearestEgg : Position;
    inputState : InputState;

    init(conn : Channel){
        this.nearestEgg = cc.v2(0,0);
        this.position = cc.v2(0,0);
        this.inputState = Defs.getNewInputState();

        this.connection = conn;
        this.setupServerCallback();
        this.connection.send(new RequestJoinMessage(), "clientToServer");
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
        this.connection.send(m, "clientToServer");
        
    }
}