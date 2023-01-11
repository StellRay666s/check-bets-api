const db = require('../models')
const Users = db.Users


exports.checkExistingUserPhone = async (req, res, next) => {
    const phone = req.body.phone

    if (phone === null) {

        return res.status(400).send('Поле не должно быть пустым')

    }

    const userPhone = await Users.findOne({ where: { phone: phone } })


    console.log(userPhone)

    if (userPhone) {
        return res.status(403).send({ message: 'Телефон уже используется' })
    }

    next()

}