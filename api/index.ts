import express from 'express';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import bodyParser from 'body-parser';
import authMiddleware from './auth';


dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

const mongourl = process.env.VERCEL_MONGO_URL as string;
const frontendurl = process.env.VERCEL_FRONTEND_URL || 'http://localhost:5173';
const client = new MongoClient(mongourl, {
    tls: true,  // Enable TLS
    tlsInsecure: true,  // Ensure certificates are validated
    connectTimeoutMS: 10000,
})
const dbName = 'enlacee';

const connectToDatabase = async () => {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to the database', error);
        process.exit(1); // Exit the process if the connection fails
    }
};

connectToDatabase();


app.use(cors({
    origin: '*', // Specify your frontend domain
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true // Allow cookies or other credentials to be sent
}));
app.options('*', cors());

app.use(bodyParser.json())


app.get('/', (req, res) => {
    res.send('Hello, TypeScript with Express!');
});

// register 
app.post("/register", async (request, response): Promise<void> => {
    try {
        const hashedPassword = await bcrypt.hash(request.body.password, 10);
        const db = client.db(dbName);
        const collection = db.collection('users');
        const user = {
            email: request.body.email,
            password: hashedPassword,
        }

        const alreadyExist = await collection.findOne({ email: request.body.email })

        if (alreadyExist) {
            response.status(409).send({
                message: "User with this email already exists",
            });
            return;
        }

        const result = await collection.insertOne(user);
        response.status(201).send({
            message: "User Created Successfully",
            result,
        });


    } catch (error) {
        response.status(500).send({
            message: "Error creating user",
            error,
        });
    }

});

//login
app.post("/login", async (request, response): Promise<void> => {
    try {
        const db = client.db(dbName);
        const collection = db.collection('users');
        const user = await collection.findOne({ email: request.body.email });
        if (!user) {
            response.status(404).send({
                message: "Email not found",
            });
            return;
        }
        const match = await bcrypt.compare(request.body.password, user.password);

        if (!match) {
            response.status(401).send({
                message: "Invalid password",
            });
            return;
        }

        const token = jwt.sign(
            {
                userId: user._id,
                userEmail: user.email,
            },
            "RANDOM-TOKEN",
            { expiresIn: "24h" }
        );
        response.status(200).send({
            message: "Login successful",
            user: {
                email: user.email,
                token,
            }
        });

    } catch (error) {
        response.status(404).send({
            message: "Email not found",
            error,
        });
    }
})

// create short url
app.post("/shorten", async (request, response): Promise<void> => {
    const db = client.db(dbName);
    const collection = db.collection('urls');
    const url = {
        longUrl: request.body.url,
        shortUrl: request.body.text,
    }

    const shorturl = await collection.findOne({ shortUrl: request.body.text })
    if (shorturl) {
        response.status(409).send({
            message: "Alias already exists",
        });
        return;
    }

    const result = await collection.insertOne(url);

    const resultToBeSend = {
        longUrl: request.body.url,
        shortUrl: `${frontendurl}/${request.body.text}`
    }
    response.status(201).send({
        message: "Url Created Successfully",
        result,
        url: resultToBeSend
    });
})

// get long url
app.get("/:shortUrl", async (req, res): Promise<void> => {
    const db = client.db(dbName);
    const collection = db.collection('urls');
    const shortUrl = req.params.shortUrl;
    const url = await collection.findOne({ shortUrl });
    if (!url) {
        res.status(404).send({
            message: "Short URL not found"
        });
        return;
    }
    res.json({ longUrl: url.longUrl });
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
export default app