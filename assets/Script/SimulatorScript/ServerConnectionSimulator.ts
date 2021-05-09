import Server from "../ServerScript/Server";
import { ActionMessage, EndGameMessage, GameInfoMessage, GenericMessage, RequestJoinMessage, Timestamp, UpdateMessage } from "../Defs";
const {ccclass, property} = cc._decorator;

type ConnectionDirection = "serverToClient" | "clientToServer"
export interface ServerConnection {
    send(m: GenericMessage, d: ConnectionDirection);
    gameInfoCallback? : (m: GameInfoMessage) => void;
    updateCallback? : (m: UpdateMessage) => void;
    endGameCallback? : (m: EndGameMessage) => void;
}

@ccclass
export class ServerConnectionSimulator extends cc.Component implements ServerConnection {
    timer : Timestamp;
    // TODO: make it queue
    travellingMessages : {
        sendTime: Timestamp, 
        message: GenericMessage,
        direction: ConnectionDirection;
    }[];

    send(m : GenericMessage, direction:ConnectionDirection){
        this.travellingMessages.push({
            sendTime: this.timer,
            message: m,
            direction: direction
        }
        );
    }

    serverNode : cc.Node;
    server : Server;
    latency = 0.5;

    onLoad(){
        this.travellingMessages = [];
        this.timer = 0;

        this.serverNode = new cc.Node();
        this.node.addChild(this.serverNode);

        this.serverNode.addComponent(Server);
        this.server = this.serverNode.getComponent(Server);
        this.server.connection = this;

        // TODO: find another way
        // disable rendering but keep children of serverNode updating
        this.serverNode.opacity = 0;
    }

    update(dt){
        this.timer += dt;
        this.checkArrivedMessages();
        // AIs
    }

    checkArrivedMessages(){
        while (this.travellingMessages[0] && this.travellingMessages[0].sendTime + this.latency < this.timer) {
            let m = this.travellingMessages.shift();
            if (m.direction == "clientToServer") this.forwardToServer(m.message)
            else this.forwardToClient(m.message);
        }
    }

    forwardToServer(m : GenericMessage) {
        console.log("Message arrives", m);
        if (m instanceof RequestJoinMessage) this.server.addPlayer();
    }

    // Talk with client
    gameInfoCallback : (GameInfoMessage) => void;
    updateCallback : (UpdateMessage) => void;
    endGameCallback : (EndGameMessage) => void;

    forwardToClient(m : GenericMessage){
        if (m instanceof GameInfoMessage) this.gameInfoCallback(m);
        if (m instanceof UpdateMessage) this.updateCallback(m);
        if (m instanceof EndGameMessage) this.endGameCallback(m);
    }
}