import config from "@colyseus/tools";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";
import cors from 'cors';

import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';

/**
 * Import your Room files
 */
import { MyRoom } from "./AppRoom";
import { AllRooms, SHtoPuzzleMap, getCurrentDateStr, mobileUserIDList, randomNumber, shuffle } from "./utils/utils";
import { matchMaker } from "colyseus";

declare module 'express' {
    export interface Request {
        session: session.Session;
    }
}

export default config({

    initializeGameServer: (gameServer) => {
        /**
         * Define your room handlers:
         */
        //
        gameServer.define('anu-tutorial', MyRoom, { maxClients: 20 });

    },

    initializeExpress: (app) => {

        let recordingInterval;

        const secretKey = require('crypto').randomBytes(64).toString('hex');
        /**
         * 
         * Bind your custom express routes here:
         * Read more: https://expressjs.com/en/starter/basic-routing.html
         */

        // Use CORS middleware to allow requests from any origin
        // Or specify your client's origin instead of "*"
        app.use(cors({
            origin: 'https://*.use.devtunnels.ms'
        }));

        app.options('*', cors()); // Include CORS preflight across all routes or specify your route

        app.use(cookieParser());
        app.use(session({
            secret: secretKey,
            resave: false,
            saveUninitialized: true,
            cookie: { secure: true }
        }));

        // Serve static files from the 'public' directory
        app.use('/static', express.static('public'));
        
        app.get("/create-rooms", async (req, res) => {
            
            for(let i =0; i< mobileUserIDList.length; i ++ ){
                const metatData = {
                    mobileUser: "mobileuser"+mobileUserIDList[i]
                }
                const room = await matchMaker.createRoom("devup_pairroom", metatData);
            }
            res.send("rooms created");
        })


        app.get("/hello_world", (req, res) => {
            res.send("hello_world");
        });

        app.post('/post-message-to-all', (req, res) => {
            try {
                const message = req.body.message;
        
                if (typeof message !== 'string') {
                    return res.status(400).send('Invalid message');
                }
        
                //sending message to all users in the rooms. client side do the check
                for (const key in AllRooms.rooms) {
                    const room = AllRooms.rooms[key];
                    room.broadcast("post-message-to-all", message);
                }
        
                res.status(200).send('Message sent to all rooms');
            } catch (error) {
                console.error(error);
                res.status(500).send('An error occurred');
            }
        });

        /**
         * Use @colyseus/playground
         * (It is not recommended to expose this route in a production environment)
         */
        if (process.env.NODE_ENV !== "production") {
            app.use("/", playground);
        }


        /**
         * Use @colyseus/monitor
         * It is recommended to protect this route with a password
         * Read more: https://docs.colyseus.io/tools/monitor/#restrict-access-to-the-panel-using-a-password
         */
        app.use("/colyseus", monitor());
    },


    beforeListen: async () => {

    }

});


