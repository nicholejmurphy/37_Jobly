const { BadRequestError } = require("../expressError");

/** Create string fragments for UPDATE queries for SET & VALUES data
 *
 * Accepts partial or complete data for any instance ( Users || Companies || Jobs )
 *
 * ----- EXAMPLE -----
 * To update USER data:
 * {dataToUpdate} = {firstName: 'user', lastName: 'one'}
 *
 * SQL Columns to Update:
 * {jsToSql} = {firstName: 'first_name', lastName: 'last_name'}
 *
 * Checks if there is no data in dataToUpdate. Returns 'BadRequestError' if none.
 *
 * Maps dataToUpdate keys w/ query placeholders (`= $1`, `= $2`, `= $3`, etc.)
 * Then joins 'cols' to create a formated query fragment for SET data
 * >>> setCols = `first_name = $1, last_name = $2`
 *
 * Creates an array of values associated with placeholders in SET data
 * >>> values = ['user', 'one']
 *
 * Returns { setCols, values }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
