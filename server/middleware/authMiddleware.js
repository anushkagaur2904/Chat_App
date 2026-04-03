import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
    const toekn = req.headers.authorization?.split(" ")[1];

    if (!toekn) {
        return res.status(401).json({ message: "Not authorized, no token" });
    }

    try {
        const decoded = jwt.verify(toekn, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: "Not authorized, token failed" });
    }
};