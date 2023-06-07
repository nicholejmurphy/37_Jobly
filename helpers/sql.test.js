const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

// Should create object with query fragments for SET & VALUES
describe("sqlForPartialUpdate", function () {
  // Given partial ddata create obj with query fragments
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
