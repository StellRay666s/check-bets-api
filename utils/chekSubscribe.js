const db = require('../models')
const userTariffs = db.userTariffs;
const cron = require('node-cron');





async function checkTimeSubscribe() {
    const today = new Date()

    const tariff = await userTariffs.findAll({ where: { tariffsFinish: today } })
    const finishTime = tariff.map(item => item.tariffsFinish)
    console.log(tariff)

    // if (today != finishTime) {
    //     await userTariffs.destroy({ where: { tariffsFinish: finishTime } })
    // }


    // console.log(today)
}


module.exports = { checkTimeSubscribe }