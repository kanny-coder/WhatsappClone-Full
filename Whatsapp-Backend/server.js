//importing
import express from "express"
import mongoose from 'mongoose'
import Messages from './dbMessages.js'
import Pusher from 'pusher'
// import cors from 'cors'


//app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1210940",
    key: "24b00fbab3447f5e8630",
    secret: "2539528da550bd3904f1",
    cluster: "ap2",
    useTLS: true
});


//middleware
app.use(express.json())
// app.use(cors())

app.use((req,res,next)=>{
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Acesss-Control-Allow-Headers","*");
    next();
})

//DB config
const connection_url = 'mongodb+srv://admin:gZrAI3UgnAfGTvJf@whatsappclone-mern-clus.7q7cd.mongodb.net/whatsappdb?retryWrites=true&w=majority'
mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection

db.once('open', () => {
    console.log("DB connected");

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        console.log('A Change occured', change);

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('message', 'inserted', {
                name: messageDetails.name,
                message: messageDetails.message
            })
        } else {
            console.log('Error Triggering Pusher')
        }
    })
});


// api routes
app.get('/', (req, res) => res.status(200).send('hello world'));

app.get("/messages/sync", (req, res) => {
    const dbMessage = req.body;

    Messages.find(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(data);
        }

    });
});

app.post("/messages/new", (req, res) => {
    const dbMessage = req.body;

    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }

    });
});
// listen 
app.listen(port, () => console.log(`Listening on localhost: ${port} `));