import Server from "../ServerScript/Server";
import { ActionMessage, GenericMessage, RequestJoinMessage, Timestamp } from "../Defs";

const {ccclass, property} = cc._decorator;

export interface ServerConnection {
    send(GenericMessage);
    onGameInfo : CallableFunction;
    onEndGame : CallableFunction;
    onUpdate : CallableFunction;
}

@ccclass
export class ServerConnectionSimulator extends cc.Component implements ServerConnection {
    onGameInfo;
    onEndGame;
    onUpdate;

    timer : Timestamp;
    queue : [Timestamp, GenericMessage][];

    send(m : GenericMessage){
        this.queue.push([this.timer,m]);
        console.log(this.queue[0][1] instanceof RequestJoinMessage);
    }

    server : Server;

    onLoad(){
        this.queue = [];
        this.timer = 0;
    }

    update(dt){
        this.timer += dt;
        // AIs
    }
}