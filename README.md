# Penguins2D
April 25

# Architecture
## In production the thing will look like this
[client A] <--> [Client websocket interface] <--> [Server websocket interface] <--> [ Server]

## In the simulation I implemented it like this
[client] <--> [ServerConnectionSimulator [Server] [AIs]]

## Explanation
The `ServerConnectionSimulator` extends `Channel`. The class `Channel` is equivalent to both Server and Client websocket interfaces. In production you just have to (1) write a Websocket class extends Channel and (2) load the `connection` in `Client.ts` with that class.

Even though the `ServerConnectionSimulator` here owns the Sever and AIs, it properly communicates with them through messages and callbacks. The reason I write it like this is to make use of Cocos component's update function, so I don't have to implement parallel threads and so on. It also kinda makes the code plug-and-play though Cocos's Editor.

## More explanation
Message types are defined in `Defs.ts`. In production you have to serialize and deserialize them.

The server will send update at random interval, see `Server.ts > sendUpdate()`.
Remote players are interpolated, but currently indirectly thourgh simulated keyboard input state. A better approach is animating them directly.

There is no client-side prediction (and server reconciliation) yet, because the game is quite deterministic and there is no packet loss taken into account anyway. There is however some tricks such as using hot/cold region, adjusting `pickupRange` and client-side pickup to make the game feel smoother. 

Network latency is set using `latency` in Channel.ts. Note that this only affects the simulator, there are some methods and properties need to be moved from `Channel.ts` to `ServerConnectionSimulator.ts`.

## Problems
There is a problem syncing the score between the server and the client. There is also this problem that the remote players are 1-frame lagged behind (intendedly for interpolation), shown running behind the local player but eat the Egg first. These can be fixed by implementing client-side prediction.
