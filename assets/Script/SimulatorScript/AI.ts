import { ActionMessage, clientToServerMessage, EndGameMessage, GameInfoMessage, RequestJoinMessage, UpdateMessage } from "../Defs";
import { Channel, ServerConnectionSimulator } from "./ServerConnectionSimulator";
const {ccclass, property} = cc._decorator;

@ccclass
export class AI extends cc.Component {
    connection : Channel;

    init(conn : Channel){
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


    gameInfoCallback(m:GameInfoMessage){}
    updateCallback(m:UpdateMessage){}
    endGameCallback(m:EndGameMessage){}

    update(){
        // let m = new ActionMessage();
        // this.connection.send(m)
    }
}