const express = require("express");
const controllers = require("../controllers");
const router = express.Router();

router.route("/api/articles")
    .get(controllers.getArticles)
    .post(controllers.postArticles)

router.route("/api/articles/:id")
    .get(controllers.getArticles)
    .put(controllers.updateArticle)
    .delete(controllers.deleteArticles)

router.route("/api/articles/:id/comments")
    .get(controllers.getComments)
    .post(controllers.postComments)

router.route("/api/articles/:id/comments/:id2")
    .delete(controllers.deleteComments)

router.route("/api/users")
    .get(controllers.getAuthors)
    .post(controllers.postAuthors)

router.route("/api/comments")
    .get(controllers.getComments)
    .post(controllers.postComments)
    .delete(controllers.deleteComments)

router.route("/api/users/login")
    .post(controllers.login)

router.route("/api/user")
    .get(controllers.me)
    .put(controllers.updateMe)

router.route("*").get(controllers.notFound)

module.exports = router;