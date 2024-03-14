import { Room, Client } from "@colyseus/core";
import { AppRoomState } from "./rooms/state/AppRoomState";
import { AllRooms } from "./utils/utils";

export class MyRoom extends Room<AppRoomState> {

  public instance: MyRoom;
  public maxClients = 4;
  private updateRate = 100; //ms
  public options: any;

  private registerMessageHandlers() {

    this.onMessage("*", (client, type, data) => {

      this.state.processMessage(this.instance, this.clients, client, type, data);

    });

  }

  onCreate(options: any) {
    //customize based on options if needed
    this.options = options;
    
    this.maxClients = this.maxClients;
    this.autoDispose = true;
    this.instance = this;
    AllRooms.rooms[this.roomId] = this.instance;
    console.log("MyRoom created.");
    this.registerMessageHandlers();
    this.setState(new AppRoomState());
    //Set frequency the patched state should be sent to all clients, in milliseconds
    //let's make it the same as our game loop
    this.setPatchRate(this.updateRate);

    // Set the simulation interval callback
    // use to check stuff on the server at regular interval
    this.setSimulationInterval((dt) => {
      this.state.update(dt);
    }, this.updateRate);

  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    this.state.removePlayer(client);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");

    if (AllRooms.rooms.hasOwnProperty(this.roomId)) {
      // Use the delete operator to remove the key-value pair
      delete AllRooms.rooms[this.roomId];
    }

  }

}
