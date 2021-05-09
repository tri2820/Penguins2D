import Server from "../ServerScript/Server";
import { ActionMessage, EndGameMessage, GameInfoMessage, GenericMessage, RequestJoinMessage, Timestamp, UpdateMessage } from "../Defs";
import { AI } from "./AI";

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
    readonly clientPlayerID = 0;
    AIs : AI[];
    numAI : number;

    onLoad(){
        this.travellingMessages = [];
        this.timer = 0;
        this.AIs = [];

        this.serverNode = new cc.Node();
        this.node.addChild(this.serverNode);
        this.serverNode.addComponent(Server);
        this.server = this.serverNode.getComponent(Server);
        this.disableRendering(this.serverNode);

        this.numAI = this.server.numPlayer - 1;
        for(let i=0; i<this.numAI; i++){
            let AInode = new cc.Node();
            this.node.addChild(AInode);
            AInode.addComponent(AI);
            this.AIs.push(AInode.getComponent(AI));
            this.disableRendering(AInode);

            this.send(new RequestJoinMessage(), "clientToServer");
        }
    }

    disableRendering(node : cc.Node){
        // TODO: find another way
        // disable rendering but keep children of serverNode updating
        node.opacity = 0;
    }

    update(dt){
        this.timer += dt;
        this.checkArrivedMessages();
    }

    checkArrivedMessages(){
        while (this.travellingMessages[0] && this.travellingMessages[0].sendTime + this.latency < this.timer) {
            let m = this.travellingMessages.shift();
            if (m.direction == "clientToServer") this.forwardToServer(m.message)
            else this.forwardToClient(m.message);
        }
    }

    forwardToServer(m : GenericMessage) {
        console.log("Message sent to server", m);
        if (m instanceof RequestJoinMessage) {
            this.server.addConnection(this);
        }
    }

    // Main Client Callback
    gameInfoCallback : (m: GameInfoMessage) => void;
    updateCallback : (m: UpdateMessage) => void;
    endGameCallback : (m: EndGameMessage) => void;

    forwardToClient(m : GenericMessage){
        console.log("Message sent to client", m);

        if (m instanceof GameInfoMessage) {
            if (m.playerIndex == this.clientPlayerID) this.gameInfoCallback(m)
            else this.AIs[m.playerIndex-1].gameInfoCallback(m);
        }
            
        if (m instanceof UpdateMessage) {
            this.updateCallback(m);
            this.AIs.forEach((ai) => ai.updateCallback(m));
        }
        if (m instanceof EndGameMessage) {
            this.endGameCallback(m);
            this.AIs.forEach((ai) => ai.endGameCallback(m));
        }

    }
}