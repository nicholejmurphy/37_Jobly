"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "new",
    salary: 100000,
    equity: 0,
    companyHandle: "c1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "new",
      salary: 100000,
      equity: "0",
      companyHandle: "c1",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = $1`,
      [job.id]
    );
    expect(result.rows).toEqual([
      {
        id: job.id,
        title: "new",
        salary: 100000,
        equity: "0",
        company_handle: "c1",
      },
    ]);
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 100001,
        equity: "0",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 100000,
        equity: "0.1",
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 100000,
        equity: "0",
        companyHandle: "c3",
      },
    ]);
  });
});

/************************************** filter */

describe("filter", function () {
  test("works: with title", async function () {
    const params = { title: "j1" };
    let jobs = await Job.filter(params);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 100001,
        equity: "0",
        companyHandle: "c1",
      },
    ]);
  });
  test("works: with salary", async function () {
    const params = { minSalary: 100001 };
    let jobs = await Job.filter(params);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 100001,
        equity: "0",
        companyHandle: "c1",
      },
    ]);
  });
  test("works: with equity", async function () {
    const params = { hasEquity: true };
    let jobs = await Job.filter(params);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 100000,
        equity: "0.1",
        companyHandle: "c2",
      },
    ]);
  });
  test("BadRequest: invalid filter", async function () {
    try {
      const params = { companyHandle: "c1" };
      let jobs = await Job.filter(params);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** get */

describe("get", function () {
  const newJob = {
    title: "new",
    salary: 100000,
    equity: 0,
    companyHandle: "c1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    let res = await Job.get(job.id);
    expect(res).toEqual({
      id: job.id,
      title: "new",
      salary: 100000,
      equity: "0",
      companyHandle: "c1",
    });
  });

  test("not found if no such job", async function () {
    try {
      let job = await Job.get(0);
      console.log(job);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */
describe("update", function () {
  const updateData = {
    title: "updated",
    salary: 100000,
    equity: 0,
    company_handle: "c1",
  };

  test("works", async function () {
    const res = await db.query(
      `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle`,
      ["testJob", 100000, "0.1", "c1"]
    );

    const testJob = res.rows[0];

    let job = await Job.update(testJob.id, updateData);
    expect(job).toEqual({
      id: testJob.id,
      title: "updated",
      salary: 100000,
      equity: "0",
      companyHandle: "c1",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${testJob.id}`
    );
    expect(result.rows).toEqual([
      {
        id: testJob.id,
        title: "updated",
        salary: 100000,
        equity: "0",
        company_handle: "c1",
      },
    ]);
  });

  test("works: null fields", async function () {
    const res = await db.query(
      `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle`,
      ["testJob", 100000, "0", "c1"]
    );

    const testJob = res.rows[0];
    const partialUpdateData = {
      title: "updated",
      company_handle: "c1",
    };

    let job = await Job.update(testJob.id, partialUpdateData);
    expect(job).toEqual({
      id: testJob.id,
      title: "updated",
      salary: 100000,
      equity: "0",
      companyHandle: "c1",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${testJob.id}`
    );
    expect(result.rows).toEqual([
      {
        id: testJob.id,
        title: "updated",
        salary: 100000,
        equity: "0",
        company_handle: "c1",
      },
    ]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(1, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    const jobRes = await db.query(
      `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle`,
      ["testJob", 100000, "0", "c1"]
    );

    await Job.remove(jobRes.rows[0].id);
    const res = await db.query("SELECT id FROM jobs WHERE id=1");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
