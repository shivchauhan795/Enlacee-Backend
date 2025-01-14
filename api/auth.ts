import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
    userId?: string;
}

const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Extract the token from the header

    if (!token) {
        return res.status(403).send({ message: 'Token is missing!' });
    }

    try {
        const decoded = jwt.verify(token, 'RANDOM-TOKEN') as JwtPayload; // Use the same secret as in your login
        req.userId = decoded.userId; // Attach userId to the request object
        next();
    } catch (error: any) {
        return res.status(401).send({ message: 'Invalid Tooken', error: error.message });
    }
};

export default authMiddleware;