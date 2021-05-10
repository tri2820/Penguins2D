import { ActionMessage, clientToServerMessage, EndGameMessage, GameInfoMessage, GenericMessage, RequestJoinMessage, serverToClientMessage, Timestamp, UpdateMessage } from "./Defs";

type ConnectionDirection = "serverToClient" | "clientToServer"

// Channel connecting server and clients
// Each client shares a channel with server
// Ideally, this should be separated into 2 interfaces
// In production, extend this class and overload the send method with a Websocket method
export default class Channel extends cc.Component {
    gameInfoCallback : (m: GameInfoMessage) => void;
    updateCallback : (m: UpdateMessage) => void;
    endGameCallback : (m: EndGameMessage) => void;
    actionCallback : (m: ActionMessage) => void;
    newConnectionCallback : (conn: Channel) => void;

    // Simulation latency is set to 100ms
    latency = 0.1;
    // Message in this list is considered "travelling" 
    // between the server and the client
    travellingMessages : {
        sendTime: Timestamp, 
        message: GenericMessage,
        direction: ConnectionDirection
    }[];
    timer : Timestamp;

    onLoad(){
        this.travellingMessages = [];
        this.timer = 0;
    }

    update(dt){
        this.timer += dt;
        this.checkArrivedMessages();
    }
    
    sendToServer(m : clientToServerMessage){this.send(m, "clientToServer")} 
    sendToClient(m : serverToClientMessage){this.send(m, "serverToClient")} 

    send(m : GenericMessage, direction:ConnectionDirection){
        this.travellingMessages.push({
            sendTime: this.timer,
            message: m,
            direction: direction
        });
    }

    checkArrivedMessages(){
        // Simulation: Arrived if sendTime + timeToTravel (latency) < currentTime 
        while (this.travellingMessages[0] && this.travellingMessages[0].sendTime + this.latency < this.timer) {
            let m = this.travellingMessages.shift();
            if (m.direction == "clientToServer") this.forwardToServer(m.message)
            else this.forwardToClient(m.message);
        }
    }

    // Send message to clients and servers through callbacks
    forwardToServer(m : GenericMessage) {
        if (m instanceof RequestJoinMessage) this.newConnectionCallback(this);
        if (m instanceof ActionMessage) this.actionCallback(m);
    }
    forwardToClient(m : GenericMessage){
        if (m instanceof GameInfoMessage) this.gameInfoCallback(m);
        if (m instanceof UpdateMessage) this.updateCallback(m);
        if (m instanceof EndGameMessage) this.endGameCallback(m);
    }
}
