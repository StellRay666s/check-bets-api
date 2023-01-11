const jwt = require('jsonwebtoken')
const db = require('../models')



exports.checkToken = async (req, res, next) => {
    const token = req.headers.authorization

    if (token === '') {
        return res.status(403).send({ message: 'Нет доступа' })
    }

    const verifyToken = jwt.verify(token, 'secret')

    if (!token) {
        return res.status(403).send({ message: 'Токен помер' })
    }

    next()

}

