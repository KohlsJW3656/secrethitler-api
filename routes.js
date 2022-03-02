const promiseRouter = require("express-promise-router");
const router = promiseRouter();
const authenticateToken = require("./middleware/authenticateJWT");

//User routes
const user = require("./controllers/user");
router.post("/user/signup", user.create);
router.post("/user/login", user.login);
router.post("/user/forgotpassword", user.forgotPassword);
router.patch("/user/resetpassword", authenticateToken, user.resetPassword);
router.patch("/user/edit", authenticateToken, user.edit);
router.get("/user", authenticateToken, user.get);

//Game routes
const game = require("./controllers/game");
router.delete("/game/delete", authenticateToken, game.deleteGame);
router.post("/game/create", authenticateToken, game.createGame);
router.get("/game/all", authenticateToken, game.allGames);
router.get("/game/all/joinable", authenticateToken, game.allJoinable);
router.get("/game/all/public", authenticateToken, game.allPublic);
router.get("/game/all/private", authenticateToken, game.allPrivate);

//Rule routes
const rule = require("./controllers/rule");
router.get("/rule/all", authenticateToken, rule.allRules);

//Gameuser routes
const gameUser = require("./controllers/gameuser");
router.delete("/gameuser/kick", authenticateToken, gameUser.kickGameUser);
router.post("/gameuser/join", authenticateToken, gameUser.joinGame);

//Policy routes
const policy = require("./controllers/policy");
router.patch("/policy/edit", authenticateToken, policy.editPolicy);
router.get("/policy/all", authenticateToken, policy.allPolicies);
router.get("/policy/draw", authenticateToken, policy.drawPolicies);
router.get("/policy/deck", authenticateToken, policy.deckPolicies);
router.get("/policy/discarded", authenticateToken, policy.discardedPolicies);
router.get("/policy/enacted", authenticateToken, policy.enactedPolicies);
router.get("/policy/notenacted", authenticateToken, policy.notEnactedPolicies);
router.get("/policy/top", authenticateToken, policy.topPolicy);

//Admin routes
const admin = require("./controllers/admin");
router.delete("/admin/user/delete", authenticateToken, admin.deleteUser);
router.patch("/admin/user/edit", authenticateToken, admin.editUser);
router.get("/admin/user/all", authenticateToken, admin.allUsers);

module.exports = router;
