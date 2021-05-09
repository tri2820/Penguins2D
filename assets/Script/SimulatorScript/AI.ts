import { EndGameMessage, GameInfoMessage, UpdateMessage } from "../Defs";

const {ccclass, property} = cc._decorator;

@ccclass
export class AI extends cc.Component {
    gameInfoCallback(m:GameInfoMessage){}
    updateCallback(m:UpdateMessage){}
    endGameCallback(m:EndGameMessage){}
}