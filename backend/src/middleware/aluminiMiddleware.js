export const isAlumni = (req, res, next) => {
    if (req.user && req.user.userType === 'alumni') {
        next();
    } else {
        res.status(403).json({ 
            message: 'Access denied. Only alumni can perform this action.' 
        });
    }
};