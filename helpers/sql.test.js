const { sqlForPartialUpdate, sqlForCompanyFilter } = require("./sql");
const { BadRequestError } = require("../expressError");

// Should create object with query fragments for SET & VALUES
describe("sqlForPartialUpdate", function () {
  // Given partial data create obj with query fragments
  test("works", function () {
    dataToUpdate = { firstName: "user", lastName: "one" };
    jsToSql = { firstName: "first_name", lastName: "last_name" };
    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
    expect(result).toEqual({
      setCols: '"first_name"=$1, "last_name"=$2',
      values: ["user", "one"],
    });
  });

  test("BadRequest if no data found", function () {
    // No data found returns BadRequestError
    try {
      const result = sqlForPartialUpdate({}, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// Should create object with query fragments for WHERE & VALUES
describe("sqlForCompanyFilter", function () {
  test("works: given all filter:value pairs", function () {
    params = { comp_name: "nex", minEmployees: 10, maxEmployees: 200 };
    const result = sqlForCompanyFilter(params);
    expect(result).toEqual({
      whereCols:
        '"comp_name" ILIKE $1 AND "num_employees" >= $2 AND "num_employees" <= $3',
      values: ["%nex%", 10, 200],
    });
  });

  test("BadRequest if invalid filter", function () {
    // invalid filter returns BadRequestError
    try {
      const result = sqlForCompanyFilter({ invalid: "invalid" });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});
