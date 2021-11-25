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
