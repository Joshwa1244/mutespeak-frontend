import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

import { getToken } from "./authService";

const WS_URL = 
//"http://localhost:8080/ws/mutespeak";
"https://site--mutespeak-backend--22t95wnlrvvt.code.run/ws/mutespeak";
let client = null;
let connected = false;

// Subscriptions requested before the socket connects.
const pendingSubscriptions = [];

export function connectWebSocket(onConnect) {

    if (client?.active || connected) {
        return;
    }

    client = new Client({

        webSocketFactory: () => new SockJS(WS_URL),

        reconnectDelay: 5000,

        debug: (message) => {
            console.log("[STOMP]", message);
        },

        connectHeaders: {
            Authorization: `Bearer ${getToken()}`
        },

        onConnect: () => {

            connected = true;

            console.log("✅ WebSocket Connected");

            // Register every queued subscription.
            pendingSubscriptions.forEach(subscription => {

                subscription.instance = client.subscribe(

                    subscription.destination,

                    message => {

                        subscription.callback(
                            JSON.parse(message.body)
                        );

                    }

                );

            });

            if (onConnect) {
                onConnect();
            }
        },

        onDisconnect: () => {

            connected = false;

            console.log("❌ WebSocket Disconnected");
        },

        onStompError: (frame) => {

            console.error(
                "Broker Error:",
                frame.headers["message"]
            );

            console.error(frame.body);
        }

    });

    client.activate();
}

export function disconnectWebSocket() {

    if (!client) {
        return;
    }

    connected = false;

    client.deactivate();

    client = null;

    pendingSubscriptions.length = 0;
}

export function subscribe(destination, callback) {

    // Already connected → subscribe immediately.
    if (client && connected) {

        return client.subscribe(

            destination,

            message => {

                callback(
                    JSON.parse(message.body)
                );

            }

        );

    }

    // Queue until connected.
    const queued = {

        destination,

        callback,

        instance: null

    };

    pendingSubscriptions.push(queued);

    return {

        unsubscribe() {

            if (queued.instance) {

                queued.instance.unsubscribe();

            }

            const index =
                pendingSubscriptions.indexOf(queued);

            if (index !== -1) {

                pendingSubscriptions.splice(index, 1);

            }

        }

    };

}

export function publish(destination, body) {

    if (!client || !connected) {
        return;
    }

    client.publish({

        destination,

        body: JSON.stringify(body)

    });

}

export function isConnected() {

    return connected;

}