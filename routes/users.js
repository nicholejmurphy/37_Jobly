"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const {
  ensureLoggedIn,
  ensureAdmin,
  ensureCurrUserOrAdmin,
} = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");
const userApplySchema = require("../schemas/userApply.json");
const Job = require("../models/job");

const router = express.Router();

/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: admin for: 'POST /', 'GET /'
 * or Admin currUser for remaining routes
 **/

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.register(req.body);
    const token = createToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
  }
});

/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: admin
 **/

router.get("/", ensureAdmin, async function (req, res, next) {
  try {
    const users = await User.findAll();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});

/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin }
 *
 * Authorization required: currUser or Admin
 **/

router.get(
  "/:username",
  ensureCurrUserOrAdmin,
  async function (req, res, next) {
    try {
      const user = await User.get(req.params.username);
      return res.json({ user });
    } catch (err) {
      return next(err);
    }
  }
);

/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: currUser or Admin
 **/

router.patch(
  "/:username",
  ensureCurrUserOrAdmin,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, userUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }

      const user = await User.update(req.params.username, req.body);
      return res.json({ user });
    } catch (err) {
      return next(err);
    }
  }
);

/** POST /:username/jobs/:jobId { username, jobId }  => { applied: jobId }
 *
 * Creates a new application for a user
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: Admin or currUser
 **/
router.post(
  "/:username/jobs/:jobId",
  ensureCurrUserOrAdmin,
  async function (req, res, next) {
    try {
      const appData = {
        username: req.params.username,
        jobId: parseInt(req.params.jobId),
      };

      const validator = jsonschema.validate(appData, userApplySchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }
      await User.get(appData.username);
      await Job.get(appData.jobId);

      const result = await User.apply(appData.username, appData.jobId);

      return res.status(201).json(result);
    } catch (err) {
      return next(err);
    }
  }
);

/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: currUser or Admin
 **/

router.delete(
  "/:username",
  ensureCurrUserOrAdmin,
  async function (req, res, next) {
    try {
      await User.remove(req.params.username);
      return res.json({ deleted: req.params.username });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
