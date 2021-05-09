import Server from "../ServerScript/Server";
import { ActionMessage, GenericMessage, RequestJoinMessage } from "../Defs";

const {ccclass, property} = cc._decorator;

export interface ServerConnection {
    sendRequestJoin(RequestJoinMessage);
    sendAction(ActionMessage);
    onGameInfo : CallableFunction;
    onEndGame : CallableFunction;
    onUpdate : CallableFunction;
}

@ccclass
export class ServerConnectionSimulator extends cc.Component implements ServerConnection {
    onGameInfo;
    onEndGame;
    onUpdate;

    sendRequestJoin(m : RequestJoinMessage){
        // 
    }

    sendAction(m : ActionMessage){
        // 
    }

    server : Server;

    update(){
        // console.log("AI talks");
        // AIs
    }
}