import express from 'express';
import dotenv from 'dotenv';
import e from 'express';
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Hello, TypeScript with Express!');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
export default app