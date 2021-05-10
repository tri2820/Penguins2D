import Server from "../ServerScript/Server";
import AI from "./AI";
import Player from "../Player";
import Channel from "../Channel";

export default class ServerConnectionSimulator extends Channel {
    // The simulation owns a server
    serverNode : cc.Node;
    server : Server;
    // The simulation has many AI players
    players : (Player | AI)[];

    onLoad(){
        this.timer = 0;
        this.travellingMessages = [];
        this.players = [];
        
        // Add callback to send information to server
        this.server = this.addScript(Server) as Server

        // This class itself is a channel
        // and used by the main player to communicate with the server
        this.newConnectionCallback = this.server.addConnection.bind(this.server);    

        // Peek into server numPlayer and populate that many AIs
        for(let i=0; i<this.server.numPlayer - 1; i++){
            let player = this.addScript(AI) as AI;
            this.players.push(player);
            // A channel for each AI
            let newChannel = this.addScript(Channel) as Channel;
            // Tell AI to communicate through this channel
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