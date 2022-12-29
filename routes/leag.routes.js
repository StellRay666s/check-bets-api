module.exports = (app) => {
    const newsControllers = require("../controllers/news.controller");
    var router = require("express").Router();

    router.post("/news", newsControllers.createNews);
    router.get("/news", newsControllers.getNews);
    router.get("/news/:id", newsControllers.getOne);
    router.patch("/news/:id", newsControllers.updateNews);
    router.delete("/news/:id", newsControllers.deleteNews);

    app.use("/", router);
};
