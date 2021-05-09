import Server from "../ServerScript/Server";
import { ActionMessage, clientToServerMessage, EndGameMessage, GameInfoMessage, GenericMessage, PlayerIndex, RequestJoinMessage, Timestamp, UpdateMessage } from "../Defs";
import { AI } from "./AI";
import Player from "../Player";

const {ccclass, property} = cc._decorator;

type ConnectionDirection = "serverToClient" | "clientToServer"

@ccclass
export class Channel extends cc.Component {
    gameInfoCallback : (m: GameInfoMessage) => void;
    updateCallback : (m: UpdateMessage) => void;
    endGameCallback : (m: EndGameMessage) => void;
    actionCallback : (m: ActionMessage) => void;
    newConnectionCallback : (conn: Channel) => void;

    latency = 0.5;
    timer : Timestamp;
    travellingMessages : {
        sendTime: Timestamp, 
        message: GenericMessage,
        direction: ConnectionDirection
    }[];

    onLoad(){
        this.travellingMessages = [];
        this.timer = 0;
    }

    update(dt){
        this.timer += dt;
        this.checkArrivedMessages();
    }
    
    send(m : GenericMessage, direction:ConnectionDirection){
        this.travellingMessages.push({
            sendTime: this.timer,
            message: m,
            direction: direction
        });
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
        if (m instanceof RequestJoinMessage) this.newConnectionCallback(this);
        if (m instanceof ActionMessage) this.actionCallback(m);
    }

    forwardToClient(m : GenericMessage){
        console.log("Message sent to client", m);
        if (m instanceof GameInfoMessage) this.gameInfoCallback(m);
        if (m instanceof UpdateMessage) this.updateCallback(m);
        if (m instanceof EndGameMessage) this.endGameCallback(m);
    }
}


export class ServerConnectionSimulator extends Channel {
    serverNode : cc.Node;
    server : Server;
    readonly clientPlayerID = 0;
    players : (Player | AI)[];
    mainClientChannel : Channel;

    onLoad(){
        this.timer = 0;
        this.travellingMessages = [];
        this.players = [];
        
        this.server = this.addScript(Server) as Server
        this.newConnectionCallback = this.server.addConnection.bind(this.server);    

        for(let i=0; i<this.server.numPlayer - 1; i++){
            let player = this.addScript(AI) as AI;
            this.players.push(player);
            let newChannel = this.addScript(Channel) as Channel;
            player.init(newChannel);
            newChannel.newConnectionCallback = this.server.addConnection.bind(this.server);    
        }
        
    }

    addScript(S){
        let node = new cc.Node();
        this.disableRendering(node);
        this.node.addChild(node);
        node.addComponent(S);
        return node.getComponent(S);
    }

    disableRendering(node : cc.Node){
        // TODO: find another way
        // to disable rendering but keep children of serverNode updating
        node.opacity = 0;
    }
}